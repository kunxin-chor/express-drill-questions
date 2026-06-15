# Problem

Combine **`$in`**, a nested object filter, and numerical **`$gte`**.

Register a `GET /courses/recommended/:level/:minRating` route that returns courses whose:

- `skills` array contains either `javascript` or `mongodb`
- nested `meta.level` matches the `level` route parameter
- `rating` is greater than or equal to the `minRating` route parameter

## Example data

The `courses` collection may contain documents like:

```js
{ title: 'Full Stack', skills: ['javascript', 'mongodb'], meta: { level: 'beginner' }, rating: 5 }
{ title: 'Design Basics', skills: ['figma'], meta: { level: 'beginner' }, rating: 5 }
```

## Try tab

After writing your route, try:

`GET /courses/recommended/beginner/4`

## Hints

- Use `$in` to match at least one accepted skill.
- Use dot notation for `meta.level`.
- Convert `minRating` with `Number(...)` before using `$gte`.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/courses/recommended/:level/:minRating', async (req, res) => {
  // TODO: find recommended courses for the requested level and minimum rating
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

app.get('/courses/recommended/:level/:minRating', async (req, res) => {
  const courses = await db.collection('courses').find({
    skills: { $in: ['javascript', 'mongodb'] },
    'meta.level': req.params.level,
    rating: { $gte: Number(req.params.minRating) },
  }).toArray();

  res.json(courses);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./app');

describe('GET /courses/recommended/:level/:minRating', () => {
  let client;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    await db.collection('courses').deleteMany({});
    await db.collection('courses').insertMany([
      { title: 'Full Stack', skills: ['javascript', 'mongodb'], meta: { level: 'beginner' }, rating: 5 },
      { title: 'Mongo Deep Dive', skills: ['mongodb'], meta: { level: 'advanced' }, rating: 5 },
      { title: 'Design Basics', skills: ['figma'], meta: { level: 'beginner' }, rating: 5 },
      { title: 'JS Warmup', skills: ['javascript'], meta: { level: 'beginner' }, rating: 3 },
    ]);
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('returns courses matching skill, level, and minimum rating', async () => {
    const res = await request(app).get('/courses/recommended/beginner/4');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ title: 'Full Stack' });
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
  await db.collection('courses').deleteMany({});
  await db.collection('courses').insertMany([
    { title: 'Full Stack', skills: ['javascript', 'mongodb'], meta: { level: 'beginner' }, rating: 5 },
    { title: 'Mongo Deep Dive', skills: ['mongodb'], meta: { level: 'advanced' }, rating: 5 },
    { title: 'Design Basics', skills: ['figma'], meta: { level: 'beginner' }, rating: 5 },
    { title: 'JS Warmup', skills: ['javascript'], meta: { level: 'beginner' }, rating: 3 },
  ]);
  await client.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

# Walkthrough

This filter combines three ideas:

```js
{
  skills: { $in: ['javascript', 'mongodb'] },
  'meta.level': req.params.level,
  rating: { $gte: Number(req.params.minRating) },
}
```
