#!/usr/bin/env node
/**
 * Fires a single HTTP request at the student's Express app via supertest
 * and prints the response as JSON on stdout. Designed to be spawned as a
 * child process by the server's /api/questions/:id/request endpoint.
 *
 * Usage:
 *   node request-runner.js '<json-spec>'
 *
 * Spec shape:
 *   {
 *     "method": "GET"|"POST"|...,
 *     "path":   "/hello?name=Ada",
 *     "headers": { "X-Foo": "bar" },         // optional
 *     "body":    "raw string" | { ... }      // optional
 *   }
 *
 * Response shape (stdout JSON):
 *   {
 *     "status":   200,
 *     "headers":  { ... },
 *     "body":     "raw response text",
 *     "durationMs": 12,
 *     "ok":       true
 *   }
 *
 * On error, exit code 2 with `{ "error": "...", "where": "load|request" }`.
 */

const path = require('path');

let spec;
try {
  spec = JSON.parse(process.argv[2] || '{}');
} catch (err) {
  process.stdout.write(JSON.stringify({ error: 'invalid spec JSON', where: 'parse' }));
  process.exit(2);
}

if (!spec.method || !spec.path) {
  process.stdout.write(JSON.stringify({ error: 'method and path required', where: 'parse' }));
  process.exit(2);
}

const method = String(spec.method).toLowerCase();
const ALLOWED = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options']);
if (!ALLOWED.has(method)) {
  process.stdout.write(JSON.stringify({ error: `unsupported method: ${spec.method}`, where: 'parse' }));
  process.exit(2);
}

let app;
try {
  app = require(path.resolve(process.cwd(), 'app'));
} catch (err) {
  process.stdout.write(
    JSON.stringify({ error: err.message, stack: err.stack, where: 'load' }),
  );
  process.exit(2);
}

const request = require('supertest');

(async () => {
  try {
    let r = request(app)[method](spec.path);
    if (spec.headers && typeof spec.headers === 'object') {
      for (const [k, v] of Object.entries(spec.headers)) {
        if (typeof v === 'string') r = r.set(k, v);
      }
    }
    if (spec.body !== undefined && spec.body !== null && spec.body !== '') {
      r = r.send(spec.body);
    }
    const started = Date.now();
    const res = await r;
    const out = {
      status: res.status,
      headers: res.headers,
      body: typeof res.text === 'string' ? res.text : '',
      durationMs: Date.now() - started,
      ok: res.status >= 200 && res.status < 400,
    };
    process.stdout.write(JSON.stringify(out));
    process.exit(0);
  } catch (err) {
    process.stdout.write(
      JSON.stringify({ error: err.message, stack: err.stack, where: 'request' }),
    );
    process.exit(2);
  }
})();
