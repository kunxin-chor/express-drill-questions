# Problem

Your goal is to read **every document** from a MongoDB collection and return it from an Express route. This is the starting point for all filtering: before you can narrow results, you need to fetch them.

## What you need to build

- Register a `GET /people` route.
- Read all documents from the `people` collection.
- Send them back to the client as a JSON array.

## The data you are filtering

Every tutorial in this section uses the same seeded `people` collection:

```js
{ name: 'Ada',   role: 'admin',   age: 28, address: { city: 'London' } }
{ name: 'Grace', role: 'student', age: 34, address: { city: 'New York' } }
{ name: 'Linus', role: 'admin',   age: 42, address: { city: 'Helsinki' } }
{ name: 'Maya',  role: 'student', age: 24, address: { city: 'London' } }
```

## Concept: the filter object

In MongoDB you read documents with `.find()`. The object you pass to `.find()` is the **filter** — it describes which documents come back. The filter for "everything" is the empty object `{}`.

Read these three queries and predict the result of each before moving on:

```js
db.collection('people').find({})                 // every document
db.collection('people').find({ role: 'admin' })  // only admins
db.collection('people').find({ age: 24 })         // only people aged 24
```

Notice that only the object inside `.find(...)` changes. The empty `{}` is special because it sets no conditions, so nothing is filtered out.

## Write it in the editor

The panel on the **left is a real code editor** holding a starter `app.js`. **This is where you type your answer** — the code blocks in this tab are examples, not something you can run here. Replace the `// TODO` line inside the route with the code below, then click **Run tests** at the top of the editor.

```js
app.get('/people', async (req, res) => {
  const people = await db.collection('people').find({}).toArray();
  res.json(people);
});
```

- `db.collection('people')` selects the collection to read from.
- `.find({})` builds the query; the empty filter matches every document.
- `.toArray()` runs it and turns the *cursor* (a streaming pointer) into a plain array.
- `await` waits for the database, because the call is asynchronous.
- `res.json(people)` sends the array back as JSON.

## Try it

Open the **Try** tab and send:

`GET /people`

You should see a JSON array containing all four people (Ada, Grace, Linus, Maya), because the empty filter `{}` matches every document.

## Summary

A MongoDB query is just a filter object handed to `.find()`. The filter answers "which documents?", and `{}` answers "all of them". Every later lesson changes only what goes **inside** that object — the surrounding `.find(...).toArray()` pattern stays the same.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/people', async (req, res) => {
  // TODO: get every document from the 'people' collection
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
  const people = await db.collection('people').find({}).toArray();
  res.json(people);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./app');

describe('GET /people', () => {
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
    const res = await request(app).get('/people');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(4);
    expect(res.body).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'Ada' }),
        expect.objectContaining({ name: 'Grace' }),
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

The route uses `.find({})` because an empty filter does not exclude any documents.
