# Problem

Your goal is to build a **flexible filter endpoint** that accepts many different criteria via query strings and combines them into a single MongoDB filter. This brings together every technique you have learned: equality, arrays, `$in`, `$all`, comparison operators, dot notation, `$or`, and `$regex`.

## What you need to build

- Register a `GET /people` route that reads from `req.query`.
- Build a filter object that conditionally includes:
  - `role` (exact match)
  - `status` (exact match)
  - `tag` (array contains value)
  - `skills` (array contains all values via `$all`)
  - `minAge` and `maxAge` (numeric range via `$gte` and `$lte`)
  - `city` (nested object via dot notation)
  - `search` (case-insensitive `$regex` across `title` and `description` via `$or`)
- Only add a condition to the filter if the corresponding query parameter is present.
- Return the matching documents.

## The data you are filtering

```js
{ name: 'Ada',   role: 'admin',   status: 'active', age: 28, tags: ['node', 'mongodb'], skills: ['javascript', 'mongodb'], address: { city: 'London' }, title: 'Learning Express APIs', description: 'Build routes with Express and MongoDB' }
{ name: 'Grace', role: 'student', status: 'active', age: 34, tags: ['node', 'express'], skills: ['javascript', 'express'], address: { city: 'New York' }, title: 'Express Routing Guide', description: 'Learn route parameters and query strings' }
{ name: 'Linus', role: 'admin',   status: 'inactive', age: 42, tags: ['linux', 'systems'], skills: ['c', 'linux'], address: { city: 'Helsinki' }, title: 'Systems Notes', description: 'Operating systems and server tools' }
{ name: 'Maya',  role: 'student', status: 'active', age: 24, tags: ['mongodb', 'database'], skills: ['mongodb', 'data'], address: { city: 'London' }, title: 'MongoDB Search Basics', description: 'Filter documents with find and regex' }
```

## Concept: building a dynamic filter

Start with an empty filter object and conditionally add properties only when the query parameter exists. This lets a single endpoint handle many combinations.

Predict which people match each URL:

```js
GET /people?role=admin                          // ?
GET /people?tag=node                            // ?
GET /people?minAge=25&maxAge=35                 // ?
GET /people?city=London                         // ?
GET /people?skills=javascript&skills=mongodb    // ? (requires both)
GET /people?search=express                      // ?
GET /people?role=student&city=London            // ? (AND across fields)
```

## Write it in the editor

Type the full route into the `app.js` editor on the **left** — that is where your code runs:

```js
app.get('/people', async (req, res) => {
  const filter = {};

  if (req.query.role) {
    filter.role = req.query.role;
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.tag) {
    filter.tags = req.query.tag;
  }

  if (req.query.skills) {
    const skills = req.query.skills.split(',');
    filter.skills = { $all: skills };
  }

  if (req.query.minAge || req.query.maxAge) {
    filter.age = {};
    if (req.query.minAge) {
      filter.age.$gte = Number(req.query.minAge);
    }
    if (req.query.maxAge) {
      filter.age.$lte = Number(req.query.maxAge);
    }
  }

  if (req.query.city) {
    filter['address.city'] = req.query.city;
  }

  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const results = await db.collection('people').find(filter).toArray();
  res.json(results);
});
```

- Start with `const filter = {}` — an empty object means no conditions by default.
- Each `if` checks whether a query parameter exists before adding it to the filter.
- `skills` is split by commas because `$all` expects an array of values.
- For age, build `{ age: { $gte: ..., $lte: ... } }` only if min or max is provided.
- `address.city` uses dot notation to reach the nested field.
- `search` adds an `$or` branch to search both text fields with `$regex`.
- All conditions are ANDed together automatically because they are in the same object.

Click **Run tests**, then experiment with different query combinations in the **Try** tab.

## Try it

`GET /people?role=student&city=London`

You should see only **Maya** — she is a student who lives in London. The endpoint combined two equality conditions (`role` and `address.city`) into one filter. Try `GET /people?minAge=25&maxAge=35` to see Ada and Grace, or `GET /people?skills=javascript&skills=mongodb` to see only Ada.

## Summary

A flexible filter endpoint is built by conditionally adding properties to a filter object based on which query parameters are present. This pattern lets a single route handle many filtering combinations without writing separate endpoints for each one. Every operator you learned — equality, arrays, `$in`, `$all`, comparison operators, dot notation, `$or`, and `$regex` — can be mixed in the same filter to answer complex questions in one query.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/people', async (req, res) => {
  // TODO: build a dynamic filter from req.query and return matching people
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

app.get('/people', async (req, res) => {
  const filter = {};

  if (req.query.role) {
    filter.role = req.query.role;
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.tag) {
    filter.tags = req.query.tag;
  }

  if (req.query.skills) {
    const skills = req.query.skills.split(',');
    filter.skills = { $all: skills };
  }

  if (req.query.minAge || req.query.maxAge) {
    filter.age = {};
    if (req.query.minAge) {
      filter.age.$gte = Number(req.query.minAge);
    }
    if (req.query.maxAge) {
      filter.age.$lte = Number(req.query.maxAge);
    }
  }

  if (req.query.city) {
    filter['address.city'] = req.query.city;
  }

  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const results = await db.collection('people').find(filter).toArray();
  res.json(results);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./app');

describe('GET /people (flexible filter)', () => {
  let client;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    await db.collection('people').deleteMany({});
    await db.collection('people').insertMany([
      { name: 'Ada',   role: 'admin',   status: 'active', age: 28, tags: ['node', 'mongodb'], skills: ['javascript', 'mongodb'], address: { city: 'London' }, title: 'Learning Express APIs', description: 'Build routes with Express and MongoDB' },
      { name: 'Grace', role: 'student', status: 'active', age: 34, tags: ['node', 'express'], skills: ['javascript', 'express'], address: { city: 'New York' }, title: 'Express Routing Guide', description: 'Learn route parameters and query strings' },
      { name: 'Linus', role: 'admin',   status: 'inactive', age: 42, tags: ['linux', 'systems'], skills: ['c', 'linux'], address: { city: 'Helsinki' }, title: 'Systems Notes', description: 'Operating systems and server tools' },
      { name: 'Maya',  role: 'student', status: 'active', age: 24, tags: ['mongodb', 'database'], skills: ['mongodb', 'data'], address: { city: 'London' }, title: 'MongoDB Search Basics', description: 'Filter documents with find and regex' },
    ]);
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('returns all people when no query parameters', async () => {
    const res = await request(app).get('/people');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(4);
  });

  test('filters by role', async () => {
    const res = await request(app).get('/people?role=admin');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((p) => p.name)).toEqual(expect.arrayContaining(['Ada', 'Linus']));
  });

  test('filters by tag', async () => {
    const res = await request(app).get('/people?tag=node');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((p) => p.name)).toEqual(expect.arrayContaining(['Ada', 'Grace']));
  });

  test('filters by skills using $all', async () => {
    const res = await request(app).get('/people?skills=javascript,mongodb');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Ada');
  });

  test('filters by age range', async () => {
    const res = await request(app).get('/people?minAge=25&maxAge=35');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((p) => p.name)).toEqual(expect.arrayContaining(['Ada', 'Grace']));
  });

  test('filters by city using dot notation', async () => {
    const res = await request(app).get('/people?city=London');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((p) => p.name)).toEqual(expect.arrayContaining(['Ada', 'Maya']));
  });

  test('searches title and description with $regex', async () => {
    const res = await request(app).get('/people?search=express');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((p) => p.name)).toEqual(expect.arrayContaining(['Ada', 'Grace']));
  });

  test('combines multiple conditions with AND', async () => {
    const res = await request(app).get('/people?role=student&city=London');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Maya');
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
    { name: 'Ada',   role: 'admin',   status: 'active', age: 28, tags: ['node', 'mongodb'], skills: ['javascript', 'mongodb'], address: { city: 'London' }, title: 'Learning Express APIs', description: 'Build routes with Express and MongoDB' },
    { name: 'Grace', role: 'student', status: 'active', age: 34, tags: ['node', 'express'], skills: ['javascript', 'express'], address: { city: 'New York' }, title: 'Express Routing Guide', description: 'Learn route parameters and query strings' },
    { name: 'Linus', role: 'admin',   status: 'inactive', age: 42, tags: ['linux', 'systems'], skills: ['c', 'linux'], address: { city: 'Helsinki' }, title: 'Systems Notes', description: 'Operating systems and server tools' },
    { name: 'Maya',  role: 'student', status: 'active', age: 24, tags: ['mongodb', 'database'], skills: ['mongodb', 'data'], address: { city: 'London' }, title: 'MongoDB Search Basics', description: 'Filter documents with find and regex' },
  ]);
  await client.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

# Walkthrough

The key idea is to start with an empty filter and only add conditions when the corresponding query parameter exists. This pattern:

```js
const filter = {};
if (req.query.role) {
  filter.role = req.query.role;
}
```

lets a single endpoint handle many combinations. For arrays like `skills`, split the comma-separated string and use `$all` to require all values. For ranges like age, build the operator object only if the bound is provided. For nested fields like `address.city`, use dot notation. For text search, add an `$or` branch with `$regex`. All conditions in the same object are ANDed together automatically, so `role=student&city=London` means "student AND London".
