# Problem

Your goal is to match documents only when an array contains **every** required value. This contrasts directly with `$in` from the last lesson.

## What you need to build

- Register a `GET /people/skills/full-stack` route.
- Treat `javascript` and `mongodb` as the required full-stack skills.
- Return only the people whose `skills` array contains **both**.

## The data you are filtering

```js
{ name: 'Ada',   skills: ['javascript', 'mongodb'] }
{ name: 'Grace', skills: ['javascript', 'express'] }
{ name: 'Linus', skills: ['c', 'linux'] }
{ name: 'Maya',  skills: ['mongodb', 'data'] }
```

Only **Ada** has both skills, so only Ada should be returned.

## Concept: the `$all` operator

`$all` also takes a list, but matches only when the array contains **all** of the values.

Predict each result, then notice how `$all` differs from `$in`:

```js
{ skills: { $all: ['javascript'] } }             // ?
{ skills: { $all: ['javascript', 'mongodb'] } }  // ? (both required)
{ skills: { $in:  ['javascript', 'mongodb'] } }  // ? (either is enough)
```

The last two look almost identical but give different answers.

## Write it in the editor

Edit the `app.js` shown in the **left** panel — that is where you type your solution:

```js
app.get('/people/skills/full-stack', async (req, res) => {
  const filter = { skills: { $all: ['javascript', 'mongodb'] } };
  const results = await db.collection('people').find(filter).toArray();
  res.json(results);
});
```

- `{ $all: [...] }` requires every listed value to be present.
- Order does not matter and extra values are allowed.
- A document missing even one value is excluded.

Then click **Run tests**.

## Try it

`GET /people/skills/full-stack`

You should see only **Ada** — she is the only person whose `skills` array contains both `javascript` and `mongodb`. Grace has only `javascript`, Maya has only `mongodb`, and Linus has neither.

## Summary

`$in` asks "contains *any* of these?" (OR); `$all` asks "contains *all* of these?" (AND). Pick based on whether one match is enough or every value is mandatory.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/people/skills/full-stack', async (req, res) => {
  // TODO: find people who have both required skills
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

app.get('/people/skills/full-stack', async (req, res) => {
  const results = await db.collection('people').find({
    skills: { $all: ['javascript', 'mongodb'] },
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

describe('GET /people/skills/full-stack', () => {
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
    const res = await request(app).get('/people/skills/full-stack');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'Ada' })
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

`$all` is stricter than `$in`; all listed values must be present.
