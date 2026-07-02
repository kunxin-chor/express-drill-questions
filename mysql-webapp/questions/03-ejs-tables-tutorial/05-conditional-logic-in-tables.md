# Problem

One of the best reasons to use a template engine is to add **logic** to your presentation. In this lesson, you will highlight "Admin" users by adding a star next to their name in the table.

## What you need to build

- Register a `GET /people/highlight` route.
- Fetch all rows from the `people` table.
- Render a table where each row shows the **Name** and **Role**.
- **Logic**: If a person's role is "admin", their name should be displayed as `Ada ⭐`. Otherwise, just show the name.

## Concept: Logic in EJS

You can use standard JavaScript `if` statements inside your template using `<% ... %>`.

```html
<td>
  <%= p.name %>
  <% if (p.role === 'admin') { %>
    ⭐
  <% } %>
</td>
```

## Write it in the editor

In `app.js`:
```js
app.get('/people/highlight', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM people');
  res.render('index', { people: rows });
});
```

In `views/index.ejs`:
```html
<table border="1">
  <tr>
    <th>Name</th>
    <th>Role</th>
  </tr>
  <% people.forEach(p => { %>
    <tr>
      <td>
        <%= p.name %>
        <% if (p.role === 'admin') { %>
          ⭐
        <% } %>
      </td>
      <td><%= p.role %></td>
    </tr>
  <% }); %>
</table>
```

## Try it

`GET /people/highlight`

You should see stars next to Ada and Linus, but not next to Grace or Maya.

# Starter

```js
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const pool = mysql.createPool(process.env.DATABASE_URL);

app.set('view engine', 'ejs');

app.get('/people/highlight', async (req, res) => {
  // TODO: Render a table where admins get a '⭐' next to their name
});

module.exports = app;
```

# EJS Starter

```html
<table border="1">
  <tr>
    <th>Name</th>
    <th>Role</th>
  </tr>
  <% people.forEach(p => { %>
    <tr>
      <td>
        <%= p.name %>
        <!-- TODO: Add a ⭐ if p.role is 'admin' -->
      </td>
      <td><%= p.role %></td>
    </tr>
  <% }); %>
</table>
```

# Solution

```js
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const pool = mysql.createPool(process.env.DATABASE_URL);

app.set('view engine', 'ejs');

app.get('/people/highlight', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM people');
  res.render('index', { people: rows });
});

module.exports = app;
```

# EJS Solution

```html
<table border="1">
  <tr>
    <th>Name</th>
    <th>Role</th>
  </tr>
  <% people.forEach(p => { %>
    <tr>
      <td>
        <%= p.name %>
        <% if (p.role === 'admin') { %>
          ⭐
        <% } %>
      </td>
      <td><%= p.role %></td>
    </tr>
  <% }); %>
</table>
```

# Tests

```js
const request = require('supertest');
const mysql = require('mysql2/promise');
const app = require('./app');

const PEOPLE = [
  { name: 'Ada', role: 'admin' },
  { name: 'Grace', role: 'student' }
];

async function seedPeople(conn) {
  await conn.query('DROP TABLE IF EXISTS people');
  await conn.query('CREATE TABLE people (name VARCHAR(255), role VARCHAR(50))');
  for (const p of PEOPLE) {
    await conn.query('INSERT INTO people (name, role) VALUES (?, ?)', [p.name, p.role]);
  }
}

describe('GET /people/highlight', () => {
  let conn;

  beforeAll(async () => {
    conn = await mysql.createConnection(process.env.DATABASE_URL);
    await seedPeople(conn);
  });

  afterAll(async () => {
    await conn.end();
  });

  test('adds star to admins', async () => {
    const res = await request(app).get('/people/highlight');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Ada ⭐');
    expect(res.text).toContain('Grace');
    expect(res.text).not.toContain('Grace ⭐');
  });
});
```

# Seed

```js
const mysql = require('mysql2/promise');

async function seed() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  await conn.query('DROP TABLE IF EXISTS people');
  await conn.query('CREATE TABLE people (name VARCHAR(255), role VARCHAR(50))');
  const people = [
    ['Ada', 'admin'],
    ['Grace', 'student'],
    ['Linus', 'admin'],
    ['Maya', 'student']
  ];
  for (const p of people) {
    await conn.query('INSERT INTO people (name, role) VALUES (?, ?)', p);
  }
  await conn.end();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
```

# Walkthrough

EJS templates allow you to write normal JavaScript conditions. By wrapping the `⭐` emoji in an `if` block, we ensure it only appears when the condition is met. This power to mix data, logic, and HTML is what makes template engines so useful for building web pages.
