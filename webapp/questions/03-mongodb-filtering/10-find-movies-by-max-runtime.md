# Problem

Find movies using a numerical `$lte` filter.

The test runner has already started an in-memory MongoDB instance and made it
available through `process.env.MONGODB_URI`.

Using the **native MongoDB driver** (`mongodb`), register a `GET /movies/max-runtime/:minutes`
route that queries the `movies` collection and returns matching documents as a
**JSON array** via `res.json`.

## Example data

The `movies` collection may contain documents like:

```js
{ title: 'Short Film', runtimeMinutes: 15 }
{ title: 'Comedy', runtimeMinutes: 95 }
```

## Try tab

After writing your route, try:

`GET /movies/max-runtime/100`

## Hints

- `db.collection('movies')` gives you the collection handle.
- `.find(filter).toArray()` returns all matching documents.
- Use `$lte` to match numbers less than or equal to the limit.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/movies/max-runtime/:minutes', async (req, res) => {
  // TODO: query the 'movies' collection and return matching documents as JSON
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

app.get('/movies/max-runtime/:minutes', async (req, res) => {
  const results = await db.collection('movies').find({ runtimeMinutes: { $lte: Number(req.params.minutes) } }).toArray();
  res.json(results);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./app');

describe('GET /movies/max-runtime/:minutes', () => {
  let client;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    await db.collection('movies').deleteMany({});
    await db.collection('movies').insertMany([
      { title: 'Short Film', runtimeMinutes: 15 },
      { title: 'Comedy', runtimeMinutes: 95 },
      { title: 'Epic', runtimeMinutes: 180 },
    ]);
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('responds with status 200', async () => {
    const res = await request(app).get('/movies/max-runtime/100');
    expect(res.status).toBe(200);
  });

  test('returns matching documents as JSON', async () => {
    const res = await request(app).get('/movies/max-runtime/100');
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: 'Short Film' })]),
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
  await db.collection('movies').deleteMany({});
  await db.collection('movies').insertMany([
      { title: 'Short Film', runtimeMinutes: 15 },
      { title: 'Comedy', runtimeMinutes: 95 },
      { title: 'Epic', runtimeMinutes: 180 },
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
