# Problem

This series builds a complete **CRUD API** for a `books` collection — Create, Read, Update, Delete. We start with the **R**: reading every book out of the database and returning it as JSON.

## What you need to build

- Register a `GET /api/books` route.
- Read **all** documents from the `books` collection.
- Return them as JSON in the shape `{ books: [...] }`.

## The data you are working with

Every lesson in this series uses the same `books` collection:

```js
{ title: "Clean Code",               author: "Robert Martin",  genre: "Tech",    year: 2008, copies: 4, tags: ["software", "craft"] }
{ title: "The Pragmatic Programmer", author: "Hunt & Thomas",  genre: "Tech",    year: 1999, copies: 2, tags: ["software", "career"] }
{ title: "Dune",                     author: "Frank Herbert",  genre: "SciFi",   year: 1965, copies: 7, tags: ["classic", "epic"] }
{ title: "The Hobbit",               author: "J.R.R. Tolkien", genre: "Fantasy", year: 1937, copies: 3, tags: ["classic", "adventure"] }
```

## Concept: the boilerplate every CRUD route shares

Before any route, every file in this series sets up Express and a database handle:

```js
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());                              // parse JSON request bodies

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();                               // your database handle
```

- `app.use(express.json())` lets later routes read `req.body` — without it, `req.body` is `undefined` on POST/PUT.
- `db.collection("books")` is how you reach the collection from any route.

## Concept: reading every document

Reading "all" documents is `find` with an empty filter:

```js
db.collection("books").find({}).toArray();   // every book
```

- `find({})` builds a query that matches every document.
- `.toArray()` runs the query and collects the results into an array.

## Write it in the editor

The left panel is the `app.js` editor, and **that is where you type your answer** (not in this tab). Replace the `// TODO` inside the route with:

```js
app.get("/api/books", async function (req, res) {
    // find every document in the books collection
    const books = await db.collection("books").find({}).toArray();

    // send them back wrapped in an object
    res.json({
        books: books
    });
});
```

- `find({})` selects every book; the empty object means "no filter".
- `await ... .toArray()` waits for the database and turns the cursor into a plain array.
- `res.json({ books })` returns the array nested under a `books` key, which is the response shape the rest of this series expects.

Click **Run tests**, then try the request in the **Try** tab.

## Try it

`GET /api/books`

You should get back `{ "books": [ ... ] }` containing **all four** books (Clean Code, The Pragmatic Programmer, Dune, The Hobbit), because the empty filter matches every document.

## Summary

The "Read many" operation is `find(filter).toArray()`. An empty filter returns everything; in a later lesson you will put query conditions inside that filter to search. Wrapping the array in `{ books: [...] }` gives the API a predictable JSON shape for clients to consume.

# Starter

```js
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.get("/api/books", async function (req, res) {
    // TODO: find every book and return it as { books: [...] }
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
    const books = await db.collection("books").find({}).toArray();
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

const SAMPLE = [
  { title: "Clean Code",               author: "Robert Martin",  genre: "Tech",    year: 2008, copies: 4, tags: ["software", "craft"] },
  { title: "The Pragmatic Programmer", author: "Hunt & Thomas",  genre: "Tech",    year: 1999, copies: 2, tags: ["software", "career"] },
  { title: "Dune",                     author: "Frank Herbert",  genre: "SciFi",   year: 1965, copies: 7, tags: ["classic", "epic"] },
  { title: "The Hobbit",               author: "J.R.R. Tolkien", genre: "Fantasy", year: 1937, copies: 3, tags: ["classic", "adventure"] }
];

describe('GET /api/books', () => {
  let client;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    await db.collection('books').deleteMany({});
    await db.collection('books').insertMany(SAMPLE.map((b) => ({ ...b })));
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('returns all books wrapped in { books }', async () => {
    const res = await request(app).get('/api/books');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.books)).toBe(true);
    expect(res.body.books).toHaveLength(4);
    expect(res.body.books.map((b) => b.title)).toEqual(
      expect.arrayContaining(['Clean Code', 'The Pragmatic Programmer', 'Dune', 'The Hobbit'])
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

`find({})` returns a cursor over every document, and `.toArray()` drains it into an array you can send as JSON. The empty filter `{}` is the key detail — it imposes no conditions, so every book is returned. Wrapping the result in `{ books: [...] }` keeps the response shape consistent across the whole API.
