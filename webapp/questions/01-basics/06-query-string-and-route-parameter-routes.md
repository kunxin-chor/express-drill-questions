# Problem

Create two Express routes: one that reads from the **query string** and one
that reads from a **route parameter**.

Add these routes:

1. `GET /search?term=<term>`
   - Respond with `` `Searching for <term>` ``.
   - If `term` is missing or empty, use `nothing`.
2. `GET /items/:id`
   - Respond with `` `Item <id>` ``.

| Request                    | Response body           |
| -------------------------- | ----------------------- |
| `GET /search?term=express` | `Searching for express` |
| `GET /search`              | `Searching for nothing` |
| `GET /items/abc123`        | `Item abc123`           |

## Hints

- Query string values come from `req.query`.
- Route parameter values come from `req.params`.
- These are two separate routes, so call `app.get(...)` twice.

# Starter

```js
const express = require('express');
const app = express();

// TODO: register GET /search that reads term from req.query.
// TODO: register GET /items/:id that reads id from req.params.

module.exports = app;
```

# Solution

```js
const express = require('express');
const app = express();

app.get('/search', (req, res) => {
  const term = req.query.term || 'nothing';
  res.status(200).send(`Searching for ${term}`);
});

app.get('/items/:id', (req, res) => {
  res.status(200).send(`Item ${req.params.id}`);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const app = require('./app');

describe('GET /search', () => {
  test('uses the term query parameter', async () => {
    const res = await request(app).get('/search').query({ term: 'express' });

    expect(res.status).toBe(200);
    expect(res.text).toBe('Searching for express');
  });

  test('defaults missing term to nothing', async () => {
    const res = await request(app).get('/search');
    expect(res.text).toBe('Searching for nothing');
  });

  test('defaults empty term to nothing', async () => {
    const res = await request(app).get('/search?term=');
    expect(res.text).toBe('Searching for nothing');
  });
});

describe('GET /items/:id', () => {
  test('uses the id route parameter', async () => {
    const res = await request(app).get('/items/abc123');

    expect(res.status).toBe(200);
    expect(res.text).toBe('Item abc123');
  });

  test('GET /items without an id does not match', async () => {
    const res = await request(app).get('/items');
    expect(res.status).toBe(404);
  });
});
```

# Walkthrough

## Two routes, two sources

The `/search` route reads from the query string:

```js
const term = req.query.term || 'nothing';
```

The `/items/:id` route reads from the URL path:

```js
const id = req.params.id;
```

Both routes can live in the same Express app. Express checks the incoming
method and path, then runs the matching handler.

## Compare the URLs

| Route style   | Example URL              | Read from        |
| ------------- | ------------------------ | ---------------- |
| Query string  | `/search?term=express`   | `req.query.term` |
| Route param   | `/items/abc123`          | `req.params.id`  |
