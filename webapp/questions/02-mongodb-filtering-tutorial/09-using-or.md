# Problem

Your goal is to return documents that match **at least one** of several different conditions. Until now every extra field narrowed results (AND); `$or` lets you widen them.

## What you need to build

- Register a `GET /people/admin-or-london` route.
- Return everyone who is either an `admin` **or** lives in `London`.

## The data you are filtering

```js
{ name: 'Ada',   role: 'admin',   address: { city: 'London' } }
{ name: 'Grace', role: 'student', address: { city: 'New York' } }
{ name: 'Linus', role: 'admin',   address: { city: 'Helsinki' } }
{ name: 'Maya',  role: 'student', address: { city: 'London' } }
```

This should return **Ada** (both), **Linus** (admin), and **Maya** (London) — but not Grace.

## Concept: the `$or` operator

`$or` takes an **array of filter objects**; a document matches if **any** branch is true. It is a top-level key, not attached to one field.

Predict each result:

```js
{ $or: [{ role: 'admin' }] }                                // same as { role: 'admin' }
{ $or: [{ role: 'admin' }, { 'address.city': 'London' }] }  // admins OR Londoners
{ status: 'active', $or: [{ role: 'admin' }] }              // active AND admin
```

The last example mixes AND and OR: fields written outside `$or` still apply.

## Write it in the editor

The **left** panel is the `app.js` editor — **that is where your answer goes**:

```js
app.get('/people/admin-or-london', async (req, res) => {
  const filter = {
    $or: [
      { role: 'admin' },
      { 'address.city': 'London' },
    ],
  };
  const results = await db.collection('people').find(filter).toArray();
  res.json(results);
});
```

- Each array element is a complete little filter.
- A document is kept if it satisfies any branch.
- Branches may target different fields.

Press **Run tests**.

## Try it

`GET /people/admin-or-london`

You should see **Ada** (admin in London), **Linus** (admin in Helsinki), and **Maya** (student in London). Grace is excluded — she is neither admin nor in London. The `$or` widens the match to include anyone satisfying *at least one* branch.

## Summary

Side-by-side fields mean AND; `$or` introduces OR across whole conditions. Mixing them gives "fieldX AND (branch1 OR branch2)".

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/people/admin-or-london', async (req, res) => {
  // TODO: find people who are admins or live in London
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

app.get('/people/admin-or-london', async (req, res) => {
  const results = await db.collection('people').find({
    $or: [{ role: 'admin' }, { 'address.city': 'London' }],
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

describe('GET /people/admin-or-london', () => {
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
    const res = await request(app).get('/people/admin-or-london');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'Ada' }),
        expect.objectContaining({ name: 'Linus' }),
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

`$or` accepts an array of filter objects. MongoDB checks each branch.
