import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';

const app = createApp();

describe('GET /api/content/intro', () => {
  it('returns the intro markdown', async () => {
    const res = await request(app).get('/api/content/intro');
    expect(res.status).toBe(200);
    expect(typeof res.body.markdown).toBe('string');
    expect(res.body.markdown.length).toBeGreaterThan(0);
  });
});

describe('GET /api/content/showcases', () => {
  it('returns the showcase tile list', async () => {
    const res = await request(app).get('/api/content/showcases');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toMatchObject({ id: expect.any(String), titel: expect.any(String), status: expect.any(String) });
  });
});
