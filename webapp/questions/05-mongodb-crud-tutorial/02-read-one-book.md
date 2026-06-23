# Problem

A list endpoint is not enough — clients also need to fetch **one** book by its id. This lesson covers `findOne`, converting a URL string into a real MongoDB `ObjectId`, and returning **404** when nothing matches.

## What you need to build

- Register a `GET /api/books/:bookId` route.
- Convert `req.params.bookId` into an `ObjectId`.
- Return the single matching book as JSON.
- If no book matches, respond with status **404**.

## The data you are working with

The same `books` collection. Each document also has an auto-generated `_id`:

```js
{ _id: ObjectId("..."), title: "Clean Code",               author: "Robert Martin", genre: "Tech",  year: 2008, /* ... */ }
{ _id: ObjectId("..."), title: "The Pragmatic Programmer", author: "Hunt & Thomas", genre: "Tech",  year: 1999, /* ... */ }
```

## Concept: `_id` is an ObjectId, not a string

MongoDB stores `_id` as a special 12-byte `ObjectId`, but a URL only carries text. Comparing a string to an ObjectId never matches, so you must convert first:

```js
db.collection("books").findOne({ _id: "65a1f..." });               // never matches (string vs ObjectId)
db.collection("books").findOne({ _id: new ObjectId("65a1f...") }); // correct
```

- `findOne(filter)` returns the **first** matching document, or `null` if there is none.
- `new ObjectId(text)` turns the URL string into the type stored in the database.

## Concept: handling "not found"

Because `findOne` returns `null` when nothing matches, you decide what to send back:

```js
if (book) {
    res.json(book);              // found it
} else {
    res.status(404).json({ message: "Book not found" });
}
```

## Write it in the editor

Type your answer into the `app.js` editor on the **left**. Replace the `// TODO`:

```js
app.get("/api/books/:bookId", async function (req, res) {
    // convert the id from the URL into an ObjectId, then look it up
    const book = await db.collection("books").findOne({
        _id: new ObjectId(req.params.bookId)
    });

    // findOne returns null when nothing matched
    if (book) {
        res.json(book);
    } else {
        res.status(404).json({
            message: "Book not found"
        });
    }
});
```

- `req.params.bookId` reads the `:bookId` segment from the URL.
- `new ObjectId(...)` converts that text into the type stored in `_id`.
- `findOne(...)` returns the document or `null`.
- The `if/else` returns the book, or a 404 when it is missing.

Click **Run tests**, then try the request in the **Try** tab.

## Try it

`GET /api/books/<paste an _id here>`

Using a real `_id` returns that single book object. Using an id that does not exist (but is still a valid 24-character hex string) returns status **404** with `{ "message": "Book not found" }`, because `findOne` returned `null`.

## Summary

Reading one document is `findOne(filter)`, and for id lookups the filter is `{ _id: new ObjectId(req.params.id) }`. The conversion step is essential: `_id` values are ObjectIds, and a raw string from the URL will never match one. Always check for `null` so missing records produce a clean 404 instead of leaking an empty body.

# Starter

```js
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get("/api/books/:bookId", async function (req, res) {
    // TODO: look up one book by its _id, or return 404 if not found
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

app.get("/api/books/:bookId", async function (req, res) {
    const book = await db.collection("books").findOne({
        _id: new ObjectId(req.params.bookId)
    });

    if (book) {
        res.json(book);
    } else {
        res.status(404).json({
            message: "Book not found"
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

describe('GET /api/books/:bookId', () => {
  let client;
  let db;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db();
    await db.collection('books').deleteMany({});
    await db.collection('books').insertMany([
      { title: "Clean Code", author: "Robert Martin", genre: "Tech", year: 2008, copies: 4, tags: ["software", "craft"] },
      { title: "Dune", author: "Frank Herbert", genre: "SciFi", year: 1965, copies: 7, tags: ["classic", "epic"] }
    ]);
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('returns the matching book by id', async () => {
    const target = await db.collection('books').findOne({ title: 'Dune' });
    const res = await request(app).get(`/api/books/${target._id.toString()}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Dune');
    expect(res.body.author).toBe('Frank Herbert');
  });

  test('returns 404 when the book does not exist', async () => {
    const missingId = new ObjectId().toString();
    const res = await request(app).get(`/api/books/${missingId}`);
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

The filter `{ _id: new ObjectId(req.params.bookId) }` is the heart of this route. The URL gives you a string, but `_id` is an ObjectId, so `new ObjectId(...)` bridges the two types. `findOne` returns either the document or `null`, and the `if/else` turns `null` into a 404 response so callers can distinguish "missing" from "found".
