# Problem

Your goal is to return rows where a JSON array contains **all** of the requested values. This is how you find entries that match every tag in a list.

## What you need to build

- Register a `GET /people/tags/all` route.
- Read a `tags` query parameter (e.g., `/people/tags/all?tags=node,mysql`).
- Return only the people whose `tags` column contains **every** tag in that list.

## The data you are filtering

```text
name   | tags (JSON array)
-------+------------------
Ada    | ["node", "mysql"]
Grace  | ["node", "express"]
Linus  | ["linux", "systems"]
Maya   | ["mysql", "database"]
```

Requesting `tags=node,mysql` should return only **Ada**. (Grace has node but is missing mysql).

## Concept: Combining JSON_CONTAINS

To ensure a row contains multiple items, you use multiple `JSON_CONTAINS` calls joined by `AND`.

```sql
SELECT * FROM people 
WHERE JSON_CONTAINS(tags, '"node"') 
  AND JSON_CONTAINS(tags, '"mysql"');
```

## Write it in the editor

Because the number of tags is dynamic, you need to build the SQL query string based on how many tags are provided. Replace the `// TODO` inside the `GET /people/tags/all` handler with:

```js
app.get('/people/tags/all', async (req, res) => {
  const tags = (req.query.tags || '').split(',');
  if (!tags.length || !tags[0]) return res.json([]);

  const conditions = tags.map(() => 'JSON_CONTAINS(tags, ?)').join(' AND ');
  const values = tags.map(t => JSON.stringify(t));

  const [rows] = await pool.query(
    `SELECT * FROM people WHERE ${conditions}`,
    values
  );
  res.json(rows);
});
```

- `tags.map(() => 'JSON_CONTAINS(tags, ?)')` creates an array of strings like `['JSON_CONTAINS(tags, ?)', 'JSON_CONTAINS(tags, ?)']`.
- `.join(' AND ')` turns them into a single string: `JSON_CONTAINS(tags, ?) AND JSON_CONTAINS(tags, ?)`.
- `tags.map(t => JSON.stringify(t))` prepares the double-quoted JSON values for each `?`.
- This approach is flexible: it works for 1 tag, 2 tags, or 10.

## Try it

`GET /people/tags/all?tags=node,mysql`

You should see only **Ada**. Try `tags=node` to see Ada and Grace.

# Starter

```js
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const pool = mysql.createPool(process.env.DATABASE_URL);

app.get('/people/tags/all', async (req, res) => {
  // TODO: find people whose 'tags' contains ALL tags in the comma-separated req.query.tags
});

module.exports = app;
```

# Solution

```js
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const pool = mysql.createPool(process.env.DATABASE_URL);

app.get('/people/tags/all', async (req, res) => {
  const tags = (req.query.tags || '').split(',');
  if (!tags.length || !tags[0]) return res.json([]);

  const conditions = tags.map(() => 'JSON_CONTAINS(tags, ?)').join(' AND ');
  const values = tags.map(t => JSON.stringify(t));

  const [rows] = await pool.query(
    `SELECT * FROM people WHERE ${conditions}`,
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

describe('GET /people/tags/all', () => {
  let conn;

  beforeAll(async () => {
    conn = await mysql.createConnection(process.env.DATABASE_URL);
    await seedPeople(conn);
  });

  afterAll(async () => {
    await conn.end();
  });

  test('returns Ada for tags node,mysql', async () => {
    const res = await request(app).get('/people/tags/all?tags=node,mysql');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Ada');
  });

  test('returns Ada and Grace for tag node', async () => {
    const res = await request(app).get('/people/tags/all?tags=node');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Ada' }),
      expect.objectContaining({ name: 'Grace' }),
    ]));
  });

  test('returns nothing for node,linux', async () => {
    const res = await request(app).get('/people/tags/all?tags=node,linux');
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

To filter by multiple elements in a JSON array, we use multiple `JSON_CONTAINS` calls connected with `AND`. Because the list of tags can change, we build the SQL string dynamically by repeating the `JSON_CONTAINS` pattern for every tag in the array.
