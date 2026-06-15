# Problem

Your goal is to return documents that satisfy **two** conditions at once. You will learn how MongoDB combines multiple fields in a single filter.

## What you need to build

- Register a `GET /people/:role/:status` route.
- Read both `role` and `status` from the URL.
- Return only the people who match **both** values.

## The data you are filtering

```js
{ name: 'Ada',   role: 'admin',   status: 'active' }
{ name: 'Grace', role: 'student', status: 'active' }
{ name: 'Linus', role: 'admin',   status: 'inactive' }
{ name: 'Maya',  role: 'student', status: 'active' }
```

Requesting `student` + `active` should return **Grace** and **Maya**.

## Concept: combining fields (AND)

List more than one field in the same object and MongoDB requires **all** of them to match — an automatic AND.

Compare these filters and predict how many of the four people each returns:

```js
{ role: 'student' }                      // ?
{ role: 'student', status: 'active' }    // ?
{ role: 'student', status: 'inactive' }  // ?
```

Each extra field can only *narrow* the result, never widen it.

## Write it in the editor

Type your answer into the `app.js` editor on the **left** — the snippets in this tab are just for reading. Complete the handler like this:

```js
app.get('/people/:role/:status', async (req, res) => {
  const filter = {
    role: req.params.role,
    status: req.params.status,
  };
  const results = await db.collection('people').find(filter).toArray();
  res.json(results);
});
```

- `req.params.role` and `req.params.status` read the two URL segments.
- Both pairs in one object are joined with AND — you never write the word "and".
- A document is returned only if `role` matches *and* `status` matches.

Press **Run tests** when ready.

## Try it

`GET /people/student/active`

You should see **Grace** and **Maya** — only the people who are both students AND active. Try `GET /people/admin/inactive` to see only Linus.

## Summary

Adding fields to a filter narrows results because every field is an AND condition. To *widen* results instead, you need `$or`, covered in a later lesson.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/people/:role/:status', async (req, res) => {
  // TODO: find people matching both role and status
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

app.get('/people/:role/:status', async (req, res) => {
  const results = await db.collection('people').find({
    role: req.params.role,
    status: req.params.status,
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

describe('GET /people/:role/:status', () => {
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
    const res = await request(app).get('/people/student/active');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'Grace' }),
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

Multiple properties in the same filter object must all match.
