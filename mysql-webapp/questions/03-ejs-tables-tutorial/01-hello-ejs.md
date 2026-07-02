# Problem

Your goal is to render a simple HTML page where a name is dynamically inserted using EJS. This is the "Hello World" of server-side rendering.

## What you need to build

- Register a `GET /hello` route.
- Use `res.render` to render the `index` view.
- Pass a `name` variable with the value `'Student'`.
- In `views/index.ejs`, display the name inside an `<h1>` tag.

## Concept: Variable Interpolation

EJS allows you to inject data from your JavaScript code into your HTML.

- `<%= ... %>`: Outputs the value of a variable and **escapes** it for security (converts `<` to `&lt;`, etc.).

Example:
```html
<h1>Hello, <%= user %>!</h1>
```

## Write it in the editor

In `app.js`:
```js
app.get('/hello', (req, res) => {
  res.render('index', { name: 'Student' });
});
```

In `views/index.ejs`:
```html
<h1>Hello, <%= name %>!</h1>
```

## Try it

`GET /hello`

You should see an `<h1>` tag saying "Hello, Student!".

# Starter

```js
const express = require('express');
const app = express();

app.set('view engine', 'ejs');

app.get('/hello', (req, res) => {
  // TODO: Render the 'index' view and pass it a 'name' variable
});

module.exports = app;
```

# EJS Starter

```html
<!-- TODO: Display the 'name' variable inside an h1 tag -->
```

# Solution

```js
const express = require('express');
const app = express();

app.set('view engine', 'ejs');

app.get('/hello', (req, res) => {
  res.render('index', { name: 'Student' });
});

module.exports = app;
```

# EJS Solution

```html
<h1>Hello, <%= name %>!</h1>
```

# Tests

```js
const request = require('supertest');
const app = require('./app');

describe('GET /hello', () => {
  test('renders the name in an h1 tag', async () => {
    const res = await request(app).get('/hello');
    expect(res.status).toBe(200);
    expect(res.header['content-type']).toContain('text/html');
    expect(res.text).toContain('<h1>Hello, Student!</h1>');
  });
});
```

# Walkthrough

Server-side rendering (SSR) means your server generates the final HTML string before sending it to the browser. 

1. `app.set('view engine', 'ejs')` tells Express to expect EJS files.
2. `res.render('index', { name: 'Student' })` finds `views/index.ejs` and gives it access to a `name` variable.
3. `<%= name %>` in the template tells EJS to "paste the value of the name variable here".
