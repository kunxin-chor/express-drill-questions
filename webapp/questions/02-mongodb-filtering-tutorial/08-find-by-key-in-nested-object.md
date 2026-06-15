# Problem

Your goal is to filter on a field that lives **inside a nested object**. Real documents are rarely flat, so this is an essential skill.

## What you need to build

- Register a `GET /people/city/:city` route.
- Read the city from the URL.
- Return everyone whose `address.city` matches.

## The data you are filtering

```js
{ name: 'Ada',   address: { city: 'London',   country: 'UK' } }
{ name: 'Grace', address: { city: 'New York', country: 'US' } }
{ name: 'Linus', address: { city: 'Helsinki', country: 'FI' } }
{ name: 'Maya',  address: { city: 'London',   country: 'UK' } }
```

Requesting `London` should return **Ada** and **Maya**.

## Concept: dot notation

To reach a field inside a sub-document, use a **quoted** dotted path as the key: `'parent.child'`.

Predict each result:

```js
{ 'address.city': 'London' }      // ?
{ 'address.country': 'UK' }       // ?
{ address: { city: 'London' } }   // careful — matches the WHOLE address object
```

The third one is a common trap: it only matches if `address` equals that exact object, with no other fields.

## Write it in the editor

Type your handler into the `app.js` editor on the **left** — the snippets here are only for reading:

```js
app.get('/people/city/:city', async (req, res) => {
  const filter = { 'address.city': req.params.city };
  const results = await db.collection('people').find(filter).toArray();
  res.json(results);
});
```

- The key must be the quoted string `'address.city'` — the dot lives inside the quotes.
- It looks one level down at `city` inside `address`.
- The value is matched with ordinary equality.

Click **Run tests** when done.

## Try it

`GET /people/city/London`

You should see **Ada** and **Maya** — both live in London. The dot notation `'address.city'` reaches inside the nested object to match just that field, not the whole address. Try `GET /people/city/Helsinki` to see only Linus.

## Summary

Dot notation queries deep inside documents without unpacking them, works at any depth (`'a.b.c'`), and combines with every operator, for example `{ 'address.city': { $in: [...] } }`.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/people/city/:city', async (req, res) => {
  // TODO: find people who live in the requested city
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

app.get('/people/city/:city', async (req, res) => {
  const results = await db.collection('people').find({
    'address.city': req.params.city,
  }).toArray();
  res.json(results);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./app');

describe('GET /people/city/:city', () => {
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
    const res = await request(app).get('/people/city/London');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'Ada' }),
        expect.objectContaining({ name: 'Maya' })
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

The key `'address.city'` tells MongoDB to look inside the `address` object.
