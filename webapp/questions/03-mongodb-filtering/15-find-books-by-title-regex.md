# Problem

Find books using `$regex` on a title field.

The test runner has already started an in-memory MongoDB instance and made it
available through `process.env.MONGODB_URI`.

Using the **native MongoDB driver** (`mongodb`), register a `GET /books/search/:term`
route that queries the `books` collection and returns matching documents as a
**JSON array** via `res.json`.

## Example data

The `books` collection may contain documents like:

```js
{ title: 'Learning Express' }
{ title: 'MongoDB Guide' }
```

## Try tab

After writing your route, try:

`GET /books/search/express`

## Hints

- `db.collection('books')` gives you the collection handle.
- `.find(filter).toArray()` returns all matching documents.
- Use `$options: "i"` for a case-insensitive regex search.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/books/search/:term', async (req, res) => {
  // TODO: query the 'books' collection and return matching documents as JSON
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

app.get('/books/search/:term', async (req, res) => {
  const results = await db.collection('books').find({ title: { $regex: req.params.term, $options: 'i' } }).toArray();
  res.json(results);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./app');

describe('GET /books/search/:term', () => {
  let client;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    await db.collection('books').deleteMany({});
    await db.collection('books').insertMany([
      { title: 'Learning Express' },
      { title: 'MongoDB Guide' },
      { title: 'Express Patterns' },
    ]);
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('responds with status 200', async () => {
    const res = await request(app).get('/books/search/express');
    expect(res.status).toBe(200);
  });

  test('returns matching documents as JSON', async () => {
    const res = await request(app).get('/books/search/express');
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: 'Learning Express' })]),
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
  await db.collection('books').deleteMany({});
  await db.collection('books').insertMany([
      { title: 'Learning Express' },
      { title: 'MongoDB Guide' },
      { title: 'Express Patterns' },
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
