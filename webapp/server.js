const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = __dirname;
const QUESTIONS_DIR = path.join(ROOT, 'questions');
const PORT = process.env.PORT || 5174;

const app = express();
app.use(cors());
app.use(express.json({ limit: '512kb' }));

/* ------------------------------- helpers -------------------------------- */

function listQuestionIds() {
  return fs
    .readdirSync(QUESTIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function safeQuestionDir(id) {
  // Guard against path traversal.
  if (!/^[\w-]+$/.test(id)) throw new Error('invalid question id');
  const dir = path.join(QUESTIONS_DIR, id);
  if (!fs.existsSync(dir)) throw new Error('unknown question');
  return dir;
}

function readOptional(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function titleFromPrompt(promptMd, fallback) {
  const m = promptMd.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : fallback;
}

function ensureAppFile(dir) {
  const appPath = path.join(dir, 'app.js');
  if (!fs.existsSync(appPath)) {
    const starter = readOptional(path.join(dir, 'starter.js'));
    fs.writeFileSync(appPath, starter, 'utf8');
  }
  return appPath;
}

/* -------------------------------- routes -------------------------------- */

app.get('/api/questions', (_req, res) => {
  const items = listQuestionIds().map((id) => {
    const promptMd = readOptional(path.join(QUESTIONS_DIR, id, 'prompt.md'));
    return { id, title: titleFromPrompt(promptMd, id) };
  });
  res.json(items);
});

app.get('/api/questions/:id', (req, res) => {
  try {
    const dir = safeQuestionDir(req.params.id);
    ensureAppFile(dir);
    const promptMd = readOptional(path.join(dir, 'prompt.md'));
    res.json({
      id: req.params.id,
      title: titleFromPrompt(promptMd, req.params.id),
      prompt: promptMd,
      walkthrough: readOptional(path.join(dir, 'walkthrough.md')),
      starter: readOptional(path.join(dir, 'starter.js')),
      solution: readOptional(path.join(dir, 'solution.js')),
      appCode: readOptional(path.join(dir, 'app.js')),
      testCode: readOptional(path.join(dir, 'app.test.js')),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/questions/:id/app', (req, res) => {
  try {
    const dir = safeQuestionDir(req.params.id);
    const code = typeof req.body?.code === 'string' ? req.body.code : '';
    fs.writeFileSync(path.join(dir, 'app.js'), code, 'utf8');
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/questions/:id/reset', (req, res) => {
  try {
    const dir = safeQuestionDir(req.params.id);
    const starter = readOptional(path.join(dir, 'starter.js'));
    fs.writeFileSync(path.join(dir, 'app.js'), starter, 'utf8');
    res.json({ ok: true, appCode: starter });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/questions/:id/run', (req, res) => {
  try {
    const dir = safeQuestionDir(req.params.id);
    ensureAppFile(dir);

    // If the client sent updated code, save before running.
    if (typeof req.body?.code === 'string') {
      fs.writeFileSync(path.join(dir, 'app.js'), req.body.code, 'utf8');
    }

    const testFile = path.join(dir, 'app.test.js');
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
        testFile,
      ],
      { cwd: ROOT, env: { ...process.env, CI: 'true', FORCE_COLOR: '0' } },
    );

    let stdout = '';
    let stderr = '';
    const started = Date.now();

    child.stdout.on('data', (b) => (stdout += b.toString()));
    child.stderr.on('data', (b) => (stderr += b.toString()));

    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
    }, 15000);

    child.on('close', (exitCode) => {
      clearTimeout(timeout);
      res.json({
        exitCode,
        passed: exitCode === 0,
        durationMs: Date.now() - started,
        stdout,
        stderr,
      });
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      res.status(500).json({ error: err.message, stdout, stderr });
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ------------------ static client (single-port mode) -------------------- */

const CLIENT_DIST = path.join(ROOT, 'client', 'dist');
if (fs.existsSync(path.join(CLIENT_DIST, 'index.html'))) {
  app.use(express.static(CLIENT_DIST));
  // SPA fallback: anything not under /api gets index.html.
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
<p>The client has not been built yet. Two options:</p>
<h2>Dev (live reload, two ports)</h2>
<pre>npm run dev</pre>
<p>then open <a href="http://localhost:5173">http://localhost:5173</a>.</p>
<h2>Single-port (recommended for Codespaces)</h2>
<pre>npm run build
npm start</pre>
<p>then reload this page.</p>
</body>`,
      );
  });
}

app.listen(PORT, () => {
  console.log(`[server] http://localhost:${PORT}`);
});
