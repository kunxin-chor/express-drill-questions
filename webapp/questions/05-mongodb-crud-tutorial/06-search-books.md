# Problem

The final step: turn the plain list endpoint into a **search** endpoint. This lesson builds a filter object from optional query-string parameters, using `$regex` for partial text matches and `$in` for matching any of several tags — the real-world pattern for a "search" API.

## What you need to build

- Upgrade `GET /api/books` to read **optional** query parameters.
- Support these parameters, all optional and combinable:
  - `title` — partial, case-insensitive match on the book title.
  - `genre` — partial, case-insensitive match on the genre.
  - `tags` — a comma-delimited list; match books that have **any** of these tags.
- Return the matches as `{ books: [...] }`.

## The data you are working with

The same `books` collection:

```js
{ title: "Clean Code",               author: "Robert Martin",  genre: "Tech",    year: 2008, copies: 4, tags: ["software", "craft"] }
{ title: "The Pragmatic Programmer", author: "Hunt & Thomas",  genre: "Tech",    year: 1999, copies: 2, tags: ["software", "career"] }
{ title: "Dune",                     author: "Frank Herbert",  genre: "SciFi",   year: 1965, copies: 7, tags: ["classic", "epic"] }
{ title: "The Hobbit",               author: "J.R.R. Tolkien", genre: "Fantasy", year: 1937, copies: 3, tags: ["classic", "adventure"] }
```

## Concept: build the filter conditionally

Start with an empty filter and add a condition **only when** the matching query parameter was sent. That way one endpoint serves every combination:

```js
const criteria = {};

if (req.query.title) {
    criteria.title = { $regex: req.query.title, $options: "i" };
}
```

- `criteria = {}` with no conditions matches every book (same as the list endpoint).
- Each `if` adds one condition, so `?title=clean&genre=tech` ANDs the two together.

## Concept: `$regex` for text, `$in` for lists

Predict what each condition matches against the sample data:

```js
{ title: { $regex: "code", $options: "i" } }   // titles containing "code" -> Clean Code
{ genre: { $regex: "tech", $options: "i" } }   // genres containing "tech" -> Clean Code, Pragmatic
{ tags:  { $in: ["classic", "epic"] } }        // any of these tags -> Dune, The Hobbit
```

- `$regex` with `$options: "i"` is a case-insensitive partial match — `"code"` finds `"Clean Code"`.
- `$in: [...]` matches when the `tags` array contains **any** listed value.
- `"classic,epic".split(",")` turns the comma-delimited query string into the array `$in` needs.

## Write it in the editor

Type your answer into the `app.js` editor on the **left**. Replace the `// TODO`:

```js
app.get("/api/books", async function (req, res) {
    // build up the search criteria from whatever query params were sent
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
        // "classic,epic".split(",") = ["classic", "epic"]
        const wantedTags = req.query.tags.split(",");
        criteria.tags = {
            $in: wantedTags
        };
    }

    const books = await db.collection("books").find(criteria).toArray();
    res.json({
        books: books
    });
});
```

- `criteria` starts empty, so a request with no query returns every book.
- Each `if` only runs when that parameter is present, keeping the endpoint flexible.
- `req.query.tags.split(",")` converts the string into an array for `$in`.
- All present conditions live in one object, so they are combined with AND.

Click **Run tests**, then try the request in the **Try** tab.

## Try it

`GET /api/books?genre=tech`

You should get **Clean Code** and **The Pragmatic Programmer** — both have a genre containing "tech" (case-insensitive). Try `GET /api/books?tags=classic` to get Dune and The Hobbit, or combine them: `GET /api/books?genre=tech&title=clean` narrows to just Clean Code.

## Summary

A search endpoint is just a `find` with a filter you assemble from the request. Begin with an empty `criteria` object, add a condition per query parameter, and reach for `$regex` (flexible text) and `$in` (match any of a list). Because every condition shares one object, they combine with AND — giving a single endpoint that handles no filters, one filter, or many at once.

# Starter

```js
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get("/api/books", async function (req, res) {
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

app.get("/api/books", async function (req, res) {
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
        const wantedTags = req.query.tags.split(",");
        criteria.tags = {
            $in: wantedTags
        };
    }

    const books = await db.collection("books").find(criteria).toArray();
    res.json({
        books: books
    });
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./app');

describe('GET /api/books (search)', () => {
  let client;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    await db.collection('books').deleteMany({});
    await db.collection('books').insertMany([
      { title: "Clean Code",               author: "Robert Martin",  genre: "Tech",    year: 2008, copies: 4, tags: ["software", "craft"] },
      { title: "The Pragmatic Programmer", author: "Hunt & Thomas",  genre: "Tech",    year: 1999, copies: 2, tags: ["software", "career"] },
      { title: "Dune",                     author: "Frank Herbert",  genre: "SciFi",   year: 1965, copies: 7, tags: ["classic", "epic"] },
      { title: "The Hobbit",               author: "J.R.R. Tolkien", genre: "Fantasy", year: 1937, copies: 3, tags: ["classic", "adventure"] }
    ]);
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('returns all books when no query is given', async () => {
    const res = await request(app).get('/api/books');
    expect(res.status).toBe(200);
    expect(res.body.books).toHaveLength(4);
  });

  test('filters by partial, case-insensitive title', async () => {
    const res = await request(app).get('/api/books?title=code');
    expect(res.status).toBe(200);
    expect(res.body.books).toHaveLength(1);
    expect(res.body.books[0].title).toBe('Clean Code');
  });

  test('filters by genre with $regex', async () => {
    const res = await request(app).get('/api/books?genre=tech');
    expect(res.status).toBe(200);
    expect(res.body.books.map((b) => b.title)).toEqual(
      expect.arrayContaining(['Clean Code', 'The Pragmatic Programmer'])
    );
    expect(res.body.books).toHaveLength(2);
  });

  test('filters by any of several tags with $in', async () => {
    const res = await request(app).get('/api/books?tags=classic,epic');
    expect(res.status).toBe(200);
    expect(res.body.books.map((b) => b.title)).toEqual(
      expect.arrayContaining(['Dune', 'The Hobbit'])
    );
    expect(res.body.books).toHaveLength(2);
  });

  test('combines conditions with AND', async () => {
    const res = await request(app).get('/api/books?genre=tech&title=clean');
    expect(res.status).toBe(200);
    expect(res.body.books).toHaveLength(1);
    expect(res.body.books[0].title).toBe('Clean Code');
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
  await db.collection('books').deleteMany({});
  await db.collection('books').insertMany([
    { title: "Clean Code",               author: "Robert Martin",  genre: "Tech",    year: 2008, copies: 4, tags: ["software", "craft"] },
    { title: "The Pragmatic Programmer", author: "Hunt & Thomas",  genre: "Tech",    year: 1999, copies: 2, tags: ["software", "career"] },
    { title: "Dune",                     author: "Frank Herbert",  genre: "SciFi",   year: 1965, copies: 7, tags: ["classic", "epic"] },
    { title: "The Hobbit",               author: "J.R.R. Tolkien", genre: "Fantasy", year: 1937, copies: 3, tags: ["classic", "adventure"] }
  ]);
  await client.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

# Walkthrough

The route assembles a `criteria` object from the request. Each query parameter adds one condition: `$regex` with `$options: "i"` gives case-insensitive partial text matching for `title` and `genre`, while `tags.split(",")` feeds an array into `$in` so a book matches if it carries any of the requested tags. Because the conditions all live in one object, MongoDB ANDs them, and an empty `criteria` returns everything — so the same endpoint handles browse and search alike.
