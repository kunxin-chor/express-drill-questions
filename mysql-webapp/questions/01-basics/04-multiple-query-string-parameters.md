# Problem

Read more than one value from the URL's **query string**.

Add a `GET /greet` route that uses two query parameters:

- `firstName`
- `lastName`

It should respond with:

- Status **200**
- Body: `` `Hello, <firstName> <lastName>!` ``

If either query parameter is missing or empty, default that part to `stranger`.

| Request                                      | Response body              |
| -------------------------------------------- | -------------------------- |
| `GET /greet?firstName=Ada&lastName=Lovelace` | `Hello, Ada Lovelace!`     |
| `GET /greet?firstName=Grace`                 | `Hello, Grace stranger!`   |
| `GET /greet?lastName=Hopper`                 | `Hello, stranger Hopper!`  |
| `GET /greet`                                 | `Hello, stranger stranger!` |

## Hints

- Query parameters live on `req.query`.
- Read `req.query.firstName` and `req.query.lastName` separately.
- The same fallback pattern works for each value: `req.query.firstName || 'stranger'`.

# Starter

```js
const express = require('express');
const app = express();

// TODO: register GET /greet.
// - Read firstName and lastName from req.query.
// - Default any missing or empty value to 'stranger'.
// - Respond with `Hello, <firstName> <lastName>!`.

module.exports = app;
```

# Solution

```js
const express = require('express');
const app = express();

app.get('/greet', (req, res) => {
  const firstName = req.query.firstName || 'stranger';
  const lastName = req.query.lastName || 'stranger';
  res.status(200).send(`Hello, ${firstName} ${lastName}!`);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const app = require('./app');

describe('GET /greet with multiple query params', () => {
  test('uses firstName and lastName from the query string', async () => {
    const res = await request(app)
      .get('/greet')
      .query({ firstName: 'Ada', lastName: 'Lovelace' });

    expect(res.status).toBe(200);
    expect(res.text).toBe('Hello, Ada Lovelace!');
  });

  test('defaults missing lastName to stranger', async () => {
    const res = await request(app)
      .get('/greet')
      .query({ firstName: 'Grace' });

    expect(res.text).toBe('Hello, Grace stranger!');
  });

  test('defaults missing firstName to stranger', async () => {
    const res = await request(app)
      .get('/greet')
      .query({ lastName: 'Hopper' });

    expect(res.text).toBe('Hello, stranger Hopper!');
  });

  test('defaults empty values to stranger', async () => {
    const res = await request(app).get('/greet?firstName=&lastName=');
    expect(res.text).toBe('Hello, stranger stranger!');
  });
});
```

# Walkthrough

## Reading multiple query params

`req.query` is an object. If the request is
`/greet?firstName=Ada&lastName=Lovelace`, Express gives you:

```js
req.query // => { firstName: 'Ada', lastName: 'Lovelace' }
```

Read each property separately and build the response from both values.

## Defaults are per value

Each query parameter can be present, missing, or empty independently. That
means each value needs its own fallback:

```js
const firstName = req.query.firstName || 'stranger';
const lastName = req.query.lastName || 'stranger';
```
