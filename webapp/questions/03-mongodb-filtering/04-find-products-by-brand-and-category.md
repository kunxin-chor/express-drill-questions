# Problem

Find products by matching two text fields.

The test runner has already started an in-memory MongoDB instance and made it
available through `process.env.MONGODB_URI`.

Using the **native MongoDB driver** (`mongodb`), register a `GET /products/search/:brand/:category`
route that queries the `products` collection and returns matching documents as a
**JSON array** via `res.json`.

## Example data

The `products` collection may contain documents like:

```js
{ brand: 'Acme', category: 'tools', name: 'Hammer' }
{ brand: 'Acme', category: 'kitchen', name: 'Pan' }
```

## Try tab

After writing your route, try:

`GET /products/search/Acme/tools`

## Hints

- `db.collection('products')` gives you the collection handle.
- `.find(filter).toArray()` returns all matching documents.
- Use both `brand` and `category` in the same filter object.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/products/search/:brand/:category', async (req, res) => {
  // TODO: query the 'products' collection and return matching documents as JSON
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

app.get('/products/search/:brand/:category', async (req, res) => {
  const results = await db.collection('products').find({ brand: req.params.brand, category: req.params.category }).toArray();
  res.json(results);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./app');

describe('GET /products/search/:brand/:category', () => {
  let client;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    await db.collection('products').deleteMany({});
    await db.collection('products').insertMany([
      { brand: 'Acme', category: 'tools', name: 'Hammer' },
      { brand: 'Acme', category: 'kitchen', name: 'Pan' },
      { brand: 'Bravo', category: 'tools', name: 'Drill' },
    ]);
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('responds with status 200', async () => {
    const res = await request(app).get('/products/search/Acme/tools');
    expect(res.status).toBe(200);
  });

  test('returns matching documents as JSON', async () => {
    const res = await request(app).get('/products/search/Acme/tools');
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ brand: 'Acme', category: 'tools', name: 'Hammer' })]),
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
  await db.collection('products').deleteMany({});
  await db.collection('products').insertMany([
      { brand: 'Acme', category: 'tools', name: 'Hammer' },
      { brand: 'Acme', category: 'kitchen', name: 'Pan' },
      { brand: 'Bravo', category: 'tools', name: 'Drill' },
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
