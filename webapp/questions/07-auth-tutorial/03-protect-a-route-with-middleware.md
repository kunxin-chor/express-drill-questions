# Problem

A token is only useful if routes can **check** it. In this lesson you write a `verifyToken` **middleware** that runs before protected routes, validates the JWT, and attaches the logged-in user to `req`.

## What you need to build

- Implement a `verifyToken(req, res, next)` middleware.
- Read the token from the `Authorization: Bearer <token>` header.
- Verify it with `jwt.verify`; on success, attach the claims to `req.user` and call `next()`.
- On any problem (no header, no token, invalid/expired token), respond with status **400**.
- The protected `GET /api/me` route (already wired up) then returns the current user.

## Concept: what a middleware is

A middleware is a function that runs **before** the route handler. It receives a third argument, `next`, which it calls to pass control onward:

```js
function verifyToken(req, res, next) {
    // ...checks...
    next();   // success: continue to the route
    // or: res.status(400).json({ ... });   // failure: stop here
}

app.get("/api/me", [verifyToken], async function (req, res) { /* ... */ });
```

Listing `[verifyToken]` before the handler means the request must pass the middleware first.

## Concept: reading the Bearer token

Clients send the token in a header shaped like `Authorization: Bearer eyJhbGc...`. You split off the token, then verify it:

```js
const authHeader = req.headers['authorization'];     // "Bearer eyJ..."
const token = authHeader.split(" ")[1];              // "eyJ..."

jwt.verify(token, TOKEN_SECRET, function (err, claims) {
    if (err) {
        res.status(400).json({ message: "Token invalid or expired" });
    } else {
        req.user = claims;   // { user_id, role, iat, exp }
        next();
    }
});
```

## Write it in the editor

The `GET /api/me` route is already wired to `[verifyToken]`. Replace the `// TODO` inside `verifyToken`:

```js
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];

    if (authHeader) {
        const token = authHeader.split(" ")[1];

        if (token) {
            jwt.verify(token, TOKEN_SECRET, function (err, claims) {
                if (err) {
                    res.status(400).json({ message: "Token invalid or expired" });
                } else {
                    req.user = claims;   // save the logged-in user on the request
                    next();
                }
            });
        } else {
            res.status(400).json({ message: "Token not found" });
        }
    } else {
        res.status(400).json({ message: "Authorization headers not found" });
    }
}
```

- The nested `if`s guard each failure: missing header, missing token, invalid token.
- `jwt.verify` checks the signature **and** expiry; the error branch handles both.
- On success, `req.user = claims` makes the user id available to every protected route via `req.user.user_id`.

Click **Run tests**, then try the request in the **Try** tab.

## Try it

Register and log in to obtain a token, then call `GET /api/me` with a header `Authorization: Bearer <your token>`.

With a valid token you get back `{ "user": { ... } }` (without the password). Without the header, or with a tampered token, you get status **400** — the middleware blocked the request before the route ran.

## Summary

`verifyToken` is a gatekeeper middleware: it extracts the Bearer token, validates it with `jwt.verify`, and either rejects the request (400) or attaches `req.user` and calls `next()`. Because the claims include `user_id`, every protected route now knows *who* is making the request — which the next lesson uses to create user-owned data.

# Starter

```js
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs'); // In your own projects use 'bcrypt'; 'bcryptjs' is a drop-in stand-in here for technical reasons.
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

// Hard-coded for this exercise. In a real app this MUST come from
// process.env.TOKEN_SECRET (an environment variable), never committed in code.
const TOKEN_SECRET = "super-secret-dev-key";

function generateAccessToken(id) {
    return jwt.sign({ user_id: id, role: "user" }, TOKEN_SECRET, { expiresIn: "3w" });
}

function verifyToken(req, res, next) {
    // TODO: read the Bearer token, verify it, set req.user, call next() — else 400
}

app.post("/api/users", async function (req, res) {
    const result = await db.collection("users").insertOne({
        email: req.body.email,
        password: await bcrypt.hash(req.body.password, 12)
    });
    res.json({ message: "New user has been created", userId: result.insertedId });
});

app.post("/api/login", async function (req, res) {
    const user = await db.collection("users").findOne({ email: req.body.email });
    if (user && await bcrypt.compare(req.body.password, user.password)) {
        res.json({ token: generateAccessToken(user._id), message: "Login is successful" });
    } else {
        res.status(401).json({ message: "Wrong email or password" });
    }
});

app.get("/api/me", [verifyToken], async function (req, res) {
    const user = await db.collection("users").findOne({ _id: new ObjectId(req.user.user_id) });
    delete user.password;
    res.json({ user: user });
});

module.exports = app;
```

# Solution

```js
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs'); // In your own projects use 'bcrypt'; 'bcryptjs' is a drop-in stand-in here for technical reasons.
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

// Hard-coded for this exercise. In a real app this MUST come from
// process.env.TOKEN_SECRET (an environment variable), never committed in code.
const TOKEN_SECRET = "super-secret-dev-key";

function generateAccessToken(id) {
    return jwt.sign({ user_id: id, role: "user" }, TOKEN_SECRET, { expiresIn: "3w" });
}

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];

    if (authHeader) {
        const token = authHeader.split(" ")[1];

        if (token) {
            jwt.verify(token, TOKEN_SECRET, function (err, claims) {
                if (err) {
                    res.status(400).json({ message: "Token invalid or expired" });
                } else {
                    req.user = claims;
                    next();
                }
            });
        } else {
            res.status(400).json({ message: "Token not found" });
        }
    } else {
        res.status(400).json({ message: "Authorization headers not found" });
    }
}

app.post("/api/users", async function (req, res) {
    const result = await db.collection("users").insertOne({
        email: req.body.email,
        password: await bcrypt.hash(req.body.password, 12)
    });
    res.json({ message: "New user has been created", userId: result.insertedId });
});

app.post("/api/login", async function (req, res) {
    const user = await db.collection("users").findOne({ email: req.body.email });
    if (user && await bcrypt.compare(req.body.password, user.password)) {
        res.json({ token: generateAccessToken(user._id), message: "Login is successful" });
    } else {
        res.status(401).json({ message: "Wrong email or password" });
    }
});

app.get("/api/me", [verifyToken], async function (req, res) {
    const user = await db.collection("users").findOne({ _id: new ObjectId(req.user.user_id) });
    delete user.password;
    res.json({ user: user });
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./app');

async function registerAndLogin(email, password) {
  await request(app).post('/api/users').send({ email, password });
  const res = await request(app).post('/api/login').send({ email, password });
  return res.body.token;
}

describe('verifyToken middleware on GET /api/me', () => {
  let client;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    await client.db().collection('users').deleteMany({});
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('returns the current user when a valid token is sent', async () => {
    const token = await registerAndLogin('ada@example.com', 's3cret');
    const res = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('ada@example.com');
    expect(res.body.user.password).toBeUndefined();
  });

  test('returns 400 when no Authorization header is sent', async () => {
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(400);
  });

  test('returns 400 when the token is invalid', async () => {
    const res = await request(app)
      .get('/api/me')
      .set('Authorization', 'Bearer not.a.real.token');
    expect(res.status).toBe(400);
  });
});
```

# Seed

```js
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs'); // In your own projects use 'bcrypt'; 'bcryptjs' is a drop-in stand-in here for technical reasons.

async function seed() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  await db.collection('users').deleteMany({});
  await db.collection('users').insertOne({
    email: 'ada@example.com',
    password: await bcrypt.hash('s3cret', 12)
  });
  await client.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

# Walkthrough

`verifyToken` runs before any route that lists it in `[verifyToken]`. It pulls the token out of the `Authorization` header, calls `jwt.verify` to confirm the signature and expiry, and on success copies the decoded claims onto `req.user` before calling `next()`. Each failure path returns 400 and never calls `next()`, so the protected handler only runs for authenticated requests. `GET /api/me` then reads `req.user.user_id` to load and return the current account.
