# Problem

Now, let's combine your database skills with EJS to create a real data table. You will fetch records from the `people` table and render them into an HTML `<table>`.

## What you need to build

- Register a `GET /people/table` route.
- Fetch all rows from the `people` table.
- Use EJS to render these rows into an HTML table with three columns: **Name**, **Role**, and **Age**.

## The data you are rendering

The `people` table contains:
```text
name   | role    | age
-------+---------+----
Ada    | admin   | 28
Grace  | student | 34
...
```

## Concept: HTML Tables in EJS

A table is made of rows (`<tr>`) and cells (`<td>`). We wrap the rows in a loop to generate one `<tr>` for every person in our data.

```html
<table border="1">
  <thead>
    <tr>
      <th>Name</th>
      <th>Role</th>
    </tr>
  </thead>
  <tbody>
    <% people.forEach(person => { %>
      <tr>
        <td><%= person.name %></td>
        <td><%= person.role %></td>
      </tr>
    <% }); %>
  </tbody>
</table>
```

## Write it in the editor

```js
app.get('/people/table', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM people');
  
  const template = `
    <h1>People Table</h1>
    <table border="1">
      <tr>
        <th>Name</th>
        <th>Role</th>
        <th>Age</th>
      </tr>
      <% people.forEach(p => { %>
        <tr>
          <td><%= p.name %></td>
          <td><%= p.role %></td>
          <td><%= p.age %></td>
        </tr>
      <% }); %>
    </table>
  `;

  const html = ejs.render(template, { people: rows });
  res.send(html);
});
```

## Try it

`GET /people/table`

You should see a real HTML table populated with data from your MySQL database.

# Starter

```js
const express = require('express');
const mysql = require('mysql2/promise');
const ejs = require('ejs');

const app = express();
const pool = mysql.createPool(process.env.DATABASE_URL);

app.get('/people/table', async (req, res) => {
  // TODO: Fetch all people and render them into an HTML table using EJS
});

module.exports = app;
```

# Solution

```js
const express = require('express');
const mysql = require('mysql2/promise');
const ejs = require('ejs');

const app = express();
const pool = mysql.createPool(process.env.DATABASE_URL);

app.get('/people/table', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM people');
  
  const template = `
    <table border="1">
      <tr>
        <th>Name</th>
        <th>Role</th>
        <th>Age</th>
      </tr>
      <% people.forEach(p => { %>
        <tr>
          <td><%= p.name %></td>
          <td><%= p.role %></td>
          <td><%= p.age %></td>
        </tr>
      <% }); %>
    </table>
  `;

  const html = ejs.render(template, { people: rows });
  res.send(html);
});

module.exports = app;
```

# Tests

```js
const request = require('supertest');
const mysql = require('mysql2/promise');
const app = require('./app');

const PEOPLE = [
  { name: 'Ada', role: 'admin', age: 28 },
  { name: 'Grace', role: 'student', age: 34 }
];

async function seedPeople(conn) {
  await conn.query('DROP TABLE IF EXISTS people');
  await conn.query('CREATE TABLE people (name VARCHAR(255), role VARCHAR(50), age INT)');
  for (const p of PEOPLE) {
    await conn.query('INSERT INTO people (name, role, age) VALUES (?, ?, ?)', [p.name, p.role, p.age]);
  }
}

describe('GET /people/table', () => {
  let conn;

  beforeAll(async () => {
    conn = await mysql.createConnection(process.env.DATABASE_URL);
    await seedPeople(conn);
  });

  afterAll(async () => {
    await conn.end();
  });

  test('returns an HTML table with database rows', async () => {
    const res = await request(app).get('/people/table');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<table');
    expect(res.text).toContain('<td>Ada</td>');
    expect(res.text).toContain('<td>admin</td>');
    expect(res.text).toContain('<td>28</td>');
    expect(res.text).toContain('<td>Grace</td>');
    expect(res.text).toContain('<td>student</td>');
    expect(res.text).toContain('<td>34</td>');
  });
});
```

# Seed

```js
const mysql = require('mysql2/promise');

async function seed() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  await conn.query('DROP TABLE IF EXISTS people');
  await conn.query('CREATE TABLE people (name VARCHAR(255), role VARCHAR(50), age INT)');
  const people = [
    ['Ada', 'admin', 28],
    ['Grace', 'student', 34],
    ['Linus', 'admin', 42],
    ['Maya', 'student', 24]
  ];
  for (const p of people) {
    await conn.query('INSERT INTO people (name, role, age) VALUES (?, ?, ?)', p);
  }
  await conn.end();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
```

# Walkthrough

By passing the database `rows` into `ejs.render`, we can treat them like a normal JavaScript array inside the template. The `<tr>` and `<td>` tags are generated dynamically for each row in the database. Adding `border="1"` is a quick way to make the table visible, though in real apps you would use CSS.
