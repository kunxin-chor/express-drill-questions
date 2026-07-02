# Problem

Your goal is to use EJS to conditionally show content. You will render a greeting that changes based on a `isLoggedIn` boolean.

## What you need to build

- Register a `GET /greet` route.
- Pass two variables to the `index` view:
  - `name`: `'Grace'`
  - `isLoggedIn`: `true`
- In `views/index.ejs`:
  - If `isLoggedIn` is true, show `<h1>Welcome back, Grace!</h1>`.
  - Otherwise, show `<h1>Please log in.</h1>`.

## Concept: Logic Blocks

You can run JavaScript code that doesn't output anything (like `if` statements or loops) using the `<% ... %>` tag.

Example:
```html
<% if (isAdmin) { %>
  <p>Admin Control Panel</p>
<% } else { %>
  <p>Standard User View</p>
<% } %>
```

## Write it in the editor

In `app.js`:
```js
app.get('/greet', (req, res) => {
  res.render('index', { 
    name: 'Grace',
    isLoggedIn: true 
  });
});
```

In `views/index.ejs`:
```html
<% if (isLoggedIn) { %>
  <h1>Welcome back, <%= name %>!</h1>
<% } else { %>
  <h1>Please log in.</h1>
<% } %>
```

## Try it

`GET /greet`

You should see "Welcome back, Grace!". If you change `isLoggedIn` to `false` in your code and run again, you'll see "Please log in.".

# Starter

```js
const express = require('express');
const app = express();

app.set('view engine', 'ejs');

app.get('/greet', (req, res) => {
  // TODO: Render 'index' with name: 'Grace' and isLoggedIn: true
});

module.exports = app;
```

# EJS Starter

```html
<!-- TODO: Use an if/else block to show different greetings -->
```

# Solution

```js
const express = require('express');
const app = express();

app.set('view engine', 'ejs');

app.get('/greet', (req, res) => {
  res.render('index', { 
    name: 'Grace',
    isLoggedIn: true 
  });
});

module.exports = app;
```

# EJS Solution

```html
<% if (isLoggedIn) { %>
  <h1>Welcome back, <%= name %>!</h1>
<% } else { %>
  <h1>Please log in.</h1>
<% } %>
```

# Tests

```js
const request = require('supertest');
const app = require('./app');

describe('GET /greet', () => {
  test('renders welcome message when isLoggedIn is true', async () => {
    const res = await request(app).get('/greet');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Welcome back, Grace!');
    expect(res.text).not.toContain('Please log in.');
  });
});
```

# Walkthrough

Notice the difference between the two tags:
- `<% ... %>` (Scriptlet tag): Used for the `if` and `else` logic. It doesn't put anything into the HTML.
- `<%= ... %>` (Output tag): Used to put the `name` variable into the HTML.

This allows you to create dynamic pages that look completely different depending on the data you pass in.
