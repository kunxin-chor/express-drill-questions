# Problem

The **U** in CRUD: updating an existing book. This lesson covers matching a document by id and changing its fields with `updateOne` and the `$set` operator.

## What you need to build

- Register a `PUT /api/books/:bookId` route.
- Match the book by its `_id`.
- Overwrite its fields with the data in `req.body`.
- Respond with a success message.

## The data the client sends

A `PUT` request carries the updated book in its JSON body — the same shape as create:

```js
{
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "genre": "Tech",
    "year": 2008,
    "copies": 6,
    "tags": ["software", "craft", "classic"]
}
```

## Concept: `updateOne` needs two arguments

`updateOne` takes a **filter** (which document) and an **update** (what to change):

```js
db.collection("books").updateOne(
    { _id: new ObjectId(req.params.bookId) },   // 1. which document
    { $set: newBook }                           // 2. what to change
);
```

- The first argument finds the document, exactly like `findOne`.
- The second argument uses `$set` to overwrite only the listed fields, leaving everything else untouched.

## Concept: why `$set` and not just the object

Predict the difference between these two updates:

```js
updateOne(filter, { $set: { copies: 6 } });   // changes copies, keeps the rest
updateOne(filter, { copies: 6 });              // ERROR: updates need an operator like $set
```

The raw object form is invalid — MongoDB requires an update **operator**. `$set` is the one you reach for to assign field values.

## Write it in the editor

Type your answer into the `app.js` editor on the **left**. Replace the `// TODO`:

```js
app.put("/api/books/:bookId", async function (req, res) {
    // the updated book arrives in the request body
    const newBook = req.body;

    // match by id, then overwrite the fields with $set
    await db.collection("books").updateOne({
        _id: new ObjectId(req.params.bookId)
    }, {
        $set: newBook
    });

    res.json({
        message: "Successfully updated book"
    });
});
```

- `new ObjectId(req.params.bookId)` selects the document to change.
- `{ $set: newBook }` overwrites each field present in the body.
- `await` waits for the write to finish before responding.

Click **Run tests**, then try the request in the **Try** tab.

## Try it

`PUT /api/books/<an existing _id>` with the modified JSON body above.

You should get `{ "message": "Successfully updated book" }`. Fetching that book with `GET /api/books/<id>` afterwards shows the new `copies`, `author`, and `tags` — `$set` replaced those fields while keeping the same `_id`.

## Summary

Updating a document is `updateOne(filter, { $set: data })`. The filter picks the target by `_id`, and `$set` assigns the new field values. The `$set` operator is mandatory — passing a bare object is a common beginner error that MongoDB rejects.

# Starter

```js
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.put("/api/books/:bookId", async function (req, res) {
    // TODO: update the book with the given id using $set
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

app.put("/api/books/:bookId", async function (req, res) {
    const newBook = req.body;

    await db.collection("books").updateOne({
        _id: new ObjectId(req.params.bookId)
    }, {
        $set: newBook
    });

    res.json({
        message: "Successfully updated book"
    });
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient, ObjectId } = require('mongodb');
const app = require('./app');

describe('PUT /api/books/:bookId', () => {
  let client;
  let db;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db();
    await db.collection('books').deleteMany({});
    await db.collection('books').insertMany([
      { title: "Clean Code", author: "Robert Martin", genre: "Tech", year: 2008, copies: 4, tags: ["software", "craft"] }
    ]);
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  test('updates the matching book', async () => {
    const target = await db.collection('books').findOne({ title: 'Clean Code' });

    const res = await request(app)
      .put(`/api/books/${target._id.toString()}`)
      .send({
        title: 'Clean Code',
        author: 'Robert C. Martin',
        genre: 'Tech',
        year: 2008,
        copies: 6,
        tags: ['software', 'craft', 'classic']
      });

    expect(res.status).toBe(200);

    const updated = await db.collection('books').findOne({ _id: target._id });
    expect(updated.copies).toBe(6);
    expect(updated.author).toBe('Robert C. Martin');
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

`updateOne` takes two arguments: a filter to find the document and an update describing the change. The filter `{ _id: new ObjectId(req.params.bookId) }` targets one book, and `{ $set: newBook }` overwrites the fields you sent. The `$set` operator is required — MongoDB rejects a bare object because it needs to know *how* to apply the change.
