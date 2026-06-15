# Problem

Find restaurants using `$or` with different fields.

The test runner has already started an in-memory MongoDB instance and made it
available through `process.env.MONGODB_URI`.

Using the **native MongoDB driver** (`mongodb`), register a `GET /restaurants/recommended`
route that queries the `restaurants` collection and returns matching documents as a
**JSON array** via `res.json`.

## Example data

The `restaurants` collection may contain documents like:

```js
{ name: 'Pasta Place', cuisine: 'Italian', rating: 4 }
{ name: 'Sushi Star', cuisine: 'Japanese', rating: 5 }
```

## Try tab

After writing your route, try:

`GET /restaurants/recommended`

## Hints

- `db.collection('restaurants')` gives you the collection handle.
- `.find(filter).toArray()` returns all matching documents.
- Each `$or` branch can check a different field.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/restaurants/recommended', async (req, res) => {
  // TODO: query the 'restaurants' collection and return matching documents as JSON
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

app.get('/restaurants/recommended', async (req, res) => {
  const results = await db.collection('restaurants').find({ $or: [{ cuisine: 'Italian' }, { rating: 5 }] }).toArray();
  res.json(results);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./app');

describe('GET /restaurants/recommended', () => {
  let client;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    await db.collection('restaurants').deleteMany({});
    await db.collection('restaurants').insertMany([
      { name: 'Pasta Place', cuisine: 'Italian', rating: 4 },
      { name: 'Sushi Star', cuisine: 'Japanese', rating: 5 },
      { name: 'Burger Barn', cuisine: 'American', rating: 3 },
    ]);
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('responds with status 200', async () => {
    const res = await request(app).get('/restaurants/recommended');
    expect(res.status).toBe(200);
  });

  test('returns matching documents as JSON', async () => {
    const res = await request(app).get('/restaurants/recommended');
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Pasta Place' })]),
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
  await db.collection('restaurants').deleteMany({});
  await db.collection('restaurants').insertMany([
      { name: 'Pasta Place', cuisine: 'Italian', rating: 4 },
      { name: 'Sushi Star', cuisine: 'Japanese', rating: 5 },
      { name: 'Burger Barn', cuisine: 'American', rating: 3 },
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
