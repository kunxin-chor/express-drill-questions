# Problem

Return every movie in the `movies` collection.

The test runner has already started an in-memory MongoDB instance and made it
available through `process.env.MONGODB_URI`.

Using the **native MongoDB driver** (`mongodb`), register a `GET /api/movies`
route that reads all documents from the `movies` collection and returns them as
JSON in the shape `{ movies: [...] }`.

## Example data

The `movies` collection may contain documents like:

```js
{ title: "Inception",     director: "Christopher Nolan", genre: "SciFi", year: 2010, rating: 8.8, tags: ["dream", "heist"] }
{ title: "The Matrix",    director: "The Wachowskis",    genre: "SciFi", year: 1999, rating: 8.7, tags: ["cyberpunk", "action"] }
```

## Try tab

After writing your route, try:

`GET /api/movies`

## Hints

- `db.collection("movies")` gives you the collection handle.
- `.find({}).toArray()` returns every document as an array.
- Wrap the array under a `movies` key: `res.json({ movies: ... })`.

# Starter

```js
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get("/api/movies", async function (req, res) {
    // TODO: return every movie as { movies: [...] }
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

app.get("/api/movies", async function (req, res) {
    const movies = await db.collection("movies").find({}).toArray();
    res.json({
        movies: movies
    });
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./app');

const SAMPLE = [
  { title: "Inception",    director: "Christopher Nolan", genre: "SciFi", year: 2010, rating: 8.8, tags: ["dream", "heist"] },
  { title: "The Matrix",   director: "The Wachowskis",    genre: "SciFi", year: 1999, rating: 8.7, tags: ["cyberpunk", "action"] },
  { title: "Spirited Away",director: "Hayao Miyazaki",    genre: "Anime", year: 2001, rating: 8.6, tags: ["fantasy", "classic"] },
  { title: "Parasite",     director: "Bong Joon-ho",      genre: "Drama", year: 2019, rating: 8.5, tags: ["thriller", "classic"] }
];

describe('GET /api/movies', () => {
  let client;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    await db.collection('movies').deleteMany({});
    await db.collection('movies').insertMany(SAMPLE.map((m) => ({ ...m })));
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('responds with status 200', async () => {
    const res = await request(app).get('/api/movies');
    expect(res.status).toBe(200);
  });

  test('returns all movies wrapped in { movies }', async () => {
    const res = await request(app).get('/api/movies');
    expect(Array.isArray(res.body.movies)).toBe(true);
    expect(res.body.movies).toHaveLength(4);
    expect(res.body.movies.map((m) => m.title)).toEqual(
      expect.arrayContaining(['Inception', 'The Matrix', 'Spirited Away', 'Parasite'])
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

`find({})` matches every document; `.toArray()` collects the cursor into an array. Wrap it as `{ movies: [...] }` to keep a consistent response shape across the API.
