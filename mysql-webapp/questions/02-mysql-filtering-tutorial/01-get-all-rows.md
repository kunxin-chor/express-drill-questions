# Problem

Your goal is to read **every row** from a MySQL table and return it from an Express route. This is the starting point for all filtering: before you can narrow results, you need to fetch them.

## What you need to build

- Register a `GET /people` route.
- Read all rows from the `people` table.
- Send them back to the client as a JSON array.

## The data you are filtering

Every tutorial in this section uses the same seeded `people` table:

```text
name   | role    | age | address.city
-------+---------+-----+-------------
Ada    | admin   | 28  | London
Grace  | student | 34  | New York
Linus  | admin   | 42  | Helsinki
Maya   | student | 24  | London
```

## Concept: the SELECT statement

In MySQL you read rows with `SELECT`. The `WHERE` clause is the **filter** — it describes which rows come back. With **no** `WHERE` clause, every row comes back.

Read these three queries and predict the result of each before moving on:

```sql
SELECT * FROM people;                      -- every row
SELECT * FROM people WHERE role = 'admin'; -- only admins
SELECT * FROM people WHERE age = 24;       -- only people aged 24
```

Notice that only the `WHERE` clause changes. Leaving it off is special because it sets no conditions, so nothing is filtered out.

## Write it in the editor

The panel on the **left is a real code editor** holding a starter `app.js`. **This is where you type your answer** — the code blocks in this tab are examples. Replace the `// TODO` line inside the route with the code below, then click **Run tests**.

```js
app.get('/people', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM people');
  res.json(rows);
});
```

- `pool.query(sql)` runs the SQL against the connection pool.
- mysql2 returns `[rows, fields]`, so we destructure `[rows]` to get just the data.
- `SELECT * FROM people` reads every column of every row.
- `await` waits for the database, because the call is asynchronous.
- `res.json(rows)` sends the array back as JSON.

## Try it

Open the **Try** tab and send:

`GET /people`

You should see a JSON array containing all four people (Ada, Grace, Linus, Maya), because the query has no `WHERE` clause.

## Summary

A SQL read is a `SELECT` against a table. The `WHERE` clause answers "which rows?", and omitting it answers "all of them". Every later lesson changes only the `WHERE` clause — the surrounding `pool.query(...)` pattern stays the same.

# Starter

```js
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const pool = mysql.createPool(process.env.DATABASE_URL);

app.get('/people', async (req, res) => {
  // TODO: get every row from the 'people' table
});

module.exports = app;
```

# Solution

```js
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const pool = mysql.createPool(process.env.DATABASE_URL);

app.get('/people', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM people');
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

describe('GET /people', () => {
  let conn;

  beforeAll(async () => {
    conn = await mysql.createConnection(process.env.DATABASE_URL);
    await seedPeople(conn);
  });

  afterAll(async () => {
    await conn.end();
  });

  test('returns the expected rows', async () => {
    const res = await request(app).get('/people');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(4);
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Ada' }),
      expect.objectContaining({ name: 'Grace' }),
      expect.objectContaining({ name: 'Linus' }),
      expect.objectContaining({ name: 'Maya' }),
    ]));
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

The route runs `SELECT * FROM people` with no `WHERE` clause, so no rows are excluded. mysql2's `pool.query()` resolves to a `[rows, fields]` tuple; destructuring `[rows]` hands `res.json` a plain array. JSON columns (`tags`, `skills`, `address`) come back already parsed into JavaScript values.
