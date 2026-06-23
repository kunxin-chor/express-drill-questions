# Problem

Authenticated users should create data that **belongs to them**. In this lesson the protected route reads the user id from the verified token and embeds it as the document's owner.

## What you need to build

- Register a protected `POST /api/notes` route (it already lists `[verifyToken]`).
- Read the note fields (`title`, `content`) from `req.body`.
- Embed the logged-in user's id as an `owner` field, taken from `req.user.user_id`.
- Insert the note and return the new note's id.

## The data the client sends

```js
{
    "title": "Shopping list",
    "content": "milk, eggs, bread"
}
```

Notice the client does **not** send an owner — the server fills that in from the token, so users cannot create notes on someone else's behalf.

## Concept: the token already knows who you are

Because `verifyToken` ran first and set `req.user`, the handler can trust `req.user.user_id`. The id arrives as a **string** (that is how it was serialized into the JWT), so convert it back to an `ObjectId` before storing it as a reference:

```js
const newNote = {
    title: req.body.title,
    content: req.body.content,
    owner: new ObjectId(req.user.user_id)   // embed the owner from the token
};
```

- `req.user.user_id` comes from the verified token, never from the request body — that is what makes it trustworthy.
- `new ObjectId(...)` stores the owner as a real reference that matches the user's `_id`.

## Write it in the editor

The route is already protected with `[verifyToken]`. Replace the `// TODO`:

```js
app.post("/api/notes", [verifyToken], async function (req, res) {
    const newNote = {
        title: req.body.title,
        content: req.body.content,
        owner: new ObjectId(req.user.user_id)
    };

    const result = await db.collection("notes").insertOne(newNote);

    res.json({
        message: "Successfully created note",
        noteId: result.insertedId
    });
});
```

- `verifyToken` guarantees `req.user` exists before this code runs.
- `owner: new ObjectId(req.user.user_id)` ties the note to the authenticated user.
- The client never controls the owner, so notes are always attributed correctly.

Click **Run tests**, then try the request in the **Try** tab.

## Try it

Log in to get a token, then `POST /api/notes` with the JSON body above and the header `Authorization: Bearer <token>`.

You get `{ "message": "Successfully created note", "noteId": "..." }`. The stored note has an `owner` field equal to your user `_id` — even though you never sent it. Without a valid token, `verifyToken` blocks the request with a 400.

## Summary

To create user-owned data, take the id from `req.user.user_id` (set by `verifyToken`) rather than from the request body, and embed it — converted with `new ObjectId(...)` — as an `owner` field. Trusting the token instead of client input is the core idea: it is impossible for a user to forge ownership. The next lesson uses this `owner` field to return only the notes that belong to you.

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

app.post("/api/notes", [verifyToken], async function (req, res) {
    // TODO: create a note that embeds the logged-in user's id as `owner`
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

app.post("/api/notes", [verifyToken], async function (req, res) {
    const newNote = {
        title: req.body.title,
        content: req.body.content,
        owner: new ObjectId(req.user.user_id)
    };

    const result = await db.collection("notes").insertOne(newNote);

    res.json({
        message: "Successfully created note",
        noteId: result.insertedId
    });
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient, ObjectId } = require('mongodb');
const app = require('./app');

async function registerAndLogin(email, password) {
  await request(app).post('/api/users').send({ email, password });
  const res = await request(app).post('/api/login').send({ email, password });
  return res.body.token;
}

describe('POST /api/notes (owned by the user)', () => {
  let client;
  let db;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db();
    await db.collection('users').deleteMany({});
    await db.collection('notes').deleteMany({});
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('embeds the logged-in user id as owner', async () => {
    const token = await registerAndLogin('ada@example.com', 's3cret');
    const user = await db.collection('users').findOne({ email: 'ada@example.com' });

    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Shopping list', content: 'milk, eggs, bread' });

    expect(res.status).toBe(200);
    expect(res.body.noteId).toBeDefined();

    const note = await db.collection('notes').findOne({ _id: new ObjectId(res.body.noteId) });
    expect(note.title).toBe('Shopping list');
    expect(note.owner.toString()).toBe(user._id.toString());
  });

  test('rejects creating a note without a token', async () => {
    const res = await request(app)
      .post('/api/notes')
      .send({ title: 'No auth', content: 'should fail' });
    expect(res.status).toBe(400);
  });
});
```

# Seed

```js
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs'); // In your own projects use 'bcrypt'; 'bcryptjs' is a drop-in stand-in here for technical reasons.

async function seed() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  await db.collection('users').deleteMany({});
  await db.collection('notes').deleteMany({});
  const user = await db.collection('users').insertOne({
    email: 'ada@example.com',
    password: await bcrypt.hash('s3cret', 12)
  });
  await db.collection('notes').insertOne({
    title: 'Welcome',
    content: 'Your first note',
    owner: user.insertedId
  });
  await client.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

# Walkthrough

The note's `owner` comes from `req.user.user_id`, which `verifyToken` decoded from the JWT — not from the request body. That is the security point: the server decides ownership from the trusted token, so a user cannot claim another account. `new ObjectId(req.user.user_id)` turns the string claim back into a real id reference that matches the user's `_id`, ready to filter on in the next lesson.
