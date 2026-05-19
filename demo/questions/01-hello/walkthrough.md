# Walkthrough — Hello route

## Mental model

An Express `app` is essentially a list of **(method, path, handler)** entries.
When a request arrives, Express walks the list top-to-bottom and runs the
first handler whose method and path match.

```js
const express = require('express');
const app = express();
```

`express()` returns a fresh app with zero routes. A request to any path
returns **404** until you register something.

## Registering a route

```js
app.get('/hello', (req, res) => {
  res.status(200).send('hello world');
});
```

- `app.get` — match only `GET` requests.
- `/hello` — exact path match. `/hello/` also matches by default; `/hello/world`
  does not.
- `(req, res)` — the handler. `req` is the incoming request; `res` is the
  response you build up and send.
- `res.status(200)` — sets the status code. Express defaults to 200 anyway,
  so `res.send('hello world')` alone would also pass. Being explicit is a
  good habit.
- `res.send(body)` — ends the response. For a string, `Content-Type` is set
  to `text/html; charset=utf-8`. Use `res.json(obj)` when returning JSON,
  `res.type('text/plain')` if you need strict plain text.

## Why export the app?

```js
module.exports = app;
```

The tests do:

```js
const app = require('./app');
const request = require('supertest');
await request(app).get('/hello');
```

`supertest` accepts an Express app directly, starts it on an ephemeral port
(or hooks into its request handler), sends the request, and returns the
response. That's why you do **not** call `app.listen(...)` in test-driven
exercises — supertest handles it.

## Common mistakes

- **Calling `app.listen`** in the file that tests import. It's not wrong, but
  it opens a real port and can cause "port already in use" errors. Keep
  `listen` in a separate `server.js` in real projects.
- **Using `res.end('hello world')`**. It works but skips `Content-Type`
  handling. Prefer `res.send` for body content.
- **Forgetting `module.exports = app`**. Tests will import `undefined` and
  fail with a cryptic message.
