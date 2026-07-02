const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { createDB } = require('mysql-memory-server');
const mysql = require('mysql2/promise');

const ROOT = __dirname;
const QUESTIONS_JSON = path.join(ROOT, 'questions.generated.json');
const RUNS_DIR = path.join(ROOT, '.runs');
const PORT = process.env.PORT || 5174;
const RUN_TIMEOUT_MS = 15_000;
const MAX_CODE_BYTES = 256 * 1024;
const MAX_OUTPUT_BYTES = 256 * 1024;

fs.mkdirSync(RUNS_DIR, { recursive: true });

// Connection details for the single in-memory MySQL server, populated at
// boot by startServer(). Every run/try gets its own logical database on
// this one server, mirroring how the Mongo app appends a db name to the URI.
let mysqlBase = { host: '127.0.0.1', port: 0, user: 'root', password: '' };
let adminPool = null; // long-lived pool used to CREATE/DROP per-run databases

// MySQL identifiers must be <=64 chars and we keep them to a safe charset.
function sanitizeDbName(name) {
  return name.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 64);
}

function getDbName(type, questionId, sessionId) {
  if (type === 'test') {
    return sanitizeDbName(`test_${questionId}_${crypto.randomBytes(6).toString('hex')}`);
  }
  const sess = sessionId ? sessionId.slice(0, 12) : 'anon';
  return sanitizeDbName(`try_${questionId}_${sess}`);
}

// mysql2 accepts a connection URI directly, so students connect with a single
// DATABASE_URL just like the Mongo app uses a single MONGODB_URI.
function buildDatabaseUrl(dbName) {
  const pw = mysqlBase.password ? `:${encodeURIComponent(mysqlBase.password)}` : '';
  return `mysql://${mysqlBase.user}${pw}@${mysqlBase.host}:${mysqlBase.port}/${dbName}`;
}

async function createRunDatabase(dbName) {
  // dbName is server-generated and sanitized; backtick-quote defensively.
  await adminPool.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
}

function dropRunDatabase(dbName) {
  // Best-effort; never blocks the response. Try databases are intentionally
  // left in place so data persists across a session's requests.
  adminPool
    .query(`DROP DATABASE IF EXISTS \`${dbName}\``)
    .catch((err) => console.error(`[server] drop ${dbName} failed:`, err.message));
}

const app = express();
// Trust the first proxy hop so X-Forwarded-For is honored on Render,
// Codespaces, etc. Required for rate-limit by IP.
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '512kb' }));

/* ------------------------------ rate limit ------------------------------ */

// Per-IP cap on the spawn-heavy endpoints (Run and Try). Each call forks a
// Node child process, so unrestricted use can wedge the box. Defaults give
// a real user plenty of headroom while throttling runaway loops.
const spawnLimiter = rateLimit({
  windowMs: 60_000,
  max: Number(process.env.RATE_LIMIT_PER_MIN || 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'rate limit exceeded — please wait a moment before retrying',
  },
});

/* ---------------------------- question store ---------------------------- */

let cache = { categories: [], byId: new Map(), mtimeMs: 0 };

function loadQuestions() {
  if (!fs.existsSync(QUESTIONS_JSON)) {
    cache = { categories: [], byId: new Map(), mtimeMs: 0 };
    return;
  }
  const stat = fs.statSync(QUESTIONS_JSON);
  if (stat.mtimeMs === cache.mtimeMs) return; // already fresh
  const data = JSON.parse(fs.readFileSync(QUESTIONS_JSON, 'utf8'));
  const byId = new Map();
  for (const cat of data.categories || []) {
    for (const q of cat.questions || []) {
      byId.set(q.id, q);
    }
  }
  cache = { categories: data.categories || [], byId, mtimeMs: stat.mtimeMs };
  console.log(
    `[server] loaded ${byId.size} questions across ${cache.categories.length} categories`,
  );
}

loadQuestions();
// Reload on file change (cheap; just an mtime check on each request).
function ensureFresh() {
  try {
    loadQuestions();
  } catch (err) {
    console.error('[server] failed to reload questions:', err.message);
  }
}

/* -------------------------------- routes -------------------------------- */

app.get('/api/questions', (_req, res) => {
  ensureFresh();
  const tree = cache.categories.map((c) => ({
    slug: c.slug,
    title: c.title,
    intro: c.intro,
    questions: c.questions.map((q) => ({
      id: q.id,
      title: q.title,
      categorySlug: q.categorySlug,
    })),
  }));
  res.json({ categories: tree });
});

app.get('/api/questions/:id', (req, res) => {
  ensureFresh();
  const q = cache.byId.get(req.params.id);
  if (!q) return res.status(404).json({ error: 'unknown question' });
  res.json(q);
});

app.post('/api/questions/:id/run', async (req, res) => {
  ensureFresh();
  const q = cache.byId.get(req.params.id);
  if (!q) return res.status(404).json({ error: 'unknown question' });

  const code = typeof req.body?.code === 'string' ? req.body.code : '';
  const ejsCode = typeof req.body?.ejsCode === 'string' ? req.body.ejsCode : '';
  if (Buffer.byteLength(code, 'utf8') > MAX_CODE_BYTES || Buffer.byteLength(ejsCode, 'utf8') > MAX_CODE_BYTES) {
    return res.status(413).json({ error: 'code too large' });
  }
  if (!q.testCode) {
    return res.status(500).json({ error: 'question has no tests' });
  }

  let runDir;
  try {
    runDir = path.join(RUNS_DIR, crypto.randomBytes(8).toString('hex'));
    fs.mkdirSync(runDir, { recursive: true });
    fs.writeFileSync(path.join(runDir, 'app.js'), code, 'utf8');
    if (ejsCode) {
      fs.mkdirSync(path.join(runDir, 'views'), { recursive: true });
      fs.writeFileSync(path.join(runDir, 'views', 'index.ejs'), ejsCode, 'utf8');
    }
    fs.writeFileSync(path.join(runDir, 'app.test.js'), q.testCode, 'utf8');
  } catch (err) {
    if (runDir) cleanup(runDir);
    return res.status(500).json({ error: err.message });
  }

  const sessionId = req.headers['x-session-id'] || '';
  const testDb = getDbName('test', req.params.id, sessionId);
  try {
    await createRunDatabase(testDb);
  } catch (err) {
    cleanup(runDir);
    return res.status(500).json({ error: `failed to create test database: ${err.message}` });
  }
  const databaseUrl = buildDatabaseUrl(testDb);

  const jestBin = path.join(ROOT, 'node_modules', 'jest', 'bin', 'jest.js');
  const child = spawn(
    process.execPath,
    [
      jestBin,
      '--colors=false',
      '--no-coverage',
      '--testEnvironment=node',
      '--forceExit',
      '--rootDir',
      ROOT,
      '--runTestsByPath',
      path.join(runDir, 'app.test.js'),
    ],
    { cwd: runDir, env: { ...process.env, CI: 'true', FORCE_COLOR: '0', DATABASE_URL: databaseUrl } },
  );

  let stdout = '';
  let stderr = '';
  let truncated = false;
  const appendCapped = (current, chunk) => {
    if (current.length >= MAX_OUTPUT_BYTES) {
      truncated = true;
      return current;
    }
    return current + chunk.toString();
  };

  const started = Date.now();
  child.stdout.on('data', (b) => (stdout = appendCapped(stdout, b)));
  child.stderr.on('data', (b) => (stderr = appendCapped(stderr, b)));

  const killer = setTimeout(() => {
    try {
      child.kill('SIGKILL');
    } catch {}
  }, RUN_TIMEOUT_MS);

  let done = false;
  const finish = (payload) => {
    if (done) return;
    done = true;
    clearTimeout(killer);
    cleanup(runDir);
    dropRunDatabase(testDb);
    res.json(payload);
  };

  child.once('close', (exitCode, signal) => {
    const timedOut = signal === 'SIGKILL';
    finish({
      passed: exitCode === 0 && !timedOut,
      exitCode,
      timedOut,
      truncated,
      durationMs: Date.now() - started,
      stdout,
      stderr,
    });
  });

  child.once('error', (err) => {
    finish({
      passed: false,
      error: err.message,
      stdout,
      stderr,
      durationMs: Date.now() - started,
    });
  });
});

app.post('/api/questions/:id/request', spawnLimiter, async (req, res) => {
  ensureFresh();
  const q = cache.byId.get(req.params.id);
  if (!q) return res.status(404).json({ error: 'unknown question' });

  const { code, ejsCode, method, path: urlPath, headers, body } = req.body || {};
  if (typeof code !== 'string') {
    return res.status(400).json({ error: 'code required' });
  }
  if (Buffer.byteLength(code, 'utf8') > MAX_CODE_BYTES || (ejsCode && Buffer.byteLength(ejsCode, 'utf8') > MAX_CODE_BYTES)) {
    return res.status(413).json({ error: 'code too large' });
  }
  if (typeof method !== 'string' || typeof urlPath !== 'string') {
    return res.status(400).json({ error: 'method and path required' });
  }

  let runDir;
  try {
    runDir = path.join(RUNS_DIR, crypto.randomBytes(8).toString('hex'));
    fs.mkdirSync(runDir, { recursive: true });
    fs.writeFileSync(path.join(runDir, 'app.js'), code, 'utf8');
    if (ejsCode) {
      fs.mkdirSync(path.join(runDir, 'views'), { recursive: true });
      fs.writeFileSync(path.join(runDir, 'views', 'index.ejs'), ejsCode, 'utf8');
    }
  } catch (err) {
    if (runDir) cleanup(runDir);
    return res.status(500).json({ error: err.message });
  }

  const sessionId = req.headers['x-session-id'] || '';
  const tryDb = getDbName('try', req.params.id, sessionId);
  // Try databases are stable per (question, session) and are NOT dropped, so
  // data written in one request persists into the next — matching the Mongo
  // app's behavior for CRUD-style questions.
  try {
    await createRunDatabase(tryDb);
  } catch (err) {
    cleanup(runDir);
    return res.status(500).json({ error: `failed to create database: ${err.message}` });
  }
  const databaseUrl = buildDatabaseUrl(tryDb);
  const env = { ...process.env, NODE_ENV: 'development', DATABASE_URL: databaseUrl };

  // Run seed script first if the question defines one.
  if (q.seedCode) {
    try {
      fs.writeFileSync(path.join(runDir, 'seed.js'), q.seedCode, 'utf8');
      await runSeed(runDir, env);
    } catch (err) {
      cleanup(runDir);
      return res.status(500).json({ error: `seed failed: ${err.message}` });
    }
  }

  const driver = path.join(ROOT, 'tools', 'request-runner.js');
  const spec = JSON.stringify({ method, path: urlPath, headers, body });

  const child = spawn(process.execPath, [driver, spec], {
    cwd: runDir,
    env,
  });

  let stdout = '';
  let stderr = '';
  let truncated = false;
  const appendCapped = (current, chunk) => {
    if (current.length >= MAX_OUTPUT_BYTES) {
      truncated = true;
      return current;
    }
    return current + chunk.toString();
  };

  const started = Date.now();
  child.stdout.on('data', (b) => (stdout = appendCapped(stdout, b)));
  child.stderr.on('data', (b) => (stderr = appendCapped(stderr, b)));

  const killer = setTimeout(() => {
    try {
      child.kill('SIGKILL');
    } catch {}
  }, RUN_TIMEOUT_MS);

  let done = false;
  const finish = (payload, statusCode = 200) => {
    if (done) return;
    done = true;
    clearTimeout(killer);
    cleanup(runDir);
    res.status(statusCode).json(payload);
  };

  child.once('close', (exitCode, signal) => {
    const timedOut = signal === 'SIGKILL';
    if (timedOut) {
      return finish(
        { error: 'request timed out', timedOut: true, durationMs: Date.now() - started, stderr },
        200,
      );
    }
    let parsed = null;
    if (stdout) {
      try {
        parsed = JSON.parse(stdout);
      } catch {
        // fall through
      }
    }
    if (parsed && exitCode === 0) {
      return finish({
        ...parsed,
        truncated,
        elapsedMs: Date.now() - started,
      });
    }
    if (parsed && parsed.error) {
      return finish(
        { error: parsed.error, where: parsed.where, stderr, exitCode },
        200,
      );
    }
    finish(
      {
        error: 'driver crashed',
        exitCode,
        stdout,
        stderr,
        durationMs: Date.now() - started,
      },
      200,
    );
  });

  child.once('error', (err) => {
    finish({ error: err.message, stderr }, 500);
  });
});

function runSeed(cwd, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['seed.js'], { cwd, env });
    let stderr = '';
    child.stderr.on('data', (b) => (stderr += b.toString()));
    child.once('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `seed exited with code ${code}`));
    });
    child.once('error', (err) => reject(err));
  });
}

function cleanup(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // best-effort
  }
}

/* ------------------ static client (single-port mode) -------------------- */

const CLIENT_DIST = path.join(ROOT, 'client', 'dist');
if (fs.existsSync(path.join(CLIENT_DIST, 'index.html'))) {
  app.use(express.static(CLIENT_DIST));
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
  console.log('[server] serving built client from client/dist');
} else {
  app.get('/', (_req, res) => {
    res
      .status(200)
      .type('text/html')
      .send(
        `<!doctype html><meta charset="utf-8"><title>Express Practice</title>
<body style="font:14px system-ui;max-width:720px;margin:40px auto;padding:0 16px">
<h1>SQL Practice — server is up</h1>
<p>The client has not been built yet.</p>
<pre>npm run dev</pre>
<p>or build single-port:</p>
<pre>npm run build
npm start</pre>
</body>`,
      );
  });
}

let memoryDb = null; // the mysql-memory-server handle (kept for graceful stop)

async function startServer() {
  // Boot one in-memory MySQL server. The first boot on a fresh machine
  // downloads the MySQL binary from MySQL's CDN (cached in the OS temp dir),
  // so cold starts are slower until the cache is warm — see README.
  console.log('[server] starting MySQL (first run may download the binary)…');
  memoryDb = await createDB({
    version: process.env.MYSQL_VERSION || '8.4.x',
    dbName: 'sqlpractice', // throwaway default db; per-run dbs are created on demand
    xEnabled: 'OFF', // no MySQL X plugin — saves a port and some memory
  });
  mysqlBase = {
    host: '127.0.0.1',
    port: memoryDb.port,
    user: memoryDb.username,
    password: '',
  };
  adminPool = mysql.createPool({
    host: mysqlBase.host,
    port: mysqlBase.port,
    user: mysqlBase.user,
    password: mysqlBase.password,
    connectionLimit: 5,
    waitForConnections: true,
  });
  console.log(`[server] MySQL ready on port ${mysqlBase.port}`);

  app.listen(PORT, () => {
    console.log(`[server] http://localhost:${PORT}`);
  });
}

async function shutdown() {
  try {
    if (adminPool) await adminPool.end();
    if (memoryDb) await memoryDb.stop();
  } catch (err) {
    console.error('[server] shutdown error:', err.message);
  } finally {
    process.exit(0);
  }
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startServer().catch((err) => {
  console.error('[server] failed to start:', err);
  process.exit(1);
});
