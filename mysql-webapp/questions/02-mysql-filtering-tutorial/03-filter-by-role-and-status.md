# Problem

Your goal is to return only the rows that match **two** criteria: `role` and `status`. This is how you build more specific filters.

## What you need to build

- Register a `GET /people/filter` route.
- Read `role` and `status` from the **query string** (e.g., `/people/filter?role=admin&status=active`).
- Return only the people who match **both** values.

## The data you are filtering

```text
name   | role    | status
-------+---------+---------
Ada    | admin   | active
Grace  | student | active
Linus  | admin   | inactive
Maya   | student | active
```

Requesting `role=admin` AND `status=active` should return only **Ada**. (Linus matches the role but is inactive).

## Concept: the AND operator

In SQL, you combine conditions in a `WHERE` clause using the `AND` operator. A row is only kept if **both** conditions are true.

```sql
SELECT * FROM people WHERE role = 'admin' AND status = 'active';
```

Predict what these combinations return:

```sql
WHERE role = 'student' AND status = 'active';   -- ?
WHERE role = 'admin' AND status = 'inactive';   -- ?
WHERE role = 'student' AND status = 'inactive'; -- ?
```

## Write it in the editor

Replace the `// TODO` inside the `GET /people/filter` handler with:

```js
app.get('/people/filter', async (req, res) => {
  const { role, status } = req.query;
  const [rows] = await pool.query(
    'SELECT * FROM people WHERE role = ? AND status = ?',
    [role, status]
  );
  res.json(rows);
});
```

- `req.query` reads variables from the query string (the part after the `?` in the URL).
- `SELECT ... WHERE role = ? AND status = ?` requires both matches.
- The order in `[role, status]` must match the order of `?` in the SQL string.

## Try it

`GET /people/filter?role=admin&status=active`

You should see only **Ada**. Try changing it to `status=inactive` to see only Linus.

# Starter

```js
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const pool = mysql.createPool(process.env.DATABASE_URL);

app.get('/people/filter', async (req, res) => {
  // TODO: find people matching both role and status from req.query
});

module.exports = app;
```

# Solution

```js
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const pool = mysql.createPool(process.env.DATABASE_URL);

app.get('/people/filter', async (req, res) => {
  const { role, status } = req.query;
  const [rows] = await pool.query(
    'SELECT * FROM people WHERE role = ? AND status = ?',
    [role, status]
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

describe('GET /people/filter', () => {
  let conn;

  beforeAll(async () => {
    conn = await mysql.createConnection(process.env.DATABASE_URL);
    await seedPeople(conn);
  });

  afterAll(async () => {
    await conn.end();
  });

  test('returns Ada for role admin and status active', async () => {
    const res = await request(app).get('/people/filter?role=admin&status=active');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Ada');
  });

  test('returns Linus for role admin and status inactive', async () => {
    const res = await request(app).get('/people/filter?role=admin&status=inactive');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Linus');
  });

  test('returns empty for student and inactive', async () => {
    const res = await request(app).get('/people/filter?role=student&status=inactive');
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

Using `AND` in a `WHERE` clause combines multiple filters. This route reads `req.query`, which holds values from the query string (`?key=value`). We map these to `?` placeholders in our SQL query to keep it dynamic and safe.
