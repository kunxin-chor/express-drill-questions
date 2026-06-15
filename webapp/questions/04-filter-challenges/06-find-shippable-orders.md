# Problem

Combine **two text fields**, **`$in`**, **`$regex`**, and numerical **`$lte`**.

Register a `GET /orders/shippable/:country/:term/:maxTotal` route that returns orders whose:

- `status` is `paid`
- `shipping.country` matches the `country` route parameter
- `tags` contains either `gift` or `priority`
- `customerEmail` matches the `term` route parameter using a case-insensitive regex
- `total` is less than or equal to the `maxTotal` route parameter

## Example data

The `orders` collection may contain documents like:

```js
{ orderNo: 'A1', status: 'paid', shipping: { country: 'SG' }, tags: ['gift'], customerEmail: 'ada@example.com', total: 80 }
{ orderNo: 'B2', status: 'paid', shipping: { country: 'SG' }, tags: ['standard'], customerEmail: 'bob@example.com', total: 70 }
```

## Try tab

After writing your route, try:

`GET /orders/shippable/SG/example/100`

## Hints

- Use exact text matches for `status` and `shipping.country`.
- Use `$in` against the `tags` array.
- Use `$regex` with `$options: 'i'` for the email search.
- Convert `maxTotal` with `Number(...)` before using `$lte`.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/orders/shippable/:country/:term/:maxTotal', async (req, res) => {
  // TODO: find paid shippable orders matching country, tags, email, and max total
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

app.get('/orders/shippable/:country/:term/:maxTotal', async (req, res) => {
  const orders = await db.collection('orders').find({
    status: 'paid',
    'shipping.country': req.params.country,
    tags: { $in: ['gift', 'priority'] },
    customerEmail: { $regex: req.params.term, $options: 'i' },
    total: { $lte: Number(req.params.maxTotal) },
  }).toArray();

  res.json(orders);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./app');

describe('GET /orders/shippable/:country/:term/:maxTotal', () => {
  let client;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    await db.collection('orders').deleteMany({});
    await db.collection('orders').insertMany([
      { orderNo: 'A1', status: 'paid', shipping: { country: 'SG' }, tags: ['gift'], customerEmail: 'ada@example.com', total: 80 },
      { orderNo: 'B2', status: 'paid', shipping: { country: 'SG' }, tags: ['standard'], customerEmail: 'bob@example.com', total: 70 },
      { orderNo: 'C3', status: 'pending', shipping: { country: 'SG' }, tags: ['priority'], customerEmail: 'cora@example.com', total: 60 },
      { orderNo: 'D4', status: 'paid', shipping: { country: 'MY' }, tags: ['priority'], customerEmail: 'dan@example.com', total: 50 },
      { orderNo: 'E5', status: 'paid', shipping: { country: 'SG' }, tags: ['priority'], customerEmail: 'eve@example.com', total: 150 },
    ]);
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('returns paid shippable orders matching every filter', async () => {
    const res = await request(app).get('/orders/shippable/SG/example/100');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ orderNo: 'A1' });
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
  await db.collection('orders').deleteMany({});
  await db.collection('orders').insertMany([
    { orderNo: 'A1', status: 'paid', shipping: { country: 'SG' }, tags: ['gift'], customerEmail: 'ada@example.com', total: 80 },
    { orderNo: 'B2', status: 'paid', shipping: { country: 'SG' }, tags: ['standard'], customerEmail: 'bob@example.com', total: 70 },
    { orderNo: 'C3', status: 'pending', shipping: { country: 'SG' }, tags: ['priority'], customerEmail: 'cora@example.com', total: 60 },
    { orderNo: 'D4', status: 'paid', shipping: { country: 'MY' }, tags: ['priority'], customerEmail: 'dan@example.com', total: 50 },
    { orderNo: 'E5', status: 'paid', shipping: { country: 'SG' }, tags: ['priority'], customerEmail: 'eve@example.com', total: 150 },
  ]);
  await client.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

# Walkthrough

This filter combines several techniques in one object:

```js
{
  status: 'paid',
  'shipping.country': req.params.country,
  tags: { $in: ['gift', 'priority'] },
  customerEmail: { $regex: req.params.term, $options: 'i' },
  total: { $lte: Number(req.params.maxTotal) },
}
```
