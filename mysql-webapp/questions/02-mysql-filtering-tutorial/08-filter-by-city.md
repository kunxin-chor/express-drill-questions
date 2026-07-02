# Problem

Your goal is to return rows based on a value inside a **nested JSON object**. In our `people` table, the `address` column stores an object like `{"city": "London", "country": "UK"}`.

## What you need to build

- Register a `GET /people/city/:city` route.
- Return only the people whose `address.city` matches the value from the URL.

## The data you are filtering

```text
name   | address (JSON object)
-------+-----------------------------------
Ada    | {"city": "London", "country": "UK"}
Grace  | {"city": "New York", "country": "US"}
Linus  | {"city": "Helsinki", "country": "FI"}
Maya   | {"city": "London", "country": "UK"}
```

Requesting `London` should return **Ada** and **Maya**.

## Concept: JSON path operators

MySQL provides the `->>` operator to extract a value from a JSON column and return it as a normal string. The path starts with `$` (the root of the JSON document).

```sql
SELECT * FROM people WHERE address->>'$.city' = 'London';
```

- `address` is the column name.
- `->>` extracts the value and unquotes it (so `"London"` becomes `London`).
- `$.city` is the path to the key we want.

## Write it in the editor

Replace the `// TODO` inside the `GET /people/city/:city` handler with:

```js
app.get('/people/city/:city', async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM people WHERE address->>'$.city' = ?",
    [req.params.city]
  );
  res.json(rows);
});
```

- `address->>'$.city'` targets the specific property inside the JSON object.
- The `?` placeholder safely handles the city name from the URL.

## Try it

`GET /people/city/London`

You should see **Ada** and **Maya**. Try `GET /people/city/Helsinki` to see Linus.

# Starter

```js
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const pool = mysql.createPool(process.env.DATABASE_URL);

app.get('/people/city/:city', async (req, res) => {
  // TODO: find people whose address.city inside the 'address' JSON object matches req.params.city
});

module.exports = app;
```

# Solution

```js
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const pool = mysql.createPool(process.env.DATABASE_URL);

app.get('/people/city/:city', async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM people WHERE address->>'$.city' = ?",
    [req.params.city]
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

describe('GET /people/city/:city', () => {
  let conn;

  beforeAll(async () => {
    conn = await mysql.createConnection(process.env.DATABASE_URL);
    await seedPeople(conn);
  });

  afterAll(async () => {
    await conn.end();
  });

  test('returns Ada and Maya for city London', async () => {
    const res = await request(app).get('/people/city/London');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Ada' }),
      expect.objectContaining({ name: 'Maya' }),
    ]));
  });

  test('returns Linus for city Helsinki', async () => {
    const res = await request(app).get('/people/city/Helsinki');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Linus');
  });

  test('returns empty for unknown city', async () => {
    const res = await request(app).get('/people/city/Paris');
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

MySQL uses `->>` (inline path operator) to extract values from JSON objects. The path `$.city` looks for the "city" key at the root of the JSON document in that column. This allows you to treat nested JSON data as if it were a top-level column.
