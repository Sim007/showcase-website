import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listScenarios, getScenario } from './adapter/scenarioStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const CONTENT_DIR = path.join(__dirname, '..', '..', 'content');

export function createApp() {
  const app = express();
  app.use(cors());

  app.get('/api/hoofdstukken', (req, res) => {
    res.json(listScenarios());
  });

  app.get('/api/hoofdstukken/:id', (req, res) => {
    const data = getScenario(req.params.id);
    if (!data) return res.status(404).json({ error: 'onbekend hoofdstuk' });
    res.json(data);
  });

  app.get('/api/content/intro', (req, res) => {
    const file = path.join(CONTENT_DIR, 'intro.md');
    if (!fs.existsSync(file)) return res.status(404).json({ error: 'intro.md ontbreekt' });
    res.json({ markdown: fs.readFileSync(file, 'utf-8') });
  });

  app.get('/api/content/showcases', (req, res) => {
    const file = path.join(CONTENT_DIR, 'showcases.json');
    if (!fs.existsSync(file)) return res.status(404).json({ error: 'showcases.json ontbreekt' });
    res.json(JSON.parse(fs.readFileSync(file, 'utf-8')));
  });

  return app;
}
