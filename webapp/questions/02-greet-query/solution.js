const express = require('express');
const app = express();

app.get('/greet', (req, res) => {
  const name = req.query.name || 'stranger';
  res.send(`Hello, ${name}!`);
});

module.exports = app;
