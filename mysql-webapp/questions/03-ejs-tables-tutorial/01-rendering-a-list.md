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

In this environment, we define the template as a string inside our code.

```js
const ejs = require('ejs');

app.get('/names', (req, res) => {
  const names = ['Ada', 'Grace', 'Linus', 'Maya'];
  
  const template = `
    <h1>People</h1>
    <ul>
      <% names.forEach(name => { %>
        <li><%= name %></li>
      <% }); %>
    </ul>
  `;

  const html = ejs.render(template, { names });
  res.send(html);
});
```

## Try it

`GET /names`

You should see a heading and a bulleted list of names. If you view the "Try" output, you'll see it is now HTML, not JSON.

# Starter

```js
const express = require('express');
const ejs = require('ejs');
const app = express();

app.get('/names', (req, res) => {
  const names = ['Ada', 'Grace', 'Linus', 'Maya'];

  // TODO: Use ejs.render to generate a <ul> list of these names
});

module.exports = app;
```

# Solution

```js
const express = require('express');
const ejs = require('ejs');
const app = express();

app.get('/names', (req, res) => {
  const names = ['Ada', 'Grace', 'Linus', 'Maya'];
  
  const template = `
    <ul>
      <% names.forEach(name => { %>
        <li><%= name %></li>
      <% }); %>
    </ul>
  `;

  const html = ejs.render(template, { names });
  res.send(html);
});

module.exports = app;
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

`ejs.render(templateString, dataObject)` takes your template and a "context" object. Inside the template, the properties of the context object (like `names`) become available as variables. We use `<% names.forEach(...) %>` to start a loop and `<%= name %>` to insert each name into a `<li>` tag. Finally, `res.send(html)` sends the finished string to the browser.
