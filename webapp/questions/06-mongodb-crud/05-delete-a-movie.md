# Problem

Delete a movie by its `_id`.

The test runner has already started an in-memory MongoDB instance and made it
available through `process.env.MONGODB_URI`.

Using the **native MongoDB driver** (`mongodb`), register a `DELETE /api/movies/:movieId`
route that removes the single document whose `_id` matches the id in the URL,
then responds with a success message.

## Example data

```js
{ _id: ObjectId("..."), title: "The Matrix", director: "The Wachowskis", genre: "SciFi", year: 1999 }
```

## Try tab

After writing your route, try:

`DELETE /api/movies/<an existing _id>`

## Hints

- Match the document with `{ _id: new ObjectId(req.params.movieId) }`.
- `deleteOne(filter)` removes at most one document.
- Use `deleteOne` (not `deleteMany`) so only the targeted movie is removed.

# Starter

```js
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.delete("/api/movies/:movieId", async function (req, res) {
    // TODO: delete the movie with the given id
});

module.exports = app;
```

# Solution

```js
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.delete("/api/movies/:movieId", async function (req, res) {
    await db.collection("movies").deleteOne({
        _id: new ObjectId(req.params.movieId)
    });

    res.json({
        message: "The movie has been deleted"
    });
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient, ObjectId } = require('mongodb');
const app = require('./app');

describe('DELETE /api/movies/:movieId', () => {
  let client;
  let db;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db();
  });

  beforeEach(async () => {
    await db.collection('movies').deleteMany({});
    await db.collection('movies').insertMany([
      { title: "Inception", director: "Christopher Nolan", genre: "SciFi", year: 2010, rating: 8.8, tags: ["dream", "heist"] },
      { title: "The Matrix", director: "The Wachowskis", genre: "SciFi", year: 1999, rating: 8.7, tags: ["cyberpunk", "action"] }
    ]);
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('removes the matching movie', async () => {
    const target = await db.collection('movies').findOne({ title: 'The Matrix' });

    const res = await request(app).delete(`/api/movies/${target._id.toString()}`);
    expect(res.status).toBe(200);

    const stillThere = await db.collection('movies').findOne({ _id: target._id });
    expect(stillThere).toBeNull();

    const remaining = await db.collection('movies').countDocuments({});
    expect(remaining).toBe(1);
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
  await db.collection('movies').deleteMany({});
  await db.collection('movies').insertMany([
    { title: "Inception",    director: "Christopher Nolan", genre: "SciFi", year: 2010, rating: 8.8, tags: ["dream", "heist"] },
    { title: "The Matrix",   director: "The Wachowskis",    genre: "SciFi", year: 1999, rating: 8.7, tags: ["cyberpunk", "action"] },
    { title: "Spirited Away",director: "Hayao Miyazaki",    genre: "Anime", year: 2001, rating: 8.6, tags: ["fantasy", "classic"] },
    { title: "Parasite",     director: "Bong Joon-ho",      genre: "Drama", year: 2019, rating: 8.5, tags: ["thriller", "classic"] }
  ]);
  await client.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

# Walkthrough

`deleteOne({ _id: new ObjectId(req.params.movieId) })` removes exactly the movie named in the URL. Because `_id` is unique, `deleteOne` targets a single record with no risk of removing extras.
