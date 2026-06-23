# Problem

Now for the **C** in CRUD: creating new books. This lesson covers reading a JSON request body with `req.body` and inserting it with `insertOne`, then returning the new document's id.

## What you need to build

- Register a `POST /api/books` route.
- Read the new book from `req.body`.
- Insert it into the `books` collection.
- Respond with a message and the new book's id.

## The data the client sends

A `POST` request carries the new book in its **JSON body**:

```js
{
    "title": "Refactoring",
    "author": "Martin Fowler",
    "genre": "Tech",
    "year": 1999,
    "copies": 5,
    "tags": ["software", "design"]
}
```

## Concept: `req.body` needs `express.json()`

Express does not parse request bodies by default. The boilerplate line `app.use(express.json())` is what fills in `req.body`:

```js
app.use(express.json());   // without this, req.body is undefined on POST/PUT
```

## Concept: inserting a document

`insertOne` adds one document and reports back what it did:

```js
const result = await db.collection("books").insertOne(newBook);
result.insertedId;     // the _id MongoDB generated for the new document
```

- `insertOne(doc)` writes the document and auto-generates an `_id`.
- The returned `result.insertedId` is that new `_id` — send it back so the client knows where the new resource lives.

## Write it in the editor

Type your answer into the `app.js` editor on the **left**. Replace the `// TODO`:

```js
app.post("/api/books", async function (req, res) {
    // the new book arrives in the request body
    const newBook = req.body;

    // insert it and capture the generated id
    const result = await db.collection("books").insertOne(newBook);

    res.json({
        message: "Successfully created book",
        bookId: result.insertedId
    });
});
```

- `req.body` is the parsed JSON the client sent (available because of `express.json()`).
- `insertOne(newBook)` stores it and generates an `_id`.
- `result.insertedId` is returned so the caller can reference the new book later.

Click **Run tests**, then try the request in the **Try** tab.

## Try it

`POST /api/books` with a JSON body like the Refactoring example above.

You should get `{ "message": "Successfully created book", "bookId": "..." }`. The `bookId` is the freshly generated `_id`. If you then run `GET /api/books`, the new book appears in the list — proof the insert persisted.

## Summary

Creating a document is `insertOne(req.body)`. The two prerequisites are `express.json()` (so `req.body` is populated) and returning `result.insertedId` (so the client can locate the new resource). MongoDB generates the `_id` for you, which is why you never set it yourself on insert.

# Starter

```js
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.post("/api/books", async function (req, res) {
    // TODO: insert req.body into books and return the new id
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

app.post("/api/books", async function (req, res) {
    const newBook = req.body;

    const result = await db.collection("books").insertOne(newBook);

    res.json({
        message: "Successfully created book",
        bookId: result.insertedId
    });
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient, ObjectId } = require('mongodb');
const app = require('./app');

describe('POST /api/books', () => {
  let client;
  let db;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db();
    await db.collection('books').deleteMany({});
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('inserts a new book and returns its id', async () => {
    const res = await request(app)
      .post('/api/books')
      .send({
        title: 'Refactoring',
        author: 'Martin Fowler',
        genre: 'Tech',
        year: 1999,
        copies: 5,
        tags: ['software', 'design']
      });

    expect(res.status).toBe(200);
    expect(res.body.bookId).toBeDefined();

    const saved = await db.collection('books').findOne({
      _id: new ObjectId(res.body.bookId)
    });
    expect(saved).not.toBeNull();
    expect(saved.title).toBe('Refactoring');
    expect(saved.author).toBe('Martin Fowler');
    expect(saved.tags).toEqual(['software', 'design']);
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

`insertOne(req.body)` writes the posted JSON straight into the collection. It works only because `app.use(express.json())` parsed the body into `req.body` first — without it you would insert `undefined`. The returned `result.insertedId` is the `_id` MongoDB generated, and echoing it back lets the client immediately read, update, or delete the new book.
