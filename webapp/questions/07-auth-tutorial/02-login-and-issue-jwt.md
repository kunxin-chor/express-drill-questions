# Problem

Now that users can register, let them **log in**. On a correct email/password you issue a **JWT** (JSON Web Token) the client can send on future requests to prove who they are.

## What you need to build

- Register a `POST /api/login` route.
- Look up the user by `email`.
- Compare the submitted password against the stored hash with `bcrypt.compare`.
- On success, generate a JWT with the helper provided and return `{ token, message }`.
- On failure (no such user, or wrong password), respond with status **401**.

## The data the client sends

```js
{
    "email": "ada@example.com",
    "password": "s3cret"
}
```

## Concept: a JWT is a signed claim

A JWT packs some data (the **claims**, e.g. the user id) and signs it with a secret. Anyone can read the claims, but only the server can produce a valid signature, so the token cannot be forged. The provided helper creates one:

```js
function generateAccessToken(id) {
    return jwt.sign(
        { user_id: id, role: "user" },   // 1. the claims / payload
        TOKEN_SECRET,                     // 2. the signing secret
        { expiresIn: "3w" }               // 3. options (expires in 3 weeks)
    );
}
```

## Concept: verifying the password

The stored password is a hash, so you cannot compare strings directly. `bcrypt.compare` hashes the attempt and checks it against the stored hash:

```js
const ok = await bcrypt.compare(req.body.password, user.password);  // true / false
```

## Write it in the editor

The `generateAccessToken` helper is already in the editor. Replace the `// TODO` inside the login route:

```js
app.post("/api/login", async function (req, res) {
    // find the user by their email
    const user = await db.collection("users").findOne({
        email: req.body.email
    });

    if (user) {
        // does the submitted password match the stored hash?
        if (await bcrypt.compare(req.body.password, user.password)) {
            const token = generateAccessToken(user._id);
            res.json({
                token: token,
                message: "Login is successful"
            });
        } else {
            res.status(401).json({ message: "Wrong email or password" });
        }
    } else {
        res.status(401).json({ message: "Wrong email or password" });
    }
});
```

- `findOne({ email })` locates the account.
- `bcrypt.compare(plain, hash)` returns `true` only when the password is correct.
- `generateAccessToken(user._id)` embeds the user's id into a signed token.
- Both failure paths return the **same** 401 message, so attackers cannot tell whether an email exists.

Click **Run tests**, then try the request in the **Try** tab.

## Try it

First `POST /api/users` to register `ada@example.com`, then `POST /api/login` with the same credentials.

A correct login returns `{ "token": "eyJ...", "message": "Login is successful" }`. A wrong password returns status **401**. Copy that token — the next lesson uses it to access a protected route.

## Summary

Login verifies the password with `bcrypt.compare` and, on success, signs a JWT containing the user's id with `jwt.sign`. The token is the client's proof of identity for later requests. Returning an identical 401 for both "unknown email" and "wrong password" avoids leaking which accounts exist.

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
    return jwt.sign({
        user_id: id,
        role: "user"
    }, TOKEN_SECRET, {
        expiresIn: "3w"
    });
}

app.post("/api/users", async function (req, res) {
    const result = await db.collection("users").insertOne({
        email: req.body.email,
        password: await bcrypt.hash(req.body.password, 12)
    });
    res.json({
        message: "New user has been created",
        userId: result.insertedId
    });
});

app.post("/api/login", async function (req, res) {
    // TODO: verify the user's password and return a JWT, or 401 on failure
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
    return jwt.sign({
        user_id: id,
        role: "user"
    }, TOKEN_SECRET, {
        expiresIn: "3w"
    });
}

app.post("/api/users", async function (req, res) {
    const result = await db.collection("users").insertOne({
        email: req.body.email,
        password: await bcrypt.hash(req.body.password, 12)
    });
    res.json({
        message: "New user has been created",
        userId: result.insertedId
    });
});

app.post("/api/login", async function (req, res) {
    const user = await db.collection("users").findOne({
        email: req.body.email
    });

    if (user) {
        if (await bcrypt.compare(req.body.password, user.password)) {
            const token = generateAccessToken(user._id);
            res.json({
                token: token,
                message: "Login is successful"
            });
        } else {
            res.status(401).json({ message: "Wrong email or password" });
        }
    } else {
        res.status(401).json({ message: "Wrong email or password" });
    }
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const app = require('./app');

// Hard-coded for this exercise. In a real app this MUST come from
// process.env.TOKEN_SECRET (an environment variable), never committed in code.
const TOKEN_SECRET = "super-secret-dev-key";

describe('POST /api/login', () => {
  let client;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    await client.db().collection('users').deleteMany({});
    // register through the API so the password is hashed the same way
    await request(app).post('/api/users').send({ email: 'ada@example.com', password: 's3cret' });
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('returns a valid JWT on correct credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'ada@example.com', password: 's3cret' });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');

    const claims = jwt.verify(res.body.token, TOKEN_SECRET);
    expect(claims.user_id).toBeDefined();
  });

  test('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'ada@example.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('returns 401 for an unknown email', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'nobody@example.com', password: 's3cret' });
    expect(res.status).toBe(401);
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

Login is a two-step check: find the user by email, then `bcrypt.compare` the submitted password against the stored hash. Only when both succeed do you call `generateAccessToken(user._id)`, which uses `jwt.sign` to embed the user id in a signed, expiring token. The client stores that token and sends it back on protected requests, which the next lesson handles.
