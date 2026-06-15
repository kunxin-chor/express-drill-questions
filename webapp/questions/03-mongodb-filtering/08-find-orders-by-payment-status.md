# Problem

Find orders by a value inside a nested payment object.

The test runner has already started an in-memory MongoDB instance and made it
available through `process.env.MONGODB_URI`.

Using the **native MongoDB driver** (`mongodb`), register a `GET /orders/payment/:status`
route that queries the `orders` collection and returns matching documents as a
**JSON array** via `res.json`.

## Example data

The `orders` collection may contain documents like:

```js
{ orderNo: 'A1', payment: { status: 'paid', method: 'card' } }
{ orderNo: 'B2', payment: { status: 'pending', method: 'bank' } }
```

## Try tab

After writing your route, try:

`GET /orders/payment/paid`

## Hints

- `db.collection('orders')` gives you the collection handle.
- `.find(filter).toArray()` returns all matching documents.
- Use dot notation to match `payment.status` without matching the whole object.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/orders/payment/:status', async (req, res) => {
  // TODO: query the 'orders' collection and return matching documents as JSON
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

app.get('/orders/payment/:status', async (req, res) => {
  const results = await db.collection('orders').find({ 'payment.status': req.params.status }).toArray();
  res.json(results);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./app');

describe('GET /orders/payment/:status', () => {
  let client;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    await db.collection('orders').deleteMany({});
    await db.collection('orders').insertMany([
      { orderNo: 'A1', payment: { status: 'paid', method: 'card' } },
      { orderNo: 'B2', payment: { status: 'pending', method: 'bank' } },
      { orderNo: 'C3', payment: { status: 'paid', method: 'cash' } },
    ]);
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('responds with status 200', async () => {
    const res = await request(app).get('/orders/payment/paid');
    expect(res.status).toBe(200);
  });

  test('returns matching documents as JSON', async () => {
    const res = await request(app).get('/orders/payment/paid');
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ orderNo: 'A1' })]),
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
  await db.collection('orders').deleteMany({});
  await db.collection('orders').insertMany([
      { orderNo: 'A1', payment: { status: 'paid', method: 'card' } },
      { orderNo: 'B2', payment: { status: 'pending', method: 'bank' } },
      { orderNo: 'C3', payment: { status: 'paid', method: 'cash' } },
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
