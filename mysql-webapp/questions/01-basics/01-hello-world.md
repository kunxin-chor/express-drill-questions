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

An Express `app` is a list of **(method, path, handler)** entries. On each
request, Express runs the first handler whose method **and** path match.

`supertest` takes the app object directly and exercises it in-memory — no
port binding, no `app.listen()`. That is why these exercises never call
`listen`, and why `module.exports = app` is required.
