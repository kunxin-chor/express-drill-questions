# Problem

The **D** in CRUD: deleting a book. This lesson covers removing a single document by its id with `deleteOne`.

## What you need to build

- Register a `DELETE /api/books/:bookId` route.
- Match the book by its `_id`.
- Remove it from the collection.
- Respond with a success message.

## The data you are working with

The same `books` collection. A delete request carries **no body** — the id in the URL is all you need:

```
DELETE /api/books/65a1f3c9e4b0a2d1f8c7b6a5
```

## Concept: `deleteOne` takes a filter

`deleteOne` removes the **first** document that matches the filter:

```js
db.collection("books").deleteOne({
    _id: new ObjectId(req.params.bookId)
});
```

- The filter is the same id lookup you used for read-one and update.
- `deleteOne` removes at most one document; `deleteMany` would remove every match.
- The returned `result.deletedCount` tells you how many were removed (`1` on success, `0` if nothing matched).

## Concept: one vs many

Predict what each call removes from the sample data:

```js
deleteOne({ genre: "Tech" });        // removes ONE Tech book (the first match)
deleteMany({ genre: "Tech" });       // removes ALL Tech books
deleteOne({ _id: new ObjectId(id) }); // removes exactly the one with this id
```

Because `_id` is unique, the id form always removes exactly the book you intended.

## Write it in the editor

Type your answer into the `app.js` editor on the **left**. Replace the `// TODO`:

```js
app.delete("/api/books/:bookId", async function (req, res) {
    // remove the one document whose _id matches the id in the URL
    await db.collection("books").deleteOne({
        _id: new ObjectId(req.params.bookId)
    });

    res.json({
        message: "The book has been deleted"
    });
});
```

- `new ObjectId(req.params.bookId)` converts the URL string to match `_id`.
- `deleteOne(filter)` removes that single document.
- `await` waits for the delete to finish before responding.

Click **Run tests**, then try the request in the **Try** tab.

## Try it

`DELETE /api/books/<an existing _id>`

You should get `{ "message": "The book has been deleted" }`. Running `GET /api/books` afterwards shows the list is now shorter — that book is gone. Deleting the same id again still returns the message, but `deletedCount` would be `0` because there is nothing left to remove.

## Summary

Deleting a document is `deleteOne(filter)`, and for id-based deletes the filter is `{ _id: new ObjectId(req.params.id) }`. Prefer `deleteOne` with a unique `_id` so you remove exactly one record; `deleteMany` is for clearing every document that matches a broader condition. With this route the collection now supports the full CRUD lifecycle — Create, Read, Update, and Delete.

# Starter

```js
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

app.delete("/api/books/:bookId", async function (req, res) {
    // TODO: delete the book with the given id
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

app.delete("/api/books/:bookId", async function (req, res) {
    await db.collection("books").deleteOne({
        _id: new ObjectId(req.params.bookId)
    });

    res.json({
        message: "The book has been deleted"
    });
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const { MongoClient, ObjectId } = require('mongodb');
const app = require('./app');

describe('DELETE /api/books/:bookId', () => {
  let client;
  let db;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db();
  });

  beforeEach(async () => {
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

  test('removes the matching book', async () => {
    const target = await db.collection('books').findOne({ title: 'Dune' });

    const res = await request(app).delete(`/api/books/${target._id.toString()}`);
    expect(res.status).toBe(200);

    const stillThere = await db.collection('books').findOne({ _id: target._id });
    expect(stillThere).toBeNull();

    const remaining = await db.collection('books').countDocuments({});
    expect(remaining).toBe(1);
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

`deleteOne({ _id: new ObjectId(req.params.bookId) })` removes exactly the book named in the URL. The id conversion is the same as read-one and update, and because `_id` is unique, `deleteOne` targets a single record with no risk of removing extras. Use `deleteMany` only when you intend to clear every document matching a broader filter.
