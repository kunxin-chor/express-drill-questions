# Problem

Your goal is to build a small **search endpoint** that matches a term against more than one text field. This combines the operators you have learned into something genuinely useful.

## What you need to build

- Register a `GET /people/search/:term` route.
- Search both the `title` and `description` fields for the term.
- Make the search **case-insensitive** and match partial words.

## The data you are filtering

```js
{ name: 'Ada',   title: 'Learning Express APIs',  description: 'Build routes with Express and MongoDB' }
{ name: 'Grace', title: 'Express Routing Guide',  description: 'Learn route parameters and query strings' }
{ name: 'Linus', title: 'Systems Notes',          description: 'Operating systems and server tools' }
{ name: 'Maya',  title: 'MongoDB Search Basics',  description: 'Filter documents with find and regex' }
```

Searching `express` should return **Ada** and **Grace**.

## Concept: `$regex` with `$or`

`$regex` matches a field against a text pattern — a partial, optionally case-insensitive match. Combine it with `$or` to search several fields with one term.

Predict each result against the sample titles and descriptions:

```js
{ title: { $regex: 'express', $options: 'i' } }       // titles containing "express"
{ description: { $regex: 'mongodb', $options: 'i' } }  // descriptions containing "mongodb"
{ $or: [                                               // either field
  { title: { $regex: 'search', $options: 'i' } },
  { description: { $regex: 'search', $options: 'i' } },
] }
```

`$options: 'i'` is what makes `express` also match `Express`.

## Write it in the editor

Type the full route into the `app.js` editor on the **left** — that is where your code runs:

```js
app.get('/people/search/:term', async (req, res) => {
  const filter = {
    $or: [
      { title: { $regex: req.params.term, $options: 'i' } },
      { description: { $regex: req.params.term, $options: 'i' } },
    ],
  };
  const results = await db.collection('people').find(filter).toArray();
  res.json(results);
});
```

- `$regex` matches when the field contains the term anywhere.
- `$options: 'i'` makes it case-insensitive.
- The two `$or` branches search `title` and `description`.

Click **Run tests**, then search freely in the **Try** tab.

## Try it

`GET /people/search/express`

You should see **Ada** and **Grace** — Ada has "Express" in her title, and Grace has "Express" in both title and description. The case-insensitive `$regex` matches partial words, so "express" finds "Express" and "APIs" would match "Learning Express APIs". Try `GET /people/search/mongo` to find Ada and Maya.

## Summary

Practical search is just operators combined well: `$regex` for flexible text and `$or` to span fields — no dedicated search engine needed. You now have every building block to compose your own queries.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/people/search/:term', async (req, res) => {
  // TODO: search title and description for the requested term
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

app.get('/people/search/:term', async (req, res) => {
  const results = await db.collection('people').find({
    $or: [
      { title: { $regex: req.params.term, $options: 'i' } },
      { description: { $regex: req.params.term, $options: 'i' } },
    ],
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

describe('GET /people/search/:term', () => {
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
    const res = await request(app).get('/people/search/express');
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

A search route often combines `$or` and `$regex` so one term can search multiple fields.
