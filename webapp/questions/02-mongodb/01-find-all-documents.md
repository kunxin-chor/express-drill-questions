# Problem

Your first MongoDB route.

The test runner has already started an in-memory MongoDB instance and made it
available through `process.env.MONGODB_URI`.

Using the **native MongoDB driver** (`mongodb`), register a `GET /users` route
that:

1. Reads **all documents** from the `users` collection.
2. Returns them as a **JSON array** via `res.json`.

The starter code sets up the database connection for you. You only need to
write the route handler.

## Hints

- `db.collection('users')` gives you a collection handle.
- `.find({})` creates a cursor for every document.
- `.toArray()` turns the cursor into an array you can send.
- `res.json(array)` serializes the array and sets `Content-Type: application/json`.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/users', async (req, res) => {
  // TODO: get all documents from the 'users' collection and return them as JSON
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

app.get('/users', async (req, res) => {
  const users = await db.collection('users').find({}).toArray();
  res.json(users);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./app');

describe('GET /users', () => {
  let client;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    await db.collection('users').deleteMany({});
    await db.collection('users').insertMany([
      { name: 'Ada', age: 28 },
      { name: 'Bob', age: 32 },
    ]);
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('responds with status 200', async () => {
    const res = await request(app).get('/users');
    expect(res.status).toBe(200);
  });

  test('returns all users as JSON', async () => {
    const res = await request(app).get('/users');
    expect(res.body).toHaveLength(2);
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Ada', age: 28 }),
        expect.objectContaining({ name: 'Bob', age: 32 }),
      ]),
    );
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
  await db.collection('users').deleteMany({});
  await db.collection('users').insertMany([
    { name: 'Ada', age: 28 },
    { name: 'Bob', age: 32 },
    { name: 'Charlie', age: 25 },
  ]);
  await client.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

# Walkthrough

## The MongoDB setup

The starter code handles the connection boilerplate:

```js
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();
```

`process.env.MONGODB_URI` is injected by the test runner. You don't need to
call `connect()` yourself — the driver queues operations until the connection
is ready.

## Querying a collection

To fetch every document from a collection:

```js
const users = await db.collection('users').find({}).toArray();
```

- `db.collection('users')` selects the collection.
- `.find({})` with an empty filter matches every document.
- `.toArray()` consumes the cursor and returns a plain array.

## Returning JSON

`res.json(users)` automatically:

- Sets status to `200`
- Sets `Content-Type: application/json`
- Serializes the array in the response body

## Common mistakes

- Forgetting `await` before `db.collection(...).find(...).toArray()` — the
  expression returns a `Promise`, not the data.
- Calling `.find()` without `.toArray()` — `find()` returns a cursor, not an
  array.
- Using `res.send(users)` instead of `res.json(users)` — `send` works, but
  `res.json` is the idiomatic choice for JSON APIs.
