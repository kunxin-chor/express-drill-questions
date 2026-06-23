# Problem

Fetch a single movie by its `_id`.

The test runner has already started an in-memory MongoDB instance and made it
available through `process.env.MONGODB_URI`.

Using the **native MongoDB driver** (`mongodb`), register a `GET /api/movies/:movieId`
route that looks up one document in the `movies` collection by its `_id` and
returns it as JSON. If no movie matches, respond with status **404**.

## Example data

```js
{ _id: ObjectId("..."), title: "Inception", director: "Christopher Nolan", genre: "SciFi", year: 2010, rating: 8.8 }
```

## Try tab

After writing your route, try:

`GET /api/movies/<paste a real _id>`

## Hints

- The URL gives you a string, but `_id` is an `ObjectId` — convert with `new ObjectId(req.params.movieId)`.
- `db.collection("movies").findOne(filter)` returns the document or `null`.
- Use an `if/else` to send the movie or a `404` JSON response.

# Starter

```js
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get("/api/movies/:movieId", async function (req, res) {
    // TODO: find one movie by _id, or return 404 if not found
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

app.get("/api/movies/:movieId", async function (req, res) {
    const movie = await db.collection("movies").findOne({
        _id: new ObjectId(req.params.movieId)
    });

    if (movie) {
        res.json(movie);
    } else {
        res.status(404).json({
            message: "Movie not found"
        });
    }
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient, ObjectId } = require('mongodb');
const app = require('./app');

describe('GET /api/movies/:movieId', () => {
  let client;
  let db;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db();
    await db.collection('movies').deleteMany({});
    await db.collection('movies').insertMany([
      { title: "Inception", director: "Christopher Nolan", genre: "SciFi", year: 2010, rating: 8.8, tags: ["dream", "heist"] },
      { title: "Parasite", director: "Bong Joon-ho", genre: "Drama", year: 2019, rating: 8.5, tags: ["thriller", "classic"] }
    ]);
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('returns the matching movie by id', async () => {
    const target = await db.collection('movies').findOne({ title: 'Parasite' });
    const res = await request(app).get(`/api/movies/${target._id.toString()}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Parasite');
    expect(res.body.director).toBe('Bong Joon-ho');
  });

  test('returns 404 when the movie does not exist', async () => {
    const missingId = new ObjectId().toString();
    const res = await request(app).get(`/api/movies/${missingId}`);
    expect(res.status).toBe(404);
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

Convert the URL string with `new ObjectId(...)` so it matches the `_id` type, then `findOne`. A `null` result means nothing matched, so return a 404 instead of an empty body.
