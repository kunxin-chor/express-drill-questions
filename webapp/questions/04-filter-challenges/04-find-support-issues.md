# Problem

Combine **`$or`**, **`$regex`**, and a nested object filter.

Register a `GET /issues/search/:term/:team` route that returns issues whose:

- nested `owner.team` matches the `team` route parameter
- either `title` or `description` matches the `term` route parameter using a case-insensitive regex

## Example data

The `issues` collection may contain documents like:

```js
{ title: 'Login fails', description: 'Password reset broken', owner: { team: 'support' } }
{ title: 'Billing typo', description: 'Invoice copy issue', owner: { team: 'support' } }
```

## Try tab

After writing your route, try:

`GET /issues/search/login/support`

## Hints

- Use `$or` with two branches.
- Each branch can contain a `$regex` filter.
- Use dot notation for `owner.team`.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/issues/search/:term/:team', async (req, res) => {
  // TODO: find issues for the team where title or description matches the term
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

app.get('/issues/search/:term/:team', async (req, res) => {
  const issues = await db.collection('issues').find({
    'owner.team': req.params.team,
    $or: [
      { title: { $regex: req.params.term, $options: 'i' } },
      { description: { $regex: req.params.term, $options: 'i' } },
    ],
  }).toArray();

  res.json(issues);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./app');

describe('GET /issues/search/:term/:team', () => {
  let client;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    await db.collection('issues').deleteMany({});
    await db.collection('issues').insertMany([
      { title: 'Login fails', description: 'Password reset broken', owner: { team: 'support' } },
      { title: 'Billing typo', description: 'Invoice copy issue', owner: { team: 'support' } },
      { title: 'Login styling', description: 'Button spacing', owner: { team: 'design' } },
    ]);
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('returns team issues where title or description matches the term', async () => {
    const res = await request(app).get('/issues/search/login/support');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ title: 'Login fails' });
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
  await db.collection('issues').deleteMany({});
  await db.collection('issues').insertMany([
    { title: 'Login fails', description: 'Password reset broken', owner: { team: 'support' } },
    { title: 'Billing typo', description: 'Invoice copy issue', owner: { team: 'support' } },
    { title: 'Login styling', description: 'Button spacing', owner: { team: 'design' } },
  ]);
  await client.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

# Walkthrough

This route combines a required team match with an `$or` search:

```js
{
  'owner.team': req.params.team,
  $or: [
    { title: { $regex: req.params.term, $options: 'i' } },
    { description: { $regex: req.params.term, $options: 'i' } },
  ],
}
```
