# Problem

Read more than one value from the URL path using **route parameters**.

Add a `GET /users/:userId/posts/:postId` route that responds with:

- Status **200**
- Body: `` `User <userId>, post <postId>` ``

| Request                       | Response body       |
| ----------------------------- | ------------------- |
| `GET /users/42/posts/100`     | `User 42, post 100` |
| `GET /users/ada/posts/intro`  | `User ada, post intro` |

## Hints

- Every `:name` segment becomes a property on `req.params`.
- For `/users/:userId/posts/:postId`, use `req.params.userId` and
  `req.params.postId`.
- Route parameters are strings, even when they look like numbers.

# Starter

```js
const express = require('express');
const app = express();

// TODO: register GET /users/:userId/posts/:postId.
// - Read userId and postId from req.params.
// - Respond with `User <userId>, post <postId>`.

module.exports = app;
```

# Solution

```js
const express = require('express');
const app = express();

app.get('/users/:userId/posts/:postId', (req, res) => {
  res.status(200).send(`User ${req.params.userId}, post ${req.params.postId}`);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const app = require('./app');

describe('GET /users/:userId/posts/:postId', () => {
  test('uses both route parameters', async () => {
    const res = await request(app).get('/users/42/posts/100');

    expect(res.status).toBe(200);
    expect(res.text).toBe('User 42, post 100');
  });

  test('allows non-numeric route parameter values', async () => {
    const res = await request(app).get('/users/ada/posts/intro');
    expect(res.text).toBe('User ada, post intro');
  });

  test('requires both route parameters', async () => {
    const res = await request(app).get('/users/42/posts');
    expect(res.status).toBe(404);
  });
});
```

# Walkthrough

## Multiple route params

A route can contain more than one named parameter:

```js
app.get('/users/:userId/posts/:postId', (req, res) => {
  console.log(req.params);
});
```

For `GET /users/42/posts/100`, `req.params` is:

```js
{ userId: '42', postId: '100' }
```

Each parameter only matches one path segment, so `/users/42/posts` does not
match because the `:postId` segment is missing.
