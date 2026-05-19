# 2. Greet — reading a query string

Your route now needs to read data from the URL.

## Task

Add a `GET /greet` route that replies with a personalized greeting based on
the `name` query parameter.

| Request                        | Response body       | Status |
| ------------------------------ | ------------------- | ------ |
| `GET /greet?name=Ada`          | `Hello, Ada!`       | 200    |
| `GET /greet?name=Grace%20Hopper` | `Hello, Grace Hopper!` | 200 |
| `GET /greet` (no query)        | `Hello, stranger!`  | 200    |
| `GET /greet?name=`             | `Hello, stranger!`  | 200    |

The response `Content-Type` should start with `text/` (use `res.send` with a
string and Express will handle it).

## Hints

- Express parses the query string for you. It lives on `req.query` as an
  object, e.g. `{ name: 'Ada' }`.
- Remember to treat an **empty string** the same as "missing".
- Template literals are your friend: `` `Hello, ${name}!` ``.
