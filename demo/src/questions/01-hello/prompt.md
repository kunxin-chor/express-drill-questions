# 1. Hello route

Your first Express route.

## Task

In `app.js`, add a `GET /hello` route that responds with:

- HTTP status **200**
- Body: the plain text `hello world`

The app must still be exported via `module.exports = app` so the tests can
import it.

## Hints

- Use `app.get(path, handler)` to register a route.
- The handler receives `(req, res)`.
- `res.status(200).send('hello world')` sets both status and body.

## How the tests work

The test file uses [supertest](https://github.com/ladjs/supertest) to send
fake HTTP requests directly to your Express app — no port, no listening
server needed.

Switch to the **code** tab, edit `app.js`, then press **Run** in the Tests
panel.
