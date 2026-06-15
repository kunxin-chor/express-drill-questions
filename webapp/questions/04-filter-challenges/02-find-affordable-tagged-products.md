# Problem

Combine an **array value** match with a numerical **`$lte`** filter.

Register a `GET /products/tag/:tag/max/:price` route that returns products whose:

- `tags` array contains the `tag` route parameter
- `price` is less than or equal to the `price` route parameter

## Example data

The `products` collection may contain documents like:

```js
{ name: 'Budget Hammer', tags: ['tools', 'sale'], price: 12 }
{ name: 'Premium Drill', tags: ['tools'], price: 90 }
```

## Try tab

After writing your route, try:

`GET /products/tag/tools/max/20`

## Hints

- Query an array field directly to match one contained value.
- Use `$lte` for the maximum price.
- Convert the route parameter with `Number(req.params.price)`.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/products/tag/:tag/max/:price', async (req, res) => {
  // TODO: find tagged products at or below the max price
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

app.get('/products/tag/:tag/max/:price', async (req, res) => {
  const products = await db.collection('products').find({
    tags: req.params.tag,
    price: { $lte: Number(req.params.price) },
  }).toArray();

  res.json(products);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./app');

describe('GET /products/tag/:tag/max/:price', () => {
  let client;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    await db.collection('products').deleteMany({});
    await db.collection('products').insertMany([
      { name: 'Budget Hammer', tags: ['tools', 'sale'], price: 12 },
      { name: 'Premium Drill', tags: ['tools'], price: 90 },
      { name: 'Cheap Plate', tags: ['kitchen', 'sale'], price: 8 },
    ]);
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('returns products with the tag at or below the max price', async () => {
    const res = await request(app).get('/products/tag/tools/max/20');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ name: 'Budget Hammer' });
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
    { name: 'Budget Hammer', tags: ['tools', 'sale'], price: 12 },
    { name: 'Premium Drill', tags: ['tools'], price: 90 },
    { name: 'Cheap Plate', tags: ['kitchen', 'sale'], price: 8 },
  ]);
  await client.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

# Walkthrough

This filter combines direct array matching with a numeric comparison:

```js
{ tags: req.params.tag, price: { $lte: Number(req.params.price) } }
```
