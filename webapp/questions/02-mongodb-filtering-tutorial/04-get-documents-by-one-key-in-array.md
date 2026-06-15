# Problem

Your goal is to find documents where an **array field** contains a particular value. Arrays behave differently from plain fields, and this lesson shows how.

## What you need to build

- Register a `GET /people/tag/:tag` route.
- Read the wanted tag from the URL.
- Return everyone whose `tags` array contains that tag.

## The data you are filtering

```js
{ name: 'Ada',   tags: ['node', 'mongodb'] }
{ name: 'Grace', tags: ['node', 'express'] }
{ name: 'Linus', tags: ['linux', 'systems'] }
{ name: 'Maya',  tags: ['mongodb', 'database'] }
```

Requesting `node` should return **Ada** and **Grace**.

## Concept: matching inside an array

When a field holds an array, comparing it to a single value asks "does the array **contain** this value?".

Predict the matches for each filter:

```js
{ tags: 'node' }      // ?
{ tags: 'mongodb' }   // ?
{ tags: 'python' }    // ? (no one has it)
```

You do **not** need a special operator to match one element — plain equality is array-aware.

## Write it in the editor

The left panel holds the `app.js` you must edit. **Type your route there**, replacing the `// TODO`:

```js
app.get('/people/tag/:tag', async (req, res) => {
  const results = await db.collection('people').find({ tags: req.params.tag }).toArray();
  res.json(results);
});
```

- `tags` is an array field in each document.
- `{ tags: req.params.tag }` matches when the array includes that value.
- `.toArray()` then `res.json(...)` returns the matches.

Click **Run tests**, then experiment in the **Try** tab.

## Try it

`GET /people/tag/node`

You should see **Ada** and **Grace** — both have `node` in their `tags` array. Try `GET /people/tag/mongodb` to see Ada and Maya.

## Summary

MongoDB reads `{ arrayField: value }` as "this array contains value". To match against several possible values, or require several at once, you reach for `$in` and `$all` — the next two lessons.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/people/tag/:tag', async (req, res) => {
  // TODO: find people whose tags array contains the requested tag
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

app.get('/people/tag/:tag', async (req, res) => {
  const results = await db.collection('people').find({ tags: req.params.tag }).toArray();
  res.json(results);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./app');

describe('GET /people/tag/:tag', () => {
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
    const res = await request(app).get('/people/tag/node');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'Ada' }),
        expect.objectContaining({ name: 'Grace' })
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

MongoDB can match a single array element with a direct equality filter.
