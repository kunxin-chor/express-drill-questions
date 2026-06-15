# Problem

Find events where an attendee exists in an array field.

The test runner has already started an in-memory MongoDB instance and made it
available through `process.env.MONGODB_URI`.

Using the **native MongoDB driver** (`mongodb`), register a `GET /events/attendees/:name`
route that queries the `events` collection and returns matching documents as a
**JSON array** via `res.json`.

## Example data

The `events` collection may contain documents like:

```js
{ title: 'Workshop', attendees: ['Ada', 'Grace'] }
{ title: 'Demo Day', attendees: ['Linus'] }
```

## Try tab

After writing your route, try:

`GET /events/attendees/Grace`

## Hints

- `db.collection('events')` gives you the collection handle.
- `.find(filter).toArray()` returns all matching documents.
- MongoDB can match array elements with a direct equality filter.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/events/attendees/:name', async (req, res) => {
  // TODO: query the 'events' collection and return matching documents as JSON
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

app.get('/events/attendees/:name', async (req, res) => {
  const results = await db.collection('events').find({ attendees: req.params.name }).toArray();
  res.json(results);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./app');

describe('GET /events/attendees/:name', () => {
  let client;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    await db.collection('events').deleteMany({});
    await db.collection('events').insertMany([
      { title: 'Workshop', attendees: ['Ada', 'Grace'] },
      { title: 'Demo Day', attendees: ['Linus'] },
      { title: 'Study Group', attendees: ['Grace'] },
    ]);
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('responds with status 200', async () => {
    const res = await request(app).get('/events/attendees/Grace');
    expect(res.status).toBe(200);
  });

  test('returns matching documents as JSON', async () => {
    const res = await request(app).get('/events/attendees/Grace');
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: 'Workshop' })]),
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
  await db.collection('events').deleteMany({});
  await db.collection('events').insertMany([
      { title: 'Workshop', attendees: ['Ada', 'Grace'] },
      { title: 'Demo Day', attendees: ['Linus'] },
      { title: 'Study Group', attendees: ['Grace'] },
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
