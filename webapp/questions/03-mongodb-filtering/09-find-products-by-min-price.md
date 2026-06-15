# Problem

Find products using a numerical `$gte` filter.

The test runner has already started an in-memory MongoDB instance and made it
available through `process.env.MONGODB_URI`.

Using the **native MongoDB driver** (`mongodb`), register a `GET /products/min-price/:price`
route that queries the `products` collection and returns matching documents as a
**JSON array** via `res.json`.

## Example data

The `products` collection may contain documents like:

```js
{ name: 'Pen', price: 2 }
{ name: 'Notebook', price: 8 }
```

## Try tab

After writing your route, try:

`GET /products/min-price/8`

## Hints

- `db.collection('products')` gives you the collection handle.
- `.find(filter).toArray()` returns all matching documents.
- Route parameters are strings, so convert the parameter with `Number(...)`.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/products/min-price/:price', async (req, res) => {
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

app.get('/products/min-price/:price', async (req, res) => {
  const results = await db.collection('products').find({ price: { $gte: Number(req.params.price) } }).toArray();
  res.json(results);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./app');

describe('GET /products/min-price/:price', () => {
  let client;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    await db.collection('products').deleteMany({});
    await db.collection('products').insertMany([
      { name: 'Pen', price: 2 },
      { name: 'Notebook', price: 8 },
      { name: 'Bag', price: 25 },
    ]);
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('responds with status 200', async () => {
    const res = await request(app).get('/products/min-price/8');
    expect(res.status).toBe(200);
  });

  test('returns matching documents as JSON', async () => {
    const res = await request(app).get('/products/min-price/8');
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Notebook' })]),
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
      { name: 'Pen', price: 2 },
      { name: 'Notebook', price: 8 },
      { name: 'Bag', price: 25 },
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
