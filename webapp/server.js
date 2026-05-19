const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const ROOT = __dirname;
const QUESTIONS_JSON = path.join(ROOT, 'questions.generated.json');
const RUNS_DIR = path.join(ROOT, '.runs');
const PORT = process.env.PORT || 5174;
const RUN_TIMEOUT_MS = 15_000;
const MAX_CODE_BYTES = 256 * 1024;
const MAX_OUTPUT_BYTES = 256 * 1024;

fs.mkdirSync(RUNS_DIR, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json({ limit: '512kb' }));

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

app.post('/api/questions/:id/run', (req, res) => {
  ensureFresh();
  const q = cache.byId.get(req.params.id);
  if (!q) return res.status(404).json({ error: 'unknown question' });

  const code = typeof req.body?.code === 'string' ? req.body.code : '';
  if (Buffer.byteLength(code, 'utf8') > MAX_CODE_BYTES) {
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
    fs.writeFileSync(path.join(runDir, 'app.test.js'), q.testCode, 'utf8');
  } catch (err) {
    if (runDir) cleanup(runDir);
    return res.status(500).json({ error: err.message });
  }

  const jestBin = path.join(ROOT, 'node_modules', 'jest', 'bin', 'jest.js');
  const child = spawn(
    process.execPath,
    [
      jestBin,
      '--colors=false',
      '--no-coverage',
      '--testEnvironment=node',
      '--rootDir',
      ROOT,
      '--runTestsByPath',
      path.join(runDir, 'app.test.js'),
    ],
    { cwd: runDir, env: { ...process.env, CI: 'true', FORCE_COLOR: '0' } },
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

app.post('/api/questions/:id/request', (req, res) => {
  ensureFresh();
  const q = cache.byId.get(req.params.id);
  if (!q) return res.status(404).json({ error: 'unknown question' });

  const { code, method, path: urlPath, headers, body } = req.body || {};
  if (typeof code !== 'string') {
    return res.status(400).json({ error: 'code required' });
  }
  if (Buffer.byteLength(code, 'utf8') > MAX_CODE_BYTES) {
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
  } catch (err) {
    if (runDir) cleanup(runDir);
    return res.status(500).json({ error: err.message });
  }

  const driver = path.join(ROOT, 'tools', 'request-runner.js');
  const spec = JSON.stringify({ method, path: urlPath, headers, body });

  const child = spawn(process.execPath, [driver, spec], {
    cwd: runDir,
    env: { ...process.env, NODE_ENV: 'development' },
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
<h1>Express Practice — server is up</h1>
<p>The client has not been built yet.</p>
<pre>npm run dev</pre>
<p>or build single-port:</p>
<pre>npm run build
npm start</pre>
</body>`,
      );
  });
}

app.listen(PORT, () => {
  console.log(`[server] http://localhost:${PORT}`);
});
