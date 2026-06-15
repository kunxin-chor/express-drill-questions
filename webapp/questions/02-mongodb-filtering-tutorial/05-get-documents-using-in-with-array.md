# Problem

Your goal is to match documents when an array contains **any one** of several accepted values. This introduces your first query operator, `$in`.

## What you need to build

- Register a `GET /people/skills/core` route.
- Treat `javascript` and `data` as the accepted "core" skills.
- Return everyone whose `skills` array contains at least one of them.

## The data you are filtering

```js
{ name: 'Ada',   skills: ['javascript', 'mongodb'] }
{ name: 'Grace', skills: ['javascript', 'express'] }
{ name: 'Linus', skills: ['c', 'linux'] }
{ name: 'Maya',  skills: ['mongodb', 'data'] }
```

This should return **Ada**, **Grace**, and **Maya** — Linus has neither skill.

## Concept: the `$in` operator

`$in` takes a **list** and matches if the field is (or, for arrays, contains) **any** one of them. Instead of a plain value you pass an operator object `{ $in: [...] }`.

Predict each result, and notice how adding values widens the match:

```js
{ skills: { $in: ['javascript'] } }          // ?
{ skills: { $in: ['javascript', 'data'] } }  // ?
{ skills: { $in: ['cobol'] } }               // ? (nobody)
```

## Write it in the editor

Type this into the `app.js` editor on the **left** — that is where your answer actually runs:

```js
app.get('/people/skills/core', async (req, res) => {
  const filter = { skills: { $in: ['javascript', 'data'] } };
  const results = await db.collection('people').find(filter).toArray();
  res.json(results);
});
```

- `{ $in: [...] }` is an operator object, not a plain value.
- A document matches if its `skills` array shares at least one value with the list.
- The `.find(...).toArray()` / `res.json(...)` pattern is unchanged.

Press **Run tests** to check.

## Try it

`GET /people/skills/core`

You should see **Ada**, **Grace**, and **Maya** — they each have at least one of the skills (`javascript` or `data`). Linus is excluded because he has neither.

## Summary

`$in` is a logical OR across a single field: "match if the value is one of these". The next lesson, `$all`, flips this logic to require *every* listed value instead of just one.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/people/skills/core', async (req, res) => {
  // TODO: find people with at least one core skill
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

app.get('/people/skills/core', async (req, res) => {
  const results = await db.collection('people').find({
    skills: { $in: ['javascript', 'data'] },
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

describe('GET /people/skills/core', () => {
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
    const res = await request(app).get('/people/skills/core');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'Ada' }),
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

`$in` matches if the array field contains at least one value from the given list.
