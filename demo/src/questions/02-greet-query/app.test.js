const request = require('supertest');
const app = require('./app');

describe('GET /greet', () => {
  test('uses the name query param', async () => {
    const res = await request(app).get('/greet').query({ name: 'Ada' });
    expect(res.status).toBe(200);
    expect(res.text).toBe('Hello, Ada!');
  });

  test('handles names with spaces', async () => {
    const res = await request(app)
      .get('/greet')
      .query({ name: 'Grace Hopper' });
    expect(res.text).toBe('Hello, Grace Hopper!');
  });

  test('falls back to "stranger" when name is missing', async () => {
    const res = await request(app).get('/greet');
    expect(res.status).toBe(200);
    expect(res.text).toBe('Hello, stranger!');
  });

  test('falls back to "stranger" when name is empty', async () => {
    const res = await request(app).get('/greet?name=');
    expect(res.text).toBe('Hello, stranger!');
  });

  test('responds with a text content-type', async () => {
    const res = await request(app).get('/greet').query({ name: 'Ada' });
    expect(res.headers['content-type']).toMatch(/^text\//);
  });
});
