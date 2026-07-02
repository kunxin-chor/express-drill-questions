# Problem

Your goal is to return rows that match **either** of two criteria. This is how you widen your search.

## What you need to build

- Register a `GET /people/urgent` route.
- Return only the people who are either an `admin` **OR** under the age of `25`.

## The data you are filtering

```text
name   | role    | age
-------+---------+----
Ada    | admin   | 28
Grace  | student | 34
Linus  | admin   | 42
Maya   | student | 24
```

This query should return:
- **Ada** (matches role 'admin')
- **Linus** (matches role 'admin')
- **Maya** (matches age < 25)

**Grace** is excluded because she is neither an admin nor under 25.

## Concept: the OR operator

In SQL, the `OR` operator joins two conditions. A row is kept if **at least one** of the conditions is true.

```sql
SELECT * FROM people WHERE role = 'admin' OR age < 25;
```

Predict what these combinations return:

```sql
WHERE age > 40 OR age < 25;   -- ?
WHERE name = 'Ada' OR name = 'Grace'; -- ?
```

## Write it in the editor

Replace the `// TODO` inside the `GET /people/urgent` handler with:

```js
app.get('/people/urgent', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM people WHERE role = "admin" OR age < 25'
  );
  res.json(rows);
});
```

- `WHERE role = "admin" OR age < 25` uses a literal string for "admin" since it's not dynamic in this specific problem.
- No `?` placeholders are needed because the criteria are fixed for this specific endpoint.

## Try it

`GET /people/urgent`

You should see **Ada**, **Linus**, and **Maya**.

# Starter

```js
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const pool = mysql.createPool(process.env.DATABASE_URL);

app.get('/people/urgent', async (req, res) => {
  // TODO: find people who are EITHER 'admin' OR age < 25
});

module.exports = app;
```

# Solution

```js
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const pool = mysql.createPool(process.env.DATABASE_URL);

app.get('/people/urgent', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM people WHERE role = "admin" OR age < 25'
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

describe('GET /people/urgent', () => {
  let conn;

  beforeAll(async () => {
    conn = await mysql.createConnection(process.env.DATABASE_URL);
    await seedPeople(conn);
  });

  afterAll(async () => {
    await conn.end();
  });

  test('returns Ada, Linus, and Maya', async () => {
    const res = await request(app).get('/people/urgent');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    const names = res.body.map(p => p.name);
    expect(names).toContain('Ada');
    expect(names).toContain('Linus');
    expect(names).toContain('Maya');
    expect(names).not.toContain('Grace');
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

The `OR` operator widened the search. While `AND` narrows the search (both must match), `OR` includes a row if *any* of the conditions match.
