import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SCRIPTS_DIR = path.join(__dirname, 'simulator-scripts');

// Het interne script waarmee de simulator showcase-CBT naspeelt: per stap-nr
// de cli-regel, de uitkomst en de bijzonderheden. Dit is geen stamdata en
// gaat nooit rechtstreeks naar de website — alleen de simulator (zie
// adapter/index.js) leest dit, om de stream te vullen.
export function getScript(id) {
  const file = path.join(SCRIPTS_DIR, `hoofdstuk-${id}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}
