# Problem

Your goal is to return rows where a column matches **any** value from a list. This is much cleaner than writing multiple `OR` statements.

## What you need to build

- Register a `GET /people/roles` route.
- Read a `roles` query parameter (e.g., `/people/roles?roles=admin,student`).
- Return only the people whose `role` matches any of the provided roles.

## The data you are filtering

```text
name   | role
-------+---------
Ada    | admin
Grace  | student
Linus  | admin
Maya   | student
```

Requesting `roles=admin,student` should return **everyone**. Requesting `roles=admin` should return Ada and Linus.

## Concept: the IN operator

The `IN` operator checks if a value exists within a set of values.

```sql
SELECT * FROM people WHERE role IN ('admin', 'student');
```

This is exactly equivalent to `WHERE role = 'admin' OR role = 'student'`, but it's much easier to read and maintain.

## Write it in the editor

Replace the `// TODO` inside the `GET /people/roles` handler with:

```js
app.get('/people/roles', async (req, res) => {
  const roles = (req.query.roles || '').split(',');
  const [rows] = await pool.query(
    'SELECT * FROM people WHERE role IN (?)',
    [roles]
  );
  res.json(rows);
});
```

- `req.query.roles.split(',')` converts the string `"admin,student"` into the array `['admin', 'student']`.
- `WHERE role IN (?)` combined with an array `[roles]` is a special feature of the `mysql2` driver. It automatically expands the single `?` into the correct number of placeholders: `IN (?, ?)`.
- If the array is empty, the query will fail or return nothing depending on your SQL engine; usually you should check if the array has items first.

## Try it

`GET /people/roles?roles=admin,student`

You should see all 4 people. Try `GET /people/roles?roles=admin` to see only the admins.

# Starter

```js
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const pool = mysql.createPool(process.env.DATABASE_URL);

app.get('/people/roles', async (req, res) => {
  // TODO: find people whose role is in the comma-separated list req.query.roles
});

module.exports = app;
```

# Solution

```js
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const pool = mysql.createPool(process.env.DATABASE_URL);

app.get('/people/roles', async (req, res) => {
  const roles = (req.query.roles || '').split(',');
  const [rows] = await pool.query(
    'SELECT * FROM people WHERE role IN (?)',
    [roles]
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

describe('GET /people/roles', () => {
  let conn;

  beforeAll(async () => {
    conn = await mysql.createConnection(process.env.DATABASE_URL);
    await seedPeople(conn);
  });

  afterAll(async () => {
    await conn.end();
  });

  test('returns everyone for admin,student', async () => {
    const res = await request(app).get('/people/roles?roles=admin,student');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(4);
  });

  test('returns only Ada and Linus for admin', async () => {
    const res = await request(app).get('/people/roles?roles=admin');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Ada' }),
      expect.objectContaining({ name: 'Linus' }),
    ]));
  });

  test('returns nothing for unknown roles', async () => {
    const res = await request(app).get('/people/roles?roles=nobody,guest');
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

The `IN` operator is a shortcut for multiple `OR` conditions. In `mysql2`, you can pass an array to a single `?` inside an `IN` clause, and it will be expanded correctly. This is safer and cleaner than building the query string manually.
