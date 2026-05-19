# Problem

Read data from the URL's **query string**.

Add a `GET /hello` route that responds with `Hello, <name>!`, where
`<name>` comes from the `name` query parameter. If `name` is missing or
empty, default to `stranger`.

| Request                          | Response body            |
| -------------------------------- | ------------------------ |
| `GET /hello?name=Ada`            | `Hello, Ada!`            |
| `GET /hello?name=Grace%20Hopper` | `Hello, Grace Hopper!`   |
| `GET /hello` (no query)          | `Hello, stranger!`       |
| `GET /hello?name=`               | `Hello, stranger!`       |

## Hints

- Query parameters live on `req.query`. `/hello?name=Ada` →
  `req.query.name === 'Ada'`.
- Missing param → `undefined`. Empty `?name=` → `''` (empty string).
- The idiom `req.query.name || 'stranger'` handles both cases.

# Starter

```js
const express = require('express');
const app = express();

// TODO: register GET /hello.
// - If ?name=<value> is provided, respond with `Hello, <value>!`.
// - Otherwise respond with `Hello, stranger!`.

module.exports = app;
```

# Solution

```js
const express = require('express');
const app = express();

app.get('/hello', (req, res) => {
  const name = req.query.name || 'stranger';
  res.status(200).send(`Hello, ${name}!`);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const app = require('./app');

describe('GET /hello', () => {
  test('uses the name query param', async () => {
    const res = await request(app).get('/hello').query({ name: 'Ada' });
    expect(res.status).toBe(200);
    expect(res.text).toBe('Hello, Ada!');
  });

  test('handles names with spaces', async () => {
    const res = await request(app)
      .get('/hello')
      .query({ name: 'Grace Hopper' });
    expect(res.text).toBe('Hello, Grace Hopper!');
  });

  test('falls back to "stranger" when name is missing', async () => {
    const res = await request(app).get('/hello');
    expect(res.status).toBe(200);
    expect(res.text).toBe('Hello, stranger!');
  });

  test('falls back to "stranger" when name is empty', async () => {
    const res = await request(app).get('/hello?name=');
    expect(res.text).toBe('Hello, stranger!');
  });
});
```

# Walkthrough

## Where query params come from

For `/hello?name=Ada&lang=en`, Express parses the part after `?` into
`req.query`:

```js
req.query // => { name: 'Ada', lang: 'en' }
```

Parsing is automatic — no middleware needed. (Body parsing for `POST`
requests *does* need middleware. We'll meet that later.)

## Values are strings

Query values arrive as strings, never numbers or booleans:

```
/items?limit=10  →  req.query.limit === '10'   // string
/flag?on=true    →  req.query.on === 'true'    // string
```

If you need a number, coerce explicitly and validate the result:
`const limit = Number(req.query.limit) || 20;`.

Repeated keys become arrays: `/q?tag=a&tag=b` →
`req.query.tag === ['a', 'b']`.

## "Missing" vs "empty"

Two distinct cases both mean "no name given":

- Missing: `/hello` → `req.query.name === undefined`
- Empty: `/hello?name=` → `req.query.name === ''`

A single idiom handles both:

```js
const name = req.query.name || 'stranger';
```

`||` falls through for `undefined`, `null`, and `''` — exactly what we
want. If you wanted to **keep** empty strings as a legitimate value, use
`??` (nullish coalescing), which only falls through for `undefined` /
`null`.

## Route param vs query string

| Style        | URL                    | Read from         | Use when…                              |
| ------------ | ---------------------- | ----------------- | -------------------------------------- |
| Route param  | `/hello/Ada`           | `req.params.name` | The value identifies the resource.     |
| Query string | `/hello?name=Ada`      | `req.query.name`  | The value is a modifier (filter, etc). |
| Body         | `POST /hello {name}`   | `req.body.name`   | The value is data being submitted.     |

Picking the right style is a design call. The HTTP method and the URL
shape are part of your API contract; pick them deliberately.
