# Problem

Your goal is to move from sending raw JSON to sending a formatted HTML list. You will use the **EJS** (Embedded JavaScript) template engine to loop through data and generate HTML on the server.

## What you need to build

- Register a `GET /names` route.
- Define a list of names: `['Ada', 'Grace', 'Linus', 'Maya']`.
- Use `ejs.render` to turn that array into an HTML `<ul>` list.
- Respond with the resulting HTML string.

## Concept: EJS Templates

EJS allows you to embed JavaScript logic (like loops and variables) directly inside your HTML.

- `<% ... %>`: "Control Flow" (loops, if-statements). Does not output anything.
- `<%= ... %>`: "Output". Escapes the value and puts it into the HTML.

Example EJS template:
```html
<ul>
  <% names.forEach(name => { %>
    <li><%= name %></li>
  <% }); %>
</ul>
```

## Write it in the editor

You now have two tabs in your code editor: `app.js` and `views/index.ejs`.

In `app.js`:
```js
const express = require('express');
const app = express();

app.set('view engine', 'ejs');

app.get('/names', (req, res) => {
  const names = ['Ada', 'Grace', 'Linus', 'Maya'];
  res.render('index', { names });
});
```

In `views/index.ejs`:
```html
<ul>
  <% names.forEach(name => { %>
    <li><%= name %></li>
  <% }); %>
</ul>
```

- `app.set('view engine', 'ejs')` tells Express to use EJS for rendering.
- `res.render('index', { names })` looks for a file named `index.ejs` in the `views/` folder and passes it the `names` data.

## Try it

`GET /names`

You should see a bulleted list of names. If you view the "Try" output, you'll see it is HTML.

# Starter

```js
const express = require('express');
const app = express();

app.set('view engine', 'ejs');

app.get('/names', (req, res) => {
  const names = ['Ada', 'Grace', 'Linus', 'Maya'];
  // TODO: Render the 'index' view and pass it the names array
});

module.exports = app;
```

# EJS Starter

```html
<!-- TODO: Use a forEach loop to show each name in a <li> tag -->
<ul>
</ul>
```

# Solution

```js
const express = require('express');
const app = express();

app.set('view engine', 'ejs');

app.get('/names', (req, res) => {
  const names = ['Ada', 'Grace', 'Linus', 'Maya'];
  res.render('index', { names });
});

module.exports = app;
```

# EJS Solution

```html
<ul>
  <% names.forEach(name => { %>
    <li><%= name %></li>
  <% }); %>
</ul>
```

# Tests

```js
const request = require('supertest');
const app = require('./app');

describe('GET /names', () => {
  test('returns HTML containing a list', async () => {
    const res = await request(app).get('/names');
    expect(res.status).toBe(200);
    expect(res.header['content-type']).toContain('text/html');
    expect(res.text).toContain('<ul>');
    expect(res.text).toContain('<li>Ada</li>');
    expect(res.text).toContain('<li>Grace</li>');
    expect(res.text).toContain('<li>Linus</li>');
    expect(res.text).toContain('<li>Maya</li>');
    expect(res.text).toContain('</ul>');
  });
});
```

# Walkthrough

By setting `app.set('view engine', 'ejs')`, you tell Express that when you call `res.render('index')`, it should look for a file named `index.ejs` in a `views` folder.

In this lesson, you have two files:
1. `app.js`: Your Express server logic.
2. `views/index.ejs`: Your HTML template.

The `res.render` function takes the name of the view and an object containing the data you want to pass to that view. Inside the template, the keys of that object (like `names`) become variables you can use. We use `<% names.forEach(...) %>` for the loop and `<%= name %>` to output the value.

