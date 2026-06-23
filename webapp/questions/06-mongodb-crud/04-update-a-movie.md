# Problem

Update an existing movie by its `_id`.

The test runner has already started an in-memory MongoDB instance and made it
available through `process.env.MONGODB_URI`.

Using the **native MongoDB driver** (`mongodb`), register a `PUT /api/movies/:movieId`
route that matches a movie by its `_id` and overwrites its fields with the data
in `req.body`, then responds with a success message.

## Example request body

```js
{
    "title": "Inception",
    "director": "Christopher Nolan",
    "genre": "SciFi",
    "year": 2010,
    "rating": 9.0,
    "tags": ["dream", "heist", "classic"]
}
```

## Try tab

After writing your route, send a `PUT /api/movies/<an existing _id>` with a JSON body like the example above.

## Hints

- Match the document with `{ _id: new ObjectId(req.params.movieId) }`.
- `updateOne(filter, { $set: req.body })` overwrites the listed fields.
- The `$set` operator is required — a bare object is rejected by MongoDB.

# Starter

```js
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.put("/api/movies/:movieId", async function (req, res) {
    // TODO: update the movie with the given id using $set
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

app.put("/api/movies/:movieId", async function (req, res) {
    const newMovie = req.body;

    await db.collection("movies").updateOne({
        _id: new ObjectId(req.params.movieId)
    }, {
        $set: newMovie
    });

    res.json({
        message: "Successfully updated movie"
    });
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient, ObjectId } = require('mongodb');
const app = require('./app');

describe('PUT /api/movies/:movieId', () => {
  let client;
  let db;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db();
    await db.collection('movies').deleteMany({});
    await db.collection('movies').insertMany([
      { title: "Inception", director: "Christopher Nolan", genre: "SciFi", year: 2010, rating: 8.8, tags: ["dream", "heist"] }
    ]);
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('updates the matching movie', async () => {
    const target = await db.collection('movies').findOne({ title: 'Inception' });

    const res = await request(app)
      .put(`/api/movies/${target._id.toString()}`)
      .send({
        title: 'Inception',
        director: 'Christopher Nolan',
        genre: 'SciFi',
        year: 2010,
        rating: 9.0,
        tags: ['dream', 'heist', 'classic']
      });

    expect(res.status).toBe(200);

    const updated = await db.collection('movies').findOne({ _id: target._id });
    expect(updated.rating).toBe(9.0);
    expect(updated.tags).toContain('classic');
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

`updateOne(filter, { $set: newMovie })` finds the movie by `_id` and overwrites the fields you sent. `$set` is mandatory: MongoDB needs an operator to know how to apply the change.
