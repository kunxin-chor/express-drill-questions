# Problem

Find courses using `$in` against an array field.

The test runner has already started an in-memory MongoDB instance and made it
available through `process.env.MONGODB_URI`.

Using the **native MongoDB driver** (`mongodb`), register a `GET /courses/skills`
route that queries the `courses` collection and returns matching documents as a
**JSON array** via `res.json`.

## Example data

The `courses` collection may contain documents like:

```js
{ title: 'Full Stack', requiredSkills: ['javascript', 'mongodb'] }
{ title: 'Frontend', requiredSkills: ['javascript', 'css'] }
```

## Try tab

After writing your route, try:

`GET /courses/skills`

## Hints

- `db.collection('courses')` gives you the collection handle.
- `.find(filter).toArray()` returns all matching documents.
- `$in` matches if the array field contains at least one listed value.

# Starter

```js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get('/courses/skills', async (req, res) => {
  // TODO: query the 'courses' collection and return matching documents as JSON
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

app.get('/courses/skills', async (req, res) => {
  const results = await db.collection('courses').find({ requiredSkills: { $in: ['javascript', 'mongodb'] } }).toArray();
  res.json(results);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./app');

describe('GET /courses/skills', () => {
  let client;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    await db.collection('courses').deleteMany({});
    await db.collection('courses').insertMany([
      { title: 'Full Stack', requiredSkills: ['javascript', 'mongodb'] },
      { title: 'Frontend', requiredSkills: ['javascript', 'css'] },
      { title: 'Design', requiredSkills: ['figma'] },
    ]);
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('responds with status 200', async () => {
    const res = await request(app).get('/courses/skills');
    expect(res.status).toBe(200);
  });

  test('returns matching documents as JSON', async () => {
    const res = await request(app).get('/courses/skills');
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: 'Full Stack' })]),
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
  await db.collection('courses').deleteMany({});
  await db.collection('courses').insertMany([
      { title: 'Full Stack', requiredSkills: ['javascript', 'mongodb'] },
      { title: 'Frontend', requiredSkills: ['javascript', 'css'] },
      { title: 'Design', requiredSkills: ['figma'] },
  ]);
  await client.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

# Walkthrough

Build a MongoDB filter object, pass it to `.find(...)`, await `.toArray()`,
and send the resulting array with `res.json(...)`.
