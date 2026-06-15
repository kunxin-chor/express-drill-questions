# Problem

Combine **two text fields** with a **nested object** filter.

Register a `GET /users/admins/:city` route that returns users whose:

- `role` is `admin`
- `status` is `active`
- nested `address.city` matches the `city` route parameter

## Example data

The `users` collection may contain documents like:

```js
{ name: 'Ada', role: 'admin', status: 'active', address: { city: 'London' } }
{ name: 'Grace', role: 'admin', status: 'inactive', address: { city: 'London' } }
```

## Try tab

After writing your route, try:

`GET /users/admins/London`

## Hints

- Match multiple text fields in the same filter object.
- Use dot notation for the nested city: `'address.city'`.
- Return all matches with `.find(filter).toArray()`.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/users/admins/:city', async (req, res) => {
  // TODO: find active admin users in the requested city
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

app.get('/users/admins/:city', async (req, res) => {
  const users = await db.collection('users').find({
    role: 'admin',
    status: 'active',
    'address.city': req.params.city,
  }).toArray();

  res.json(users);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./app');

describe('GET /users/admins/:city', () => {
  let client;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    await db.collection('users').deleteMany({});
    await db.collection('users').insertMany([
      { name: 'Ada', role: 'admin', status: 'active', address: { city: 'London' } },
      { name: 'Grace', role: 'admin', status: 'inactive', address: { city: 'London' } },
      { name: 'Linus', role: 'member', status: 'active', address: { city: 'London' } },
      { name: 'Alan', role: 'admin', status: 'active', address: { city: 'Manchester' } },
    ]);
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('returns active admins in the requested city', async () => {
    const res = await request(app).get('/users/admins/London');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ name: 'Ada', role: 'admin', status: 'active' });
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
    { name: 'Ada', role: 'admin', status: 'active', address: { city: 'London' } },
    { name: 'Grace', role: 'admin', status: 'inactive', address: { city: 'London' } },
    { name: 'Linus', role: 'member', status: 'active', address: { city: 'London' } },
    { name: 'Alan', role: 'admin', status: 'active', address: { city: 'Manchester' } },
  ]);
  await client.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

# Walkthrough

This filter combines exact text matches with dot notation:

```js
{ role: 'admin', status: 'active', 'address.city': req.params.city }
```
