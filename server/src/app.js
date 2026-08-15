import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const CONTENT_DIR = path.join(__dirname, '..', '..', 'content');

// De eigen server levert alleen nog content die niet uit het contract komt
// (beheerd door de testconsultant). Scenario's en runs komen rechtstreeks
// van showcase-CBT of de stub — geen proxy hier, zie context.md
// "Architectuurprincipe showcase-website".
export function createApp() {
  const app = express();
  app.use(cors());

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
