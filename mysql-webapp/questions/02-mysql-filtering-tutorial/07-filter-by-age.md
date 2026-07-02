# Problem

Your goal is to return rows where a numeric column is greater than or equal to a certain value. This introduces **comparison operators**.

## What you need to build

- Register a `GET /people/age-min/:min` route.
- Read the `min` value from the URL.
- Return only the people whose `age` is **greater than or equal to** that value.

## The data you are filtering

```text
name   | age
-------+----
Ada    | 28
Grace  | 34
Linus  | 42
Maya   | 24
```

Requesting `min=30` should return **Grace** (34) and **Linus** (42).

## Concept: Comparison operators

SQL supports the standard set of comparison operators:

- `>` (greater than)
- `>=` (greater than or equal to)
- `<` (less than)
- `<=` (less than or equal to)
- `<>` or `!=` (not equal to)

```sql
SELECT * FROM people WHERE age >= 30;
```

## Write it in the editor

Replace the `// TODO` inside the `GET /people/age-min/:min` handler with:

```js
app.get('/people/age-min/:min', async (req, res) => {
  const minAge = parseInt(req.params.min, 10);
  const [rows] = await pool.query(
    'SELECT * FROM people WHERE age >= ?',
    [minAge]
  );
  res.json(rows);
});
```

- `parseInt(req.params.min, 10)` ensures the input is treated as a number.
- `WHERE age >= ?` applies the filter.

## Try it

`GET /people/age-min/30`

You should see **Grace** and **Linus**. Try `GET /people/age-min/40` to see only Linus.

# Starter

```js
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const pool = mysql.createPool(process.env.DATABASE_URL);

app.get('/people/age-min/:min', async (req, res) => {
  // TODO: find people whose age is >= req.params.min
});

module.exports = app;
```

# Solution

```js
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const pool = mysql.createPool(process.env.DATABASE_URL);

app.get('/people/age-min/:min', async (req, res) => {
  const minAge = parseInt(req.params.min, 10);
  const [rows] = await pool.query(
    'SELECT * FROM people WHERE age >= ?',
    [minAge]
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

describe('GET /people/age-min/:min', () => {
  let conn;

  beforeAll(async () => {
    conn = await mysql.createConnection(process.env.DATABASE_URL);
    await seedPeople(conn);
  });

  afterAll(async () => {
    await conn.end();
  });

  test('returns Grace and Linus for min age 30', async () => {
    const res = await request(app).get('/people/age-min/30');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Grace' }),
      expect.objectContaining({ name: 'Linus' }),
    ]));
  });

  test('returns everyone for min age 20', async () => {
    const res = await request(app).get('/people/age-min/20');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(4);
  });

  test('returns nothing for min age 50', async () => {
    const res = await request(app).get('/people/age-min/50');
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

SQL comparison operators like `>=` work on numeric columns just like they do in JavaScript. We use `parseInt` to ensure our input is a number, then pass it to the query via a `?` placeholder.
