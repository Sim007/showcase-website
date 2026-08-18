// Haalt de showcase-cbt stubbundel op en pakt hem uit in .stub/, zodat de
// e2e-suite hem kan starten zonder dat iemand hem met de hand neerzet.
//
// De versie én de checksum staan hier vastgepind, niet alleen de versie. Het
// .sha256-bestand komt uit dezelfde release als de tgz, dus alleen dáártegen
// toetsen bewijst niets over welke bundel je hebt; het bewijst alleen dat de
// twee bij elkaar horen. Wie de bundel bumpt, verandert dus twee regels, en dat
// is precies de bedoeling: "waartegen is dit getoetst" moet in de repo staan en
// niet in het geheugen van wie het draaide.
//
// Idempotent: staat de juiste bundel er al, dan doet dit niets. Daarom kan het
// gewoon vóór elke testrun aan.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const VERSIE = '0.11.0';
const SHA256 = '9bc2e03530abf444dd8788182a41e7be0977be2aef1784b454bba0b8fe4b7ddd';

const wortel = join(dirname(fileURLToPath(import.meta.url)), '..');
const doel = join(wortel, '.stub');
const stempel = join(doel, 'versie.txt');
const stub = join(doel, 'bundel', 'stub.js');
const naam = `stubbundel-${VERSIE}.tgz`;
const basis = `https://github.com/Sim007/showcase-cbt/releases/download/stubbundel-${VERSIE}`;

function alGoed() {
  if (!existsSync(stub) || !existsSync(stempel)) return false;
  return readFileSync(stempel, 'utf8').trim() === `${VERSIE} ${SHA256}`;
}

if (alGoed()) {
  console.log(`stubbundel ${VERSIE} staat al klaar in .stub/`);
  process.exit(0);
}

console.log(`stubbundel ${VERSIE} ophalen...`);
const res = await fetch(`${basis}/${naam}`);
if (!res.ok) {
  console.error(`kon ${naam} niet ophalen: HTTP ${res.status}`);
  console.error(`verwacht op ${basis}/${naam}`);
  process.exit(1);
}
const tgz = Buffer.from(await res.arrayBuffer());

const gemeten = createHash('sha256').update(tgz).digest('hex');
if (gemeten !== SHA256) {
  // Niet doorgaan en niet opruimen-en-zwijgen: dit is óf een andere bundel dan
  // waartegen deze suite geschreven is, óf onderweg iets misgegaan. Beide
  // gevallen horen de run te stoppen.
  console.error(`checksum klopt niet voor ${naam}`);
  console.error(`  verwacht: ${SHA256}`);
  console.error(`  gemeten : ${gemeten}`);
  process.exit(1);
}

rmSync(doel, { recursive: true, force: true });
mkdirSync(doel, { recursive: true });
writeFileSync(join(doel, naam), tgz);
try {
  // Uitpakken vanuit .stub met een relatieve naam, niet met een absoluut pad:
  // GNU tar leest "C:\..." als host:pad en probeert dan een netwerkverbinding
  // met host "C" te maken. Met -C zou dat ook gebeuren, dus gaat het pad hier
  // helemaal niet mee.
  execFileSync('tar', ['-xzf', naam], { cwd: doel, stdio: 'inherit' });
} catch (fout) {
  console.error(`uitpakken van ${naam} mislukte: ${fout.message}`);
  console.error('is `tar` beschikbaar op het pad?');
  process.exit(1);
}
rmSync(join(doel, naam), { force: true });

if (!existsSync(stub)) {
  console.error(`bundel uitgepakt maar ${stub} ontbreekt — is de indeling gewijzigd?`);
  process.exit(1);
}

writeFileSync(stempel, `${VERSIE} ${SHA256}\n`);
console.log(`stubbundel ${VERSIE} staat klaar in .stub/`);
