# Problem

This series adds authentication to an Express + MongoDB API. We start with **registration**: storing a new user with a securely **hashed** password — never the plain text.

## What you need to build

- Register a `POST /api/users` route.
- Read `email` and `password` from `req.body`.
- Store the user in the `users` collection with the password **hashed** by bcrypt.
- Respond with a message and the new user's id.

## The data the client sends

```js
{
    "email": "ada@example.com",
    "password": "s3cret"
}
```

## Concept: never store plain passwords

If your database leaks, plain-text passwords leak with it. Instead you store a one-way **hash**. `bcryptjs` turns a password into a salted hash that cannot be reversed:

```js
const bcrypt = require('bcryptjs'); // In your own projects use 'bcrypt'; 'bcryptjs' is a drop-in stand-in here for technical reasons.

const hash = await bcrypt.hash("s3cret", 12);   // "$2a$12$Q9...." — safe to store
```

- The second argument, `12`, is the **cost factor** (salt rounds) — higher is slower and more secure.
- `bcrypt.hash(...)` returns a promise, so you `await` it.
- The same password hashed twice gives **different** strings, because each hash includes a random salt.

## Concept: the boilerplate this series shares

Every lesson sets up Express, JSON parsing, a database handle, and the auth libraries:

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
```

> **About `bcryptjs`:** in your own projects you should install and use **`bcrypt`**. We use `bcryptjs` here only because it is pure JavaScript and runs in this sandbox without a compiler — the API is identical, so the only difference is the `require` line.
>
> **About `TOKEN_SECRET`:** it is hard-coded here for convenience. In a real app it MUST come from `process.env.TOKEN_SECRET` so the signing key is never committed to your code.

## Write it in the editor

Type your answer into the `app.js` editor on the **left**. Replace the `// TODO`:

```js
app.post("/api/users", async function (req, res) {
    // hash the password before storing it
    const result = await db.collection("users").insertOne({
        email: req.body.email,
        password: await bcrypt.hash(req.body.password, 12)
    });

    res.json({
        message: "New user has been created",
        userId: result.insertedId
    });
});
```

- `bcrypt.hash(req.body.password, 12)` produces the salted hash to store.
- `insertOne(...)` saves the user document.
- `result.insertedId` is the new user's `_id`, echoed back to the client.

Click **Run tests**, then try the request in the **Try** tab.

## Try it

`POST /api/users` with the JSON body above.

You should get `{ "message": "New user has been created", "userId": "..." }`. If you inspect the stored document, the `password` field is a long `$2a$...` hash — **not** `"s3cret"`. That is exactly what you want.

## Summary

Registration is `insertOne` with the password run through `bcrypt.hash(password, 12)` first. The hash is one-way and salted, so even if the database is exposed, the original passwords are not. In the next lesson you will verify this hash at login and hand out a token.

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

app.post("/api/users", async function (req, res) {
    // TODO: hash the password, store the user, and return the new id
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

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs'); // In your own projects use 'bcrypt'; 'bcryptjs' is a drop-in stand-in here for technical reasons.
const app = require('./app');

describe('POST /api/users', () => {
  let client;
  let db;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db();
    await db.collection('users').deleteMany({});
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('creates a user and returns its id', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ email: 'ada@example.com', password: 's3cret' });

    expect(res.status).toBe(200);
    expect(res.body.userId).toBeDefined();
  });

  test('stores the password as a bcrypt hash, not plain text', async () => {
    await request(app)
      .post('/api/users')
      .send({ email: 'grace@example.com', password: 'hunter2' });

    const saved = await db.collection('users').findOne({ email: 'grace@example.com' });
    expect(saved).not.toBeNull();
    expect(saved.password).not.toBe('hunter2');
    // the stored hash must still verify against the original password
    expect(await bcrypt.compare('hunter2', saved.password)).toBe(true);
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

The route hashes the incoming password with `bcrypt.hash(password, 12)` and stores the result instead of the raw string. bcrypt salts each hash, so identical passwords produce different stored values, and the hash cannot be reversed — only *verified* later with `bcrypt.compare`. `result.insertedId` is returned so the client knows the new user's id.
