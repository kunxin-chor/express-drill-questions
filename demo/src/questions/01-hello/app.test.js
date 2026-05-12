const request = require('supertest');
const app = require('./app');

describe('GET /hello', () => {
  test('responds with status 200', async () => {
    const res = await request(app).get('/hello');
    expect(res.status).toBe(200);
  });

  test('body is exactly "hello world"', async () => {
    const res = await request(app).get('/hello');
    expect(res.text).toBe('hello world');
  });
});

describe('undefined routes', () => {
  test('GET / returns 404', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(404);
  });
});
