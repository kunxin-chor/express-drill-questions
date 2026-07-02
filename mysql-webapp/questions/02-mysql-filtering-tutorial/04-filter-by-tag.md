# Problem

Your goal is to return rows where a **JSON array** contains a specific value. In our `people` table, the `tags` column is stored as JSON.

## What you need to build

- Register a `GET /people/tag/:tag` route.
- Return only the people whose `tags` array contains the value from the URL.

## The data you are filtering

```text
name   | tags (JSON array)
-------+------------------
Ada    | ["node", "mysql"]
Grace  | ["node", "express"]
Linus  | ["linux", "systems"]
Maya   | ["mysql", "database"]
```

Requesting `mysql` should return **Ada** and **Maya**.

## Concept: JSON_CONTAINS

Because `tags` is a JSON column, you can't use a simple `=` (which would only work if the entire array matched). Instead, you use `JSON_CONTAINS(column, value)`.

To check if a string exists in a JSON array, the value must be a valid JSON string (double-quoted).

```sql
SELECT * FROM people WHERE JSON_CONTAINS(tags, '"node"');
```

## Write it in the editor

Replace the `// TODO` inside the `GET /people/tag/:tag` handler with:

```js
app.get('/people/tag/:tag', async (req, res) => {
  const jsonTag = JSON.stringify(req.params.tag); // wraps in double-quotes
  const [rows] = await pool.query(
    'SELECT * FROM people WHERE JSON_CONTAINS(tags, ?)',
    [jsonTag]
  );
  res.json(rows);
});
```

- `JSON.stringify(req.params.tag)` converts `'node'` to `'"node"'`. This is required because `JSON_CONTAINS` expects a JSON-formatted value.
- `JSON_CONTAINS(tags, ?)` returns true if the value exists anywhere in the JSON document (in this case, an array).
- `pool.query` handles the rest as usual.

## Try it

`GET /people/tag/mysql`

You should see **Ada** and **Maya**. Try `GET /people/tag/node` to see Ada and Grace.

# Starter

```js
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const pool = mysql.createPool(process.env.DATABASE_URL);

app.get('/people/tag/:tag', async (req, res) => {
  // TODO: find people whose 'tags' JSON array contains req.params.tag
});

module.exports = app;
```

# Solution

```js
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const pool = mysql.createPool(process.env.DATABASE_URL);

app.get('/people/tag/:tag', async (req, res) => {
  const jsonTag = JSON.stringify(req.params.tag);
  const [rows] = await pool.query(
    'SELECT * FROM people WHERE JSON_CONTAINS(tags, ?)',
    [jsonTag]
  );
  res.json(rows);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const mysql = require('mysql2/promise');
const app = require('./app');

const PEOPLE = [
  { name: 'Ada', role: 'admin', status: 'active', age: 28, tags: ['node', 'mysql'], skills: ['javascript', 'mysql'], address: { city: 'London', country: 'UK' }, title: 'Learning Express APIs', description: 'Build routes with Express and MySQL' },
  { name: 'Grace', role: 'student', status: 'active', age: 34, tags: ['node', 'express'], skills: ['javascript', 'express'], address: { city: 'New York', country: 'US' }, title: 'Express Routing Guide', description: 'Learn route parameters and query strings' },
  { name: 'Linus', role: 'admin', status: 'inactive', age: 42, tags: ['linux', 'systems'], skills: ['c', 'linux'], address: { city: 'Helsinki', country: 'FI' }, title: 'Systems Notes', description: 'Operating systems and server tools' },
  { name: 'Maya', role: 'student', status: 'active', age: 24, tags: ['mysql', 'database'], skills: ['mysql', 'data'], address: { city: 'London', country: 'UK' }, title: 'MySQL Search Basics', description: 'Filter rows with WHERE and LIKE' },
];

async function seedPeople(conn) {
  await conn.query('DROP TABLE IF EXISTS people');
  await conn.query(`CREATE TABLE people (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    role VARCHAR(50),
    status VARCHAR(50),
    age INT,
    tags JSON,
    skills JSON,
    address JSON,
    title VARCHAR(255),
    description TEXT
  )`);
  for (const p of PEOPLE) {
    await conn.query(
      'INSERT INTO people (name, role, status, age, tags, skills, address, title, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [p.name, p.role, p.status, p.age, JSON.stringify(p.tags), JSON.stringify(p.skills), JSON.stringify(p.address), p.title, p.description],
    );
  }
}

describe('GET /people/tag/:tag', () => {
  let conn;

  beforeAll(async () => {
    conn = await mysql.createConnection(process.env.DATABASE_URL);
    await seedPeople(conn);
  });

  afterAll(async () => {
    await conn.end();
  });

  test('returns Ada and Maya for tag mysql', async () => {
    const res = await request(app).get('/people/tag/mysql');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Ada' }),
      expect.objectContaining({ name: 'Maya' }),
    ]));
  });

  test('returns Linus for tag linux', async () => {
    const res = await request(app).get('/people/tag/linux');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Linus');
  });

  test('returns empty for unknown tag', async () => {
    const res = await request(app).get('/people/tag/java');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});
```

# Seed

```js
const mysql = require('mysql2/promise');

const PEOPLE = [
  { name: 'Ada', role: 'admin', status: 'active', age: 28, tags: ['node', 'mysql'], skills: ['javascript', 'mysql'], address: { city: 'London', country: 'UK' }, title: 'Learning Express APIs', description: 'Build routes with Express and MySQL' },
  { name: 'Grace', role: 'student', status: 'active', age: 34, tags: ['node', 'express'], skills: ['javascript', 'express'], address: { city: 'New York', country: 'US' }, title: 'Express Routing Guide', description: 'Learn route parameters and query strings' },
  { name: 'Linus', role: 'admin', status: 'inactive', age: 42, tags: ['linux', 'systems'], skills: ['c', 'linux'], address: { city: 'Helsinki', country: 'FI' }, title: 'Systems Notes', description: 'Operating systems and server tools' },
  { name: 'Maya', role: 'student', status: 'active', age: 24, tags: ['mysql', 'database'], skills: ['mysql', 'data'], address: { city: 'London', country: 'UK' }, title: 'MySQL Search Basics', description: 'Filter rows with WHERE and LIKE' },
];

async function seed() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  await conn.query('DROP TABLE IF EXISTS people');
  await conn.query(`CREATE TABLE people (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    role VARCHAR(50),
    status VARCHAR(50),
    age INT,
    tags JSON,
    skills JSON,
    address JSON,
    title VARCHAR(255),
    description TEXT
  )`);
  for (const p of PEOPLE) {
    await conn.query(
      'INSERT INTO people (name, role, status, age, tags, skills, address, title, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [p.name, p.role, p.status, p.age, JSON.stringify(p.tags), JSON.stringify(p.skills), JSON.stringify(p.address), p.title, p.description],
    );
  }
  await conn.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

# Walkthrough

MySQL's `JSON_CONTAINS` is used to search inside JSON columns. To find a string in a JSON array, the value must be a valid JSON string (e.g., `"node"`). `JSON.stringify()` is a handy way to ensure the quotes are added correctly before passing the value to the database.
