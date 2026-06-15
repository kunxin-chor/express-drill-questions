# Problem

Find users by a value inside a nested object.

The test runner has already started an in-memory MongoDB instance and made it
available through `process.env.MONGODB_URI`.

Using the **native MongoDB driver** (`mongodb`), register a `GET /users/city/:city`
route that queries the `users` collection and returns matching documents as a
**JSON array** via `res.json`.

## Example data

The `users` collection may contain documents like:

```js
{ name: 'Ada', address: { city: 'London', country: 'UK' } }
{ name: 'Grace', address: { city: 'New York', country: 'US' } }
```

## Try tab

After writing your route, try:

`GET /users/city/London`

## Hints

- `db.collection('users')` gives you the collection handle.
- `.find(filter).toArray()` returns all matching documents.
- Use dot notation like `address.city` to query nested fields.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/users/city/:city', async (req, res) => {
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

app.get('/users/city/:city', async (req, res) => {
  const results = await db.collection('users').find({ 'address.city': req.params.city }).toArray();
  res.json(results);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./app');

describe('GET /users/city/:city', () => {
  let client;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    await db.collection('users').deleteMany({});
    await db.collection('users').insertMany([
      { name: 'Ada', address: { city: 'London', country: 'UK' } },
      { name: 'Grace', address: { city: 'New York', country: 'US' } },
      { name: 'Alan', address: { city: 'London', country: 'UK' } },
    ]);
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('responds with status 200', async () => {
    const res = await request(app).get('/users/city/London');
    expect(res.status).toBe(200);
  });

  test('returns matching documents as JSON', async () => {
    const res = await request(app).get('/users/city/London');
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Ada' })]),
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
      { name: 'Ada', address: { city: 'London', country: 'UK' } },
      { name: 'Grace', address: { city: 'New York', country: 'US' } },
      { name: 'Alan', address: { city: 'London', country: 'UK' } },
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
