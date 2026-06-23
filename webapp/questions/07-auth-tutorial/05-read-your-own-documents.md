# Problem

Now that notes carry an `owner`, use it to return **only the notes that belong to the logged-in user** — the payoff of embedding the user id.

## What you need to build

- Register a protected `GET /api/notes` route (it already lists `[verifyToken]`).
- Filter the `notes` collection by `owner` equal to the current user's id.
- Return the matching notes as `{ notes: [...] }`.

## The key idea

Two different users hitting the **same** URL should see **different** data — each sees only their own notes. You achieve that by filtering on the id from the token:

```js
const filter = { owner: new ObjectId(req.user.user_id) };
```

- `req.user.user_id` is the current user, set by `verifyToken`.
- Filtering by `owner` means another user's notes are never returned, even though the route is shared.

## Write it in the editor

The route is already protected with `[verifyToken]`. Replace the `// TODO`:

```js
app.get("/api/notes", [verifyToken], async function (req, res) {
    // only return notes owned by the logged-in user
    const notes = await db.collection("notes").find({
        owner: new ObjectId(req.user.user_id)
    }).toArray();

    res.json({
        notes: notes
    });
});
```

- The filter `{ owner: new ObjectId(req.user.user_id) }` scopes the query to the current user.
- `new ObjectId(...)` is needed because the owner was stored as an ObjectId, but the token claim is a string.
- The shared URL returns personalised results — the heart of multi-user apps.

Click **Run tests**, then try the request in the **Try** tab.

## Try it

Log in as one user, create a couple of notes, then `GET /api/notes` with that user's token — you see only your notes. Log in as a second user and the same request returns an empty list (or only their own notes).

## Summary

Reading user-owned data is `find({ owner: new ObjectId(req.user.user_id) })`. The owner id comes from the verified token, so the same endpoint safely serves every user their own slice of the collection. Together with the previous lessons you now have the full pattern: **register → login (JWT) → verify (middleware) → create owned data → read owned data**.

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
    const result = await db.collection("notes").insertOne({
        title: req.body.title,
        content: req.body.content,
        owner: new ObjectId(req.user.user_id)
    });
    res.json({ message: "Successfully created note", noteId: result.insertedId });
});

app.get("/api/notes", [verifyToken], async function (req, res) {
    // TODO: return only the notes owned by the logged-in user
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
    const result = await db.collection("notes").insertOne({
        title: req.body.title,
        content: req.body.content,
        owner: new ObjectId(req.user.user_id)
    });
    res.json({ message: "Successfully created note", noteId: result.insertedId });
});

app.get("/api/notes", [verifyToken], async function (req, res) {
    const notes = await db.collection("notes").find({
        owner: new ObjectId(req.user.user_id)
    }).toArray();

    res.json({
        notes: notes
    });
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

describe('GET /api/notes (only your own)', () => {
  let client;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    await client.db().collection('users').deleteMany({});
    await client.db().collection('notes').deleteMany({});
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('returns only the notes owned by the requesting user', async () => {
    const adaToken = await registerAndLogin('ada@example.com', 's3cret');
    const linusToken = await registerAndLogin('linus@example.com', 'pa55');

    // Ada creates two notes
    await request(app).post('/api/notes').set('Authorization', `Bearer ${adaToken}`)
      .send({ title: 'Ada 1', content: 'a' });
    await request(app).post('/api/notes').set('Authorization', `Bearer ${adaToken}`)
      .send({ title: 'Ada 2', content: 'b' });

    // Linus creates one note
    await request(app).post('/api/notes').set('Authorization', `Bearer ${linusToken}`)
      .send({ title: 'Linus 1', content: 'c' });

    const adaRes = await request(app).get('/api/notes').set('Authorization', `Bearer ${adaToken}`);
    expect(adaRes.status).toBe(200);
    expect(adaRes.body.notes).toHaveLength(2);
    expect(adaRes.body.notes.map((n) => n.title)).toEqual(
      expect.arrayContaining(['Ada 1', 'Ada 2'])
    );

    const linusRes = await request(app).get('/api/notes').set('Authorization', `Bearer ${linusToken}`);
    expect(linusRes.body.notes).toHaveLength(1);
    expect(linusRes.body.notes[0].title).toBe('Linus 1');
  });

  test('requires a token', async () => {
    const res = await request(app).get('/api/notes');
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
  await db.collection('notes').deleteMany({});
  const ada = await db.collection('users').insertOne({
    email: 'ada@example.com',
    password: await bcrypt.hash('s3cret', 12)
  });
  await db.collection('notes').insertMany([
    { title: 'Shopping list', content: 'milk, eggs, bread', owner: ada.insertedId },
    { title: 'Ideas', content: 'build an API', owner: ada.insertedId }
  ]);
  await client.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

# Walkthrough

The filter `{ owner: new ObjectId(req.user.user_id) }` scopes the query to the authenticated user, so one shared endpoint returns different results per user. The id again comes from the verified token, and `new ObjectId(...)` matches the ObjectId stored as `owner`. This completes the ownership loop started in the previous lesson: data is created with an owner and read back by that same owner.
