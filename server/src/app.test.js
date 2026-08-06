import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';

const app = createApp();

describe('GET /api/hoofdstukken', () => {
  it('lists every known hoofdstuk with id, titel and stap-count', async () => {
    const res = await request(app).get('/api/hoofdstukken');
    expect(res.status).toBe(200);
    const ids = res.body.map((h) => h.id);
    expect(ids).toEqual(['00', '01']);
    expect(res.body[0]).toMatchObject({ titel: expect.any(String), stappen: expect.any(Number) });
  });
});

describe('GET /api/hoofdstukken/:id', () => {
  it('returns de stamdata inclusief het deelsysteem-veld per stap', async () => {
    const res = await request(app).get('/api/hoofdstukken/01');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('01');
    expect(res.body.stappen.length).toBeGreaterThan(0);
    expect(res.body.stappen.every((s) => 'deelsysteem' in s)).toBe(true);
    expect(res.body.stappen.map((s) => s.deelsysteem)).toContain('payment');
    expect(res.body.stappen.map((s) => s.deelsysteem)).toContain('order');
  });

  it('bevat geen uitkomst, bijzonderheden of cli — die ontstaan tijdens de run, niet in de stamdata', async () => {
    const res = await request(app).get('/api/hoofdstukken/01');
    for (const stap of res.body.stappen) {
      expect(stap).not.toHaveProperty('uitkomst');
      expect(stap).not.toHaveProperty('bijzonderheden');
      expect(stap).not.toHaveProperty('cli');
    }
  });

  it('404s for an unknown hoofdstuk id', async () => {
    const res = await request(app).get('/api/hoofdstukken/99');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeTruthy();
  });
});

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
