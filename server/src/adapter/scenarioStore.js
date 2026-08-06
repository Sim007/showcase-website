import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SCENARIOS_DIR = path.join(__dirname, '..', 'scenarios');

// Stamdata: de structuur van een scenario vóór een run — scenario, omgevingen
// (impliciet, via de stappen), deelsystemen en stappen. Geen `uitkomst`,
// `bijzonderheden` of `cli`: die ontstaan tijdens de run en horen bij de
// stream (zie ../adapter/simulatorScripts.js voor waar de simulator die
// vandaan haalt).
export function listScenarios() {
  const files = fs.readdirSync(SCENARIOS_DIR).filter((f) => f.endsWith('.json'));
  return files
    .map((f) => JSON.parse(fs.readFileSync(path.join(SCENARIOS_DIR, f), 'utf-8')))
    .map((data) => ({
      id: data.id,
      titel: data.titel,
      ondertitel: data.ondertitel,
      stappen: data.stappen.length,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function getScenario(id) {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) return null;
  const file = path.join(SCENARIOS_DIR, `hoofdstuk-${id}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}
