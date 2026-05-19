# Problem

Your first Express route.

In `app.js`, register a `GET /` route that responds with:

- HTTP status **200**
- Body: the plain text `hello world`

Keep `module.exports = app` at the bottom — the tests need to import your
app.

## Hints

- `app.get(path, handler)` registers a route.
- The handler receives `(req, res)`.
- `res.send('hello world')` sends the body. Status defaults to 200, but
  `res.status(200).send(...)` makes the intent explicit.

# Starter

```js
const express = require('express');
const app = express();

// TODO: register GET / so it responds with 200 and body "hello world"

module.exports = app;
```

# Solution

```js
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.status(200).send('hello world');
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const app = require('./app');

describe('GET /', () => {
  test('responds with status 200', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
  });

  test('body is exactly "hello world"', async () => {
    const res = await request(app).get('/');
    expect(res.text).toBe('hello world');
  });
});
```

# Walkthrough

## Mental model

An Express `app` is a list of **(method, path, handler)** entries. On each
request, Express walks the list top-to-bottom and runs the first handler
whose method **and** path match. If nothing matches, Express sends a 404.

```js
const express = require('express');
const app = express();
```

`express()` returns a fresh app with zero routes. Every request returns
404 until you register something.

## Registering the route

```js
app.get('/', (req, res) => {
  res.status(200).send('hello world');
});
```

- `app.get` — match `GET` only. `POST /` would still 404.
- `'/'` — the root path.
- `(req, res)` — the request and response objects.
- `res.status(200)` — explicit status. 200 is the default; being explicit
  is a habit worth forming for non-default codes.
- `res.send(body)` — ends the response. For a string, sets
  `Content-Type: text/html; charset=utf-8`.

## Why export the app?

```js
module.exports = app;
```

The test file does:

```js
const app = require('./app');
const request = require('supertest');
await request(app).get('/');
```

`supertest` takes the app object directly and exercises it in-memory — no
port binding, no `app.listen()`. That's why these exercises never call
`listen`.

## Common mistakes

- Forgetting `module.exports = app` — tests import `undefined`.
- Using `res.end('hello world')` — works, but skips `Content-Type` setup.
  Prefer `res.send`.
- Adding `app.listen(...)` — unnecessary here, and a bad habit. In real
  projects keep `listen` in a separate `server.js`.
