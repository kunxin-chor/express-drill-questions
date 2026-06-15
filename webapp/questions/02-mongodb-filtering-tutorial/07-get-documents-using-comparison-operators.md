# Problem

Your goal is to filter documents by a **numeric range** rather than an exact value. MongoDB does this with comparison operators.

## What you need to build

- Register a `GET /people/age/:min/:max` route.
- Read `min` and `max` from the URL and convert them to numbers.
- Return everyone whose `age` falls between `min` and `max` (inclusive).

## The data you are filtering

```js
{ name: 'Ada',   age: 28 }
{ name: 'Grace', age: 34 }
{ name: 'Linus', age: 42 }
{ name: 'Maya',  age: 24 }
```

Requesting `25`–`35` should return **Ada** and **Grace**.

## Concept: comparison operators

For ranges, the value becomes an operator object using `$gt` (greater than), `$gte` (greater than or equal), `$lt` (less than), or `$lte` (less than or equal).

Predict who matches each filter:

```js
{ age: { $gte: 30 } }            // 30 and older
{ age: { $lt: 30 } }             // under 30
{ age: { $gte: 25, $lte: 35 } }  // between 25 and 35
```

The last example stacks two operators on one field to bound it from both sides.

## Write it in the editor

The **left** panel is your `app.js` editor — **type the route there**, not in this tab:

```js
app.get('/people/age/:min/:max', async (req, res) => {
  const min = Number(req.params.min);
  const max = Number(req.params.max);
  const filter = { age: { $gte: min, $lte: max } };
  const results = await db.collection('people').find(filter).toArray();
  res.json(results);
});
```

- `Number(...)` converts URL text to a real number — params are always strings, and `'9' > '10'` is true for text.
- `$gte: min` and `$lte: max` together bound the age range inclusively.

Press **Run tests** to verify.

## Try it

`GET /people/age/25/35`

You should see **Ada** (age 28) and **Grace** (age 34) — both fall between 25 and 35 inclusive. Maya (24) is too young and Linus (42) is too old. Try `GET /people/age/40/99` to see only Linus.

## Summary

Comparison operators turn a single field into a range, and you can stack several on one field. Always convert strings to numbers first — a forgotten `Number(...)` is the most common cause of wrong results.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/people/age/:min/:max', async (req, res) => {
  // TODO: find people whose age is between min and max
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

app.get('/people/age/:min/:max', async (req, res) => {
  const min = Number(req.params.min);
  const max = Number(req.params.max);
  const results = await db.collection('people').find({
    age: { $gte: min, $lte: max },
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

describe('GET /people/age/:min/:max', () => {
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
    const res = await request(app).get('/people/age/25/35');
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

Comparison operators are placed inside the field you want to compare.
