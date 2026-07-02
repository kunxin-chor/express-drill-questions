# Problem

Your goal is to return rows where a text column contains a specific search term. This is how you build a basic **search feature**.

## What you need to build

- Register a `GET /people/search` route.
- Read a `q` query parameter (e.g., `/people/search?q=express`).
- Return only the people whose `title` contains that search term (case-insensitive).

## The data you are filtering

```text
name   | title
-------+-------------------------
Ada    | Learning Express APIs
Grace  | Express Routing Guide
Linus  | Systems Notes
Maya   | MySQL Search Basics
```

Searching for `express` should return **Ada** and **Grace**.

## Concept: the LIKE operator

The `LIKE` operator is used to search for a specified pattern in a column. You use the `%` wildcard to represent zero, one, or multiple characters.

- `title LIKE 'express%'` — starts with "express"
- `title LIKE '%express'` — ends with "express"
- `title LIKE '%express%'` — contains "express" anywhere

```sql
SELECT * FROM people WHERE title LIKE '%express%';
```

In MySQL, `LIKE` is case-insensitive by default for standard character sets.

## Write it in the editor

Replace the `// TODO` inside the `GET /people/search` handler with:

```js
app.get('/people/search', async (req, res) => {
  const searchTerm = `%${req.query.q || ''}%`;
  const [rows] = await pool.query(
    'SELECT * FROM people WHERE title LIKE ?',
    [searchTerm]
  );
  res.json(rows);
});
```

- `%${req.query.q}%` adds the wildcards to the search term in JavaScript before passing it to SQL.
- `WHERE title LIKE ?` uses the wildcarded string to perform a partial match.
- By wrapping the term in `%`, we find the word anywhere in the `title`.

## Try it

`GET /people/search?q=express`

You should see **Ada** and **Grace**. Try `q=notes` to see Linus.

# Starter

```js
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const pool = mysql.createPool(process.env.DATABASE_URL);

app.get('/people/search', async (req, res) => {
  // TODO: find people whose 'title' contains the term req.query.q
});

module.exports = app;
```

# Solution

```js
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const pool = mysql.createPool(process.env.DATABASE_URL);

app.get('/people/search', async (req, res) => {
  const searchTerm = `%${req.query.q || ''}%`;
  const [rows] = await pool.query(
    'SELECT * FROM people WHERE title LIKE ?',
    [searchTerm]
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

describe('GET /people/search', () => {
  let conn;

  beforeAll(async () => {
    conn = await mysql.createConnection(process.env.DATABASE_URL);
    await seedPeople(conn);
  });

  afterAll(async () => {
    await conn.end();
  });

  test('returns Ada and Grace for query "express"', async () => {
    const res = await request(app).get('/people/search?q=express');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    const names = res.body.map(p => p.name);
    expect(names).toContain('Ada');
    expect(names).toContain('Grace');
  });

  test('returns Linus for query "notes"', async () => {
    const res = await request(app).get('/people/search?q=notes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Linus');
  });

  test('returns everyone for empty query', async () => {
    const res = await request(app).get('/people/search?q=');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(4);
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

The `LIKE` operator combined with `%` wildcards allows for partial text matching. Using `"%${term}%"` finds the term anywhere in the string. If the user provides an empty string, the query effectively becomes `LIKE '%%'`, which matches everything.
