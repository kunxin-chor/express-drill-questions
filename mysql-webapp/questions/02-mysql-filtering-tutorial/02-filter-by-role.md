# Problem

Your goal is to return only the rows whose `role` matches a value taken from the URL. This is your first real filter — one column, one value.

## What you need to build

- Register a `GET /people/role/:role` route.
- Read the `role` value from the URL.
- Return only the people whose `role` column equals that value.

## The data you are filtering

```text
name   | role
-------+---------
Ada    | admin
Grace  | student
Linus  | admin
Maya   | student
```

Requesting `admin` should return **Ada** and **Linus**.

## Concept: the WHERE clause

In SQL, you filter results using the `WHERE` clause. To match by a single column, you use the format: `column_name = value`.

Predict what each of these queries returns from the sample data:

```sql
SELECT * FROM people WHERE role = 'admin';      -- ?
SELECT * FROM people WHERE role = 'student';    -- ?
SELECT * FROM people WHERE status = 'active';   -- a different column entirely
```

The column name must exist in the table, and the value is what you compare against. Your route makes the value dynamic by reading it from the URL with `req.params.role`.

## Write it in the editor

Replace the `// TODO` inside the `GET /people/role/:role` handler with:

```js
app.get('/people/role/:role', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM people WHERE role = ?',
    [req.params.role]
  );
  res.json(rows);
});
```

- `req.params.role` reads the `:role` part of the URL.
- `SELECT * FROM people WHERE role = ?` defines the condition.
- `[req.params.role]` is a **prepared statement** parameter. It safely inserts the value into the query where the `?` is, protecting you from SQL injection.
- `res.json(rows)` returns the filtered array.

## Try it

`GET /people/role/admin`

You should see **Ada** and **Linus** — only the people whose `role` equals `admin`. Try `GET /people/role/student` next to see Grace and Maya.

# Starter

```js
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const pool = mysql.createPool(process.env.DATABASE_URL);

app.get('/people/role/:role', async (req, res) => {
  // TODO: find people with the requested role
});

module.exports = app;
```

# Solution

```js
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const pool = mysql.createPool(process.env.DATABASE_URL);

app.get('/people/role/:role', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM people WHERE role = ?',
    [req.params.role]
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

describe('GET /people/role/:role', () => {
  let conn;

  beforeAll(async () => {
    conn = await mysql.createConnection(process.env.DATABASE_URL);
    await seedPeople(conn);
  });

  afterAll(async () => {
    await conn.end();
  });

  test('returns Ada and Linus for role admin', async () => {
    const res = await request(app).get('/people/role/admin');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Ada' }),
      expect.objectContaining({ name: 'Linus' }),
    ]));
  });

  test('returns Grace and Maya for role student', async () => {
    const res = await request(app).get('/people/role/student');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Grace' }),
      expect.objectContaining({ name: 'Maya' }),
    ]));
  });

  test('returns empty array for unknown role', async () => {
    const res = await request(app).get('/people/role/nobody');
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

The `WHERE role = ?` clause filters the result set to only those rows matching the parameter. We use a prepared statement (the `?`) and pass the value in an array `[req.params.role]` to prevent SQL injection.
