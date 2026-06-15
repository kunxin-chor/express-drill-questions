# Problem

Find tickets using `$or`.

The test runner has already started an in-memory MongoDB instance and made it
available through `process.env.MONGODB_URI`.

Using the **native MongoDB driver** (`mongodb`), register a `GET /tickets/actionable`
route that queries the `tickets` collection and returns matching documents as a
**JSON array** via `res.json`.

## Example data

The `tickets` collection may contain documents like:

```js
{ title: 'Login bug', status: 'open', priority: 'normal' }
{ title: 'Data loss', status: 'closed', priority: 'urgent' }
```

## Try tab

After writing your route, try:

`GET /tickets/actionable`

## Hints

- `db.collection('tickets')` gives you the collection handle.
- `.find(filter).toArray()` returns all matching documents.
- `$or` takes an array of filter objects.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/tickets/actionable', async (req, res) => {
  // TODO: query the 'tickets' collection and return matching documents as JSON
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

app.get('/tickets/actionable', async (req, res) => {
  const results = await db.collection('tickets').find({ $or: [{ status: 'open' }, { priority: 'urgent' }] }).toArray();
  res.json(results);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./app');

describe('GET /tickets/actionable', () => {
  let client;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    await db.collection('tickets').deleteMany({});
    await db.collection('tickets').insertMany([
      { title: 'Login bug', status: 'open', priority: 'normal' },
      { title: 'Data loss', status: 'closed', priority: 'urgent' },
      { title: 'Typo', status: 'closed', priority: 'low' },
    ]);
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('responds with status 200', async () => {
    const res = await request(app).get('/tickets/actionable');
    expect(res.status).toBe(200);
  });

  test('returns matching documents as JSON', async () => {
    const res = await request(app).get('/tickets/actionable');
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: 'Login bug' })]),
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
  await db.collection('tickets').deleteMany({});
  await db.collection('tickets').insertMany([
      { title: 'Login bug', status: 'open', priority: 'normal' },
      { title: 'Data loss', status: 'closed', priority: 'urgent' },
      { title: 'Typo', status: 'closed', priority: 'low' },
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
