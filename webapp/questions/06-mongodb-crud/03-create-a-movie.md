# Problem

Insert a new movie sent in the request body.

The test runner has already started an in-memory MongoDB instance and made it
available through `process.env.MONGODB_URI`.

Using the **native MongoDB driver** (`mongodb`), register a `POST /api/movies`
route that reads the new movie from `req.body`, inserts it into the `movies`
collection, and responds with a message and the new movie's id.

## Example request body

```js
{
    "title": "Whiplash",
    "director": "Damien Chazelle",
    "genre": "Drama",
    "year": 2014,
    "rating": 8.5,
    "tags": ["music", "intense"]
}
```

## Try tab

After writing your route, send a `POST /api/movies` with a JSON body like the example above.

## Hints

- `req.body` is only populated because of `app.use(express.json())`.
- `db.collection("movies").insertOne(req.body)` stores the document.
- The returned `result.insertedId` is the new `_id` — send it back.

# Starter

```js
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.post("/api/movies", async function (req, res) {
    // TODO: insert req.body into movies and return the new id
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

app.post("/api/movies", async function (req, res) {
    const newMovie = req.body;

    const result = await db.collection("movies").insertOne(newMovie);

    res.json({
        message: "Successfully created movie",
        movieId: result.insertedId
    });
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient, ObjectId } = require('mongodb');
const app = require('./app');

describe('POST /api/movies', () => {
  let client;
  let db;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db();
    await db.collection('movies').deleteMany({});
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('inserts a new movie and returns its id', async () => {
    const res = await request(app)
      .post('/api/movies')
      .send({
        title: 'Whiplash',
        director: 'Damien Chazelle',
        genre: 'Drama',
        year: 2014,
        rating: 8.5,
        tags: ['music', 'intense']
      });

    expect(res.status).toBe(200);
    expect(res.body.movieId).toBeDefined();

    const saved = await db.collection('movies').findOne({
      _id: new ObjectId(res.body.movieId)
    });
    expect(saved).not.toBeNull();
    expect(saved.title).toBe('Whiplash');
    expect(saved.director).toBe('Damien Chazelle');
    expect(saved.tags).toEqual(['music', 'intense']);
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

`insertOne(req.body)` writes the posted JSON into the collection — it works only because `express.json()` parsed the body first. Echo back `result.insertedId` so the client can reference the new movie.
