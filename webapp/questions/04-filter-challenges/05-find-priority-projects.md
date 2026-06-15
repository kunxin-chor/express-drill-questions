# Problem

Combine **`$or`**, an **array value** match, and numerical **`$gte`**.

Register a `GET /projects/priority/:skill/:minScore` route that returns projects whose:

- `requiredSkills` array contains the `skill` route parameter
- `score` is greater than or equal to the `minScore` route parameter
- either `status` is `active` or `priority` is `high`

## Example data

The `projects` collection may contain documents like:

```js
{ name: 'API Upgrade', requiredSkills: ['node', 'mongodb'], score: 90, status: 'active', priority: 'normal' }
{ name: 'Legacy Fix', requiredSkills: ['node'], score: 85, status: 'paused', priority: 'high' }
```

## Try tab

After writing your route, try:

`GET /projects/priority/node/80`

## Hints

- Query `requiredSkills` directly to match one array value.
- Use `$gte` for the minimum score.
- Use `$or` for the status-or-priority condition.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/projects/priority/:skill/:minScore', async (req, res) => {
  // TODO: find priority projects requiring the skill and minimum score
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

app.get('/projects/priority/:skill/:minScore', async (req, res) => {
  const projects = await db.collection('projects').find({
    requiredSkills: req.params.skill,
    score: { $gte: Number(req.params.minScore) },
    $or: [{ status: 'active' }, { priority: 'high' }],
  }).toArray();

  res.json(projects);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./app');

describe('GET /projects/priority/:skill/:minScore', () => {
  let client;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    await db.collection('projects').deleteMany({});
    await db.collection('projects').insertMany([
      { name: 'API Upgrade', requiredSkills: ['node', 'mongodb'], score: 90, status: 'active', priority: 'normal' },
      { name: 'Legacy Fix', requiredSkills: ['node'], score: 85, status: 'paused', priority: 'high' },
      { name: 'CSS Refresh', requiredSkills: ['css'], score: 95, status: 'active', priority: 'high' },
      { name: 'Small Script', requiredSkills: ['node'], score: 60, status: 'active', priority: 'normal' },
    ]);
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('returns projects matching skill, score, and priority condition', async () => {
    const res = await request(app).get('/projects/priority/node/80');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'API Upgrade' }),
        expect.objectContaining({ name: 'Legacy Fix' }),
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
  await db.collection('projects').deleteMany({});
  await db.collection('projects').insertMany([
    { name: 'API Upgrade', requiredSkills: ['node', 'mongodb'], score: 90, status: 'active', priority: 'normal' },
    { name: 'Legacy Fix', requiredSkills: ['node'], score: 85, status: 'paused', priority: 'high' },
    { name: 'CSS Refresh', requiredSkills: ['css'], score: 95, status: 'active', priority: 'high' },
    { name: 'Small Script', requiredSkills: ['node'], score: 60, status: 'active', priority: 'normal' },
  ]);
  await client.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

# Walkthrough

This filter combines three conditions:

```js
{
  requiredSkills: req.params.skill,
  score: { $gte: Number(req.params.minScore) },
  $or: [{ status: 'active' }, { priority: 'high' }],
}
```
