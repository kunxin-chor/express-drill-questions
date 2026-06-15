# Problem

Your goal is to return only the documents whose `role` matches a value taken from the URL. This is your first real filter — one field, one value.

## What you need to build

- Register a `GET /people/role/:role` route.
- Read the `role` value from the URL.
- Return only the people whose `role` field equals that value.

## The data you are filtering

```js
{ name: 'Ada',   role: 'admin' }
{ name: 'Grace', role: 'student' }
{ name: 'Linus', role: 'admin' }
{ name: 'Maya',  role: 'student' }
```

Requesting `admin` should return **Ada** and **Linus**.

## Concept: the equality filter

To match by a single field, put that field and the wanted value inside the filter object: `{ field: value }`.

Predict what each of these filters returns from the sample data:

```js
{ role: 'admin' }     // ?
{ role: 'student' }   // ?
{ status: 'active' }  // a different field entirely
```

The key must match the field name in the document, and the value is what you compare against. Your route makes the value dynamic by reading it from the URL with `req.params.role`.

## Write it in the editor

The left panel is the code editor, and **that is where you type your answer** (not in this tab). Replace the `// TODO` inside the `GET /people/role/:role` handler with:

```js
app.get('/people/role/:role', async (req, res) => {
  const filter = { role: req.params.role };
  const results = await db.collection('people').find(filter).toArray();
  res.json(results);
});
```

- `req.params.role` reads the `:role` part of the URL (`/people/role/admin` gives `'admin'`).
- `{ role: req.params.role }` keeps documents whose `role` equals that value.
- `.find(filter).toArray()` runs the query and collects matches.
- `res.json(results)` returns them.

Click **Run tests**, then try different roles in the **Try** tab.

## Try it

`GET /people/role/admin`

You should see **Ada** and **Linus** — only the people whose `role` equals `admin`. Try `GET /people/role/student` next to see Grace and Maya.

## Summary

The simplest filter is one key/value pair. MongoDB compares that field in every document and keeps the exact matches. Every operator you meet later is just a richer value placed against a field.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/people/role/:role', async (req, res) => {
  // TODO: find people with the requested role
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

app.get('/people/role/:role', async (req, res) => {
  const results = await db.collection('people').find({ role: req.params.role }).toArray();
  res.json(results);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./app');

describe('GET /people/role/:role', () => {
  let client;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    await db.collection('people').deleteMany({});
    await db.collection('people').insertMany([
  { name: 'Ada', role: 'admin', status: 'active', age: 28, tags: ['node', 'mongodb'], skills: ['javascript', 'mongodb'], address: { city: 'London', country: 'UK' }, title: 'Learning Express APIs', description: 'Build routes with Express and MongoDB' },
  { name: 'Grace', role: 'student', status: 'active', age: 34, tags: ['node', 'express'], skills: ['javascript', 'express'], address: { city: 'New York', country: 'US' }, title: 'Express Routing Guide', description: 'Learn route parameters and query strings' },
  { name: 'Linus', role: 'admin', status: 'inactive', age: 42, tags: ['linux', 'systems'], skills: ['c', 'linux'], address: { city: 'Helsinki', country: 'FI' }, title: 'Systems Notes', description: 'Operating systems and server tools' },
  { name: 'Maya', role: 'student', status: 'active', age: 24, tags: ['mongodb', 'database'], skills: ['mongodb', 'data'], address: { city: 'London', country: 'UK' }, title: 'MongoDB Search Basics', description: 'Filter documents with find and regex' }
]);
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('returns the expected documents', async () => {
    const res = await request(app).get('/people/role/admin');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'Ada' }),
        expect.objectContaining({ name: 'Linus' })
    ]));
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
  await db.collection('people').deleteMany({});
  await db.collection('people').insertMany([
  { name: 'Ada', role: 'admin', status: 'active', age: 28, tags: ['node', 'mongodb'], skills: ['javascript', 'mongodb'], address: { city: 'London', country: 'UK' }, title: 'Learning Express APIs', description: 'Build routes with Express and MongoDB' },
  { name: 'Grace', role: 'student', status: 'active', age: 34, tags: ['node', 'express'], skills: ['javascript', 'express'], address: { city: 'New York', country: 'US' }, title: 'Express Routing Guide', description: 'Learn route parameters and query strings' },
  { name: 'Linus', role: 'admin', status: 'inactive', age: 42, tags: ['linux', 'systems'], skills: ['c', 'linux'], address: { city: 'Helsinki', country: 'FI' }, title: 'Systems Notes', description: 'Operating systems and server tools' },
  { name: 'Maya', role: 'student', status: 'active', age: 24, tags: ['mongodb', 'database'], skills: ['mongodb', 'data'], address: { city: 'London', country: 'UK' }, title: 'MongoDB Search Basics', description: 'Filter documents with find and regex' }
]);
  await client.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

# Walkthrough

The filter `{ role: req.params.role }` keeps documents whose `role` value exactly matches the URL.
