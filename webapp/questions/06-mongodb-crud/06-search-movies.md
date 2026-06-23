# Problem

Turn the movie list endpoint into a search endpoint driven by query-string parameters.

The test runner has already started an in-memory MongoDB instance and made it
available through `process.env.MONGODB_URI`.

Using the **native MongoDB driver** (`mongodb`), register a `GET /api/movies`
route that builds a filter from these **optional** query parameters and returns
matches as `{ movies: [...] }`:

- `title` — partial, case-insensitive match on the movie title.
- `genre` — partial, case-insensitive match on the genre.
- `tags` — a comma-delimited list; match movies that have **any** of these tags.

With no query parameters, return every movie.

## Example data

```js
{ title: "Inception",     director: "Christopher Nolan", genre: "SciFi", year: 2010, tags: ["dream", "heist"] }
{ title: "The Matrix",    director: "The Wachowskis",    genre: "SciFi", year: 1999, tags: ["cyberpunk", "action"] }
{ title: "Spirited Away", director: "Hayao Miyazaki",    genre: "Anime", year: 2001, tags: ["fantasy", "classic"] }
{ title: "Parasite",      director: "Bong Joon-ho",      genre: "Drama", year: 2019, tags: ["thriller", "classic"] }
```

## Try tab

After writing your route, try:

`GET /api/movies?genre=sci`

Then combine: `GET /api/movies?tags=classic` or `GET /api/movies?title=the&genre=sci`.

## Hints

- Start with an empty `criteria = {}` so no query returns everything.
- Add a condition only inside `if (req.query.xxx) { ... }`.
- Use `{ $regex: value, $options: "i" }` for `title` and `genre`.
- Use `req.query.tags.split(",")` with `{ $in: [...] }` for tags.

# Starter

```js
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get("/api/movies", async function (req, res) {
    // TODO: build criteria from req.query (title, genre, tags) and return matches
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
    const criteria = {};

    if (req.query.title) {
        criteria.title = {
            $regex: req.query.title,
            $options: "i"
        };
    }

    if (req.query.genre) {
        criteria.genre = {
            $regex: req.query.genre,
            $options: "i"
        };
    }

    if (req.query.tags) {
        // "fantasy,classic".split(",") = ["fantasy", "classic"]
        const wantedTags = req.query.tags.split(",");
        criteria.tags = {
            $in: wantedTags
        };
    }

    const movies = await db.collection("movies").find(criteria).toArray();
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

describe('GET /api/movies (search)', () => {
  let client;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    await db.collection('movies').deleteMany({});
    await db.collection('movies').insertMany([
      { title: "Inception",    director: "Christopher Nolan", genre: "SciFi", year: 2010, rating: 8.8, tags: ["dream", "heist"] },
      { title: "The Matrix",   director: "The Wachowskis",    genre: "SciFi", year: 1999, rating: 8.7, tags: ["cyberpunk", "action"] },
      { title: "Spirited Away",director: "Hayao Miyazaki",    genre: "Anime", year: 2001, rating: 8.6, tags: ["fantasy", "classic"] },
      { title: "Parasite",     director: "Bong Joon-ho",      genre: "Drama", year: 2019, rating: 8.5, tags: ["thriller", "classic"] }
    ]);
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('returns all movies when no query is given', async () => {
    const res = await request(app).get('/api/movies');
    expect(res.status).toBe(200);
    expect(res.body.movies).toHaveLength(4);
  });

  test('filters by partial, case-insensitive title', async () => {
    const res = await request(app).get('/api/movies?title=matrix');
    expect(res.status).toBe(200);
    expect(res.body.movies).toHaveLength(1);
    expect(res.body.movies[0].title).toBe('The Matrix');
  });

  test('filters by genre with $regex', async () => {
    const res = await request(app).get('/api/movies?genre=sci');
    expect(res.status).toBe(200);
    expect(res.body.movies.map((m) => m.title)).toEqual(
      expect.arrayContaining(['Inception', 'The Matrix'])
    );
    expect(res.body.movies).toHaveLength(2);
  });

  test('filters by any of several tags with $in', async () => {
    const res = await request(app).get('/api/movies?tags=classic,heist');
    expect(res.status).toBe(200);
    expect(res.body.movies.map((m) => m.title)).toEqual(
      expect.arrayContaining(['Inception', 'Spirited Away', 'Parasite'])
    );
    expect(res.body.movies).toHaveLength(3);
  });

  test('combines conditions with AND', async () => {
    const res = await request(app).get('/api/movies?genre=sci&title=the');
    expect(res.status).toBe(200);
    expect(res.body.movies).toHaveLength(1);
    expect(res.body.movies[0].title).toBe('The Matrix');
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

Build a `criteria` object from the request: `$regex` with `$options: "i"` gives case-insensitive partial matches for `title` and `genre`, while `tags.split(",")` feeds an array into `$in` so a movie matches if it carries any requested tag. The conditions share one object, so MongoDB ANDs them, and an empty `criteria` returns everything.
