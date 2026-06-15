# Problem

Find documents by matching two text fields.

The test runner has already started an in-memory MongoDB instance and made it
available through `process.env.MONGODB_URI`.

Using the **native MongoDB driver** (`mongodb`), register a `GET /users/search/:name/:role`
route that queries the `users` collection and returns matching documents as a
**JSON array** via `res.json`.

## Example data

The `users` collection may contain documents like:

```js
{ name: 'Ada', role: 'admin' }
{ name: 'Ada', role: 'student' }
```

## Try tab

After writing your route, try:

`GET /users/search/Ada/admin`

## Hints

- `db.collection('users')` gives you the collection handle.
- `.find(filter).toArray()` returns all matching documents.
- Use both `name` and `role` in the same filter object.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/users/search/:name/:role', async (req, res) => {
  // TODO: query the 'users' collection and return matching documents as JSON
});

module.exports = app;
```

# Solution

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/users/search/:name/:role', async (req, res) => {
  const results = await db.collection('users').find({ name: req.params.name, role: req.params.role }).toArray();
  res.json(results);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./app');

describe('GET /users/search/:name/:role', () => {
  let client;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    await db.collection('users').deleteMany({});
    await db.collection('users').insertMany([
      { name: 'Ada', role: 'admin' },
      { name: 'Ada', role: 'student' },
      { name: 'Grace', role: 'admin' },
    ]);
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('responds with status 200', async () => {
    const res = await request(app).get('/users/search/Ada/admin');
    expect(res.status).toBe(200);
  });

  test('returns matching documents as JSON', async () => {
    const res = await request(app).get('/users/search/Ada/admin');
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Ada', role: 'admin' })]),
    );
  });
});
```

# Seed

```js
const { MongoClient } = require('mongodb');

async function seed() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  await db.collection('users').deleteMany({});
  await db.collection('users').insertMany([
      { name: 'Ada', role: 'admin' },
      { name: 'Ada', role: 'student' },
      { name: 'Grace', role: 'admin' },
  ]);
  await client.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

# Walkthrough

Build a MongoDB filter object, pass it to `.find(...)`, await `.toArray()`,
and send the resulting array with `res.json(...)`.
