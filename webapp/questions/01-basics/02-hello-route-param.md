# Problem

Read data from the URL path using a **route parameter**.

Add a `GET /hello/:name` route that responds with:

- Status **200**
- Body: `` `Hello, <name>!` `` where `<name>` is whatever the client put in
  that segment of the URL.

| Request                     | Response body         |
| --------------------------- | --------------------- |
| `GET /hello/Ada`            | `Hello, Ada!`         |
| `GET /hello/Grace%20Hopper` | `Hello, Grace Hopper!` |

The starter is empty — write the route yourself.

## Hints

- The colon in `:name` declares a parameter. Whatever the client puts in
  that path segment becomes available as `req.params.name`.
- Use a template literal: `` `Hello, ${name}!` ``.
- URL-encoded characters (like `%20` for a space) are decoded automatically
  by Express before populating `req.params`.

# Starter

```js
const express = require('express');
const app = express();

// TODO: register GET /hello/:name that responds with `Hello, <name>!`

module.exports = app;
```

# Solution

```js
const express = require('express');
const app = express();

app.get('/hello/:name', (req, res) => {
  res.status(200).send(`Hello, ${req.params.name}!`);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const app = require('./app');

describe('GET /hello/:name', () => {
  test('uses the name from the URL', async () => {
    const res = await request(app).get('/hello/Ada');
    expect(res.status).toBe(200);
    expect(res.text).toBe('Hello, Ada!');
  });

  test('decodes URL-encoded names', async () => {
    const res = await request(app).get('/hello/Grace%20Hopper');
    expect(res.text).toBe('Hello, Grace Hopper!');
  });
});

describe('routing strictness', () => {
  test('GET /hello (no name) is not the same route', async () => {
    const res = await request(app).get('/hello');
    expect(res.status).toBe(404);
  });
});
```

# Walkthrough

## Route parameters

A path segment that starts with `:` is a **named parameter**. It matches
any non-`/` characters in that segment.

```js
app.get('/hello/:name', (req, res) => {
  console.log(req.params); // { name: 'Ada' }
});
```

Multiple parameters are fine: `'/users/:userId/posts/:postId'` makes both
`req.params.userId` and `req.params.postId` available.

## Match scope

- `/hello/Ada` → matches, `req.params.name === 'Ada'`.
- `/hello/Ada/extra` → does **not** match; `:name` only consumes one
  segment.
- `/hello` → does **not** match. The `:name` segment is required. That's
  why the third test passes for free — Express returns 404 when no route
  matches.

## URL decoding

Express decodes the parameter value before exposing it. `/hello/Grace%20Hopper`
yields `req.params.name === 'Grace Hopper'`. You almost never need to call
`decodeURIComponent` yourself for route params.

## Output safety reminder

We're echoing user input straight into the response body. In a real HTML
response that would be an **XSS** opportunity. For a plain text response
it's harmless, but in production code remember to escape (or use a
templating engine that auto-escapes) when interpolating user input into
HTML.

## Versus query strings (next question)

| Style        | URL                  | Read from           |
| ------------ | -------------------- | ------------------- |
| Route param  | `/hello/Ada`         | `req.params.name`   |
| Query string | `/hello?name=Ada`    | `req.query.name`    |

Use route params for **identifying** a resource (path is part of its
identity). Use query strings for **modifiers** like filters, search terms,
or pagination.
