import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { test, expect } from '@playwright/test';
import { haalStamdata } from './stamdata.js';

// Hier staan de uitkomsten wél vast, en dat kan omdat wíj de opname kiezen in
// plaats van de rotatie van de stub. Een opgeslagen run is een vastgelegde
// stream uit de stubbundel; welke stap omvalt is daarmee een eigenschap van een
// contractartefact en niet van handgeschreven inhoud.
//
// Dit is ook de modus die zonder showcase-CBT moet werken. Dat de stub hier toch
// draait, komt alleen doordat de stamdata van hem komt; de stream is een bestand.
const SCENARIO = '01';

// Hoe lang een opname duurt, staat in de opname. `opgeslagenBron.js` speelt hem
// af op de tijdstempels die erin staan, dus de speelduur is de tijdspanne van de
// vastgelegde run — vandaag 11 tot 20 seconden, en straks zoveel als een run van
// 19 of 27 stappen besloeg. Een vast getal hier zou dus precies omvallen op het
// moment dat de inhoud op sterkte komt, en dat is dezelfde fout als "20 stappen"
// in de oude suite. Vandaar: uitlezen wat erin staat.
const OPNAMES = join(dirname(fileURLToPath(import.meta.url)), '..', 'client', 'public', 'opgeslagen');

function speelduurMs(key) {
  const berichten = JSON.parse(readFileSync(join(OPNAMES, `${key}.json`), 'utf8'));
  const span = new Date(berichten.at(-1).tijd) - new Date(berichten[0].tijd);
  // Ruimte voor het laden van de opname en het hertekenen; nooit korter dan een
  // paar seconden, ook niet bij een opname van één seconde.
  return Math.max(15_000, span + 15_000);
}

async function standPerStap(page) {
  return page.locator('.graph .node').evaluateAll((nodes) =>
    nodes.map((n) => ({
      nr: Number(n.querySelector('.nr').textContent.trim().replace('#', '')),
      status: [...n.querySelector('.shape').classList].find((c) => c.startsWith('status-')),
    }))
  );
}

async function speelOpname(page, key) {
  await page.selectOption('.bron-select', key);
  await expect(page.locator('.verbinding')).toHaveText('opgeslagen run — geen live verbinding');
  await page.locator('button.primary').click();
  await expect(page.locator('button.primary')).toHaveText('bezig...');
  await expect(page.locator('button.primary')).toHaveText('Start scenario', { timeout: speelduurMs(key) });
}

test('de opname waarin alles slaagt maakt elke stap groen', async ({ page, request }) => {
  test.setTimeout(180_000);
  const scenario = await haalStamdata(request, SCENARIO);
  await page.goto(`/scenario/${SCENARIO}`);

  await speelOpname(page, 'voltooid');

  const stand = await standPerStap(page);
  expect(stand).toHaveLength(scenario.stappen.length);
  expect(stand.every((s) => s.status === 'status-groen')).toBe(true);
});

// De sterkste beat van de showcase, en de reden dat hij hier deterministisch
// staat in plaats van in de live-spec: een deelsysteem dat niets fout deed krijgt
// niets, en het dashboard zegt dat in plaats van het eeuwig te laten wachten.
test('de gestopte opname zet alles na de mislukte stap op niet uitgevoerd, ook een deelsysteem dat nooit begon', async ({ page, request }) => {
  test.setTimeout(180_000);
  const scenario = await haalStamdata(request, SCENARIO);
  await page.goto(`/scenario/${SCENARIO}`);

  await speelOpname(page, 'gestopt');

  const stand = await standPerStap(page);
  const gevallen = stand.find((s) => s.status === 'status-rood');
  expect(gevallen, 'de gestopte opname hoort precies één mislukte stap te hebben').toBeTruthy();
  expect(stand.filter((s) => s.status === 'status-rood')).toHaveLength(1);

  for (const stap of stand.filter((s) => s.nr < gevallen.nr)) {
    expect(stap.status, `stap ${stap.nr} vóór de mislukte stap`).toBe('status-groen');
  }
  for (const stap of stand.filter((s) => s.nr > gevallen.nr)) {
    expect(stap.status, `stap ${stap.nr} na de mislukte stap`).toBe('status-niet-uitgevoerd');
  }

  // Een deelsysteem waarvan geen enkele stap aan bod kwam, staat op gestopt en
  // niet op "nog niet gestart": er komt niets meer, en dat is een ander feit dan
  // "nog niet begonnen".
  const nummersPerDs = new Map();
  for (const stap of scenario.stappen) {
    const ds = stap.deelsysteem ?? 'keten';
    if (!nummersPerDs.has(ds)) nummersPerDs.set(ds, []);
    nummersPerDs.get(ds).push(stap.nummer);
  }
  const nooitBegonnen = [...nummersPerDs.entries()].filter(([, nrs]) => nrs.every((nr) => nr > gevallen.nr));
  expect(nooitBegonnen.length, 'deze opname hoort een deelsysteem te hebben dat nooit begon').toBeGreaterThan(0);
  for (const [ds] of nooitBegonnen) {
    await expect(page.locator(`.swimlane.ds-${ds} .ds-status`), `deelsysteem ${ds}`).toHaveText(/gestopt/);
  }

  // En het cli-paneel zegt waaróm die stappen leeg zijn, in plaats van ze weg te
  // laten alsof ze niet bestaan.
  await expect(page.locator('.cli-panel .result-niet-uitgevoerd').first()).toContainText(
    'pipeline van dit deelsysteem is gestopt'
  );
});

// De opname die middenin begint: de openingsmomentopname vult de al afgeronde
// stappen meteen in, zonder `run-gestart` ervoor. Dat is de plaat die een late
// kijker kreeg, en de enige plek waar dat geval nog te zien is.
test('de opname die bij een lopende run instapt is meteen compleet', async ({ page, request }) => {
  test.setTimeout(180_000);
  const scenario = await haalStamdata(request, SCENARIO);
  await page.goto(`/scenario/${SCENARIO}`);

  await page.selectOption('.bron-select', 'midden');
  await page.locator('button.primary').click();

  // Nog vóór het einde: de momentopname heeft de eerste stappen al gevuld en er
  // loopt er één, zonder dat wij die berichten gezien hebben.
  const lopend = page.locator('.graph .node .shape.status-lopend');
  await expect(lopend).toHaveCount(1, { timeout: speelduurMs('midden') });
  const tussenstand = await standPerStap(page);
  expect(tussenstand.some((s) => s.status === 'status-groen')).toBe(true);

  await expect(page.locator('button.primary')).toHaveText('Start scenario', { timeout: speelduurMs('midden') });
  const eindstand = await standPerStap(page);
  expect(eindstand).toHaveLength(scenario.stappen.length);
  expect(eindstand.every((s) => s.status === 'status-groen')).toBe(true);
});
