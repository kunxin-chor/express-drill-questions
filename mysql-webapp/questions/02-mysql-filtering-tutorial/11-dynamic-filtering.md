# Problem

In a real app, users don't just use one filter at a time. They might filter by `role` AND `status`, or just by `minAge`, or all three. Your goal is to build a **flexible filter endpoint** that handles any combination of these three fields.

## What you need to build

- Register a `GET /people/find` route.
- It should optionally support these query parameters:
  - `role` (exact match)
  - `status` (exact match)
  - `minAge` (age must be >= this value)
- If no parameters are provided, it should return **everyone**.
- If multiple parameters are provided, it should return people who match **all** of them.

## Example requests

- `/people/find?role=admin` -> Ada, Linus
- `/people/find?role=admin&status=active` -> Ada
- `/people/find?minAge=40` -> Linus
- `/people/find?role=student&minAge=30` -> Grace
- `/people/find` -> everyone

## Concept: Dynamic SQL building

Since you don't know which filters the user will pick, you must build the `WHERE` clause at runtime. The safest way is to collect conditions and values in arrays, then join them.

```js
const conditions = [];
const values = [];

if (req.query.role) {
  conditions.push('role = ?');
  values.push(req.query.role);
}

// ... more checks ...

const whereClause = conditions.length 
  ? 'WHERE ' + conditions.join(' AND ') 
  : '';

const sql = `SELECT * FROM people ${whereClause}`;
```

## Write it in the editor

Replace the `// TODO` inside the `GET /people/find` handler with:

```js
app.get('/people/find', async (req, res) => {
  const { role, status, minAge } = req.query;
  const conditions = [];
  const values = [];

  if (role) {
    conditions.push('role = ?');
    values.push(role);
  }
  if (status) {
    conditions.push('status = ?');
    values.push(status);
  }
  if (minAge) {
    conditions.push('age >= ?');
    values.push(parseInt(minAge, 10));
  }

  const whereClause = conditions.length 
    ? 'WHERE ' + conditions.join(' AND ') 
    : '';

  const [rows] = await pool.query(
    `SELECT * FROM people ${whereClause}`,
    values
  );
  res.json(rows);
});
```

- We check each potential parameter one by one.
- If it exists, we add the SQL snippet (`role = ?`) to `conditions` and the data to `values`.
- `conditions.join(' AND ')` handles the logic of putting `AND` between multiple filters without having a trailing `AND` at the end.
- If `conditions` is empty, we don't add a `WHERE` clause at all, so we get everyone.

## Try it

1. `GET /people/find` (should see all 4)
2. `GET /people/find?role=admin&status=active` (should see Ada)
3. `GET /people/find?minAge=35` (should see Linus)

# Starter

```js
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const pool = mysql.createPool(process.env.DATABASE_URL);

app.get('/people/find', async (req, res) => {
  // TODO: build a dynamic WHERE clause for role, status, and minAge
});

module.exports = app;
```

# Solution

```js
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const pool = mysql.createPool(process.env.DATABASE_URL);

app.get('/people/find', async (req, res) => {
  const { role, status, minAge } = req.query;
  const conditions = [];
  const values = [];

  if (role) {
    conditions.push('role = ?');
    values.push(role);
  }
  if (status) {
    conditions.push('status = ?');
    values.push(status);
  }
  if (minAge) {
    conditions.push('age >= ?');
    values.push(parseInt(minAge, 10));
  }

  const whereClause = conditions.length 
    ? 'WHERE ' + conditions.join(' AND ') 
    : '';

  const [rows] = await pool.query(
    `SELECT * FROM people ${whereClause}`,
    values
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

describe('GET /people/find', () => {
  let conn;

  beforeAll(async () => {
    conn = await mysql.createConnection(process.env.DATABASE_URL);
    await seedPeople(conn);
  });

  afterAll(async () => {
    await conn.end();
  });

  test('returns everyone with no filters', async () => {
    const res = await request(app).get('/people/find');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(4);
  });

  test('filters by role and status (Ada)', async () => {
    const res = await request(app).get('/people/find?role=admin&status=active');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Ada');
  });

  test('filters by minAge (Grace and Linus)', async () => {
    const res = await request(app).get('/people/find?minAge=30');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    const names = res.body.map(p => p.name);
    expect(names).toContain('Grace');
    expect(names).toContain('Linus');
  });

  test('filters by role and minAge (Grace)', async () => {
    const res = await request(app).get('/people/find?role=student&minAge=30');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Grace');
  });

  test('returns nothing for impossible combination', async () => {
    const res = await request(app).get('/people/find?role=student&minAge=100');
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

Building a `WHERE` clause dynamically is a common task. By collecting the fragments of the query and their values separately, you can construct a valid SQL statement for any combination of user input while still using prepared statements for safety.
