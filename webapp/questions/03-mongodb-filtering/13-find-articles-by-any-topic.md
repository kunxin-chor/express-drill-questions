# Problem

Find articles using `$in` against an array field.

The test runner has already started an in-memory MongoDB instance and made it
available through `process.env.MONGODB_URI`.

Using the **native MongoDB driver** (`mongodb`), register a `GET /articles/topics`
route that queries the `articles` collection and returns matching documents as a
**JSON array** via `res.json`.

## Example data

The `articles` collection may contain documents like:

```js
{ title: 'Express Routes', topics: ['node', 'express'] }
{ title: 'Mongo Indexes', topics: ['mongodb', 'database'] }
```

## Try tab

After writing your route, try:

`GET /articles/topics`

## Hints

- `db.collection('articles')` gives you the collection handle.
- `.find(filter).toArray()` returns all matching documents.
- Use `$in` when any value from a list should match.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/articles/topics', async (req, res) => {
  // TODO: query the 'articles' collection and return matching documents as JSON
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

app.get('/articles/topics', async (req, res) => {
  const results = await db.collection('articles').find({ topics: { $in: ['node', 'mongodb'] } }).toArray();
  res.json(results);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./app');

describe('GET /articles/topics', () => {
  let client;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    await db.collection('articles').deleteMany({});
    await db.collection('articles').insertMany([
      { title: 'Express Routes', topics: ['node', 'express'] },
      { title: 'Mongo Indexes', topics: ['mongodb', 'database'] },
      { title: 'CSS Grid', topics: ['css'] },
    ]);
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('responds with status 200', async () => {
    const res = await request(app).get('/articles/topics');
    expect(res.status).toBe(200);
  });

  test('returns matching documents as JSON', async () => {
    const res = await request(app).get('/articles/topics');
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: 'Express Routes' })]),
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
  await db.collection('articles').deleteMany({});
  await db.collection('articles').insertMany([
      { title: 'Express Routes', topics: ['node', 'express'] },
      { title: 'Mongo Indexes', topics: ['mongodb', 'database'] },
      { title: 'CSS Grid', topics: ['css'] },
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
