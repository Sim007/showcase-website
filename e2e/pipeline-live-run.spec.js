import { test, expect } from '@playwright/test';
import { haalStamdata } from './stamdata.js';

// De specs die een run tegen de stub starten en het verloop ervan naspelen.
// (`landing.spec.js` start er ook een, maar kijkt alleen of de gestarte run bij
// de tegel hoort.) Twee dingen maken deze specs bewust blind voor de inhoud van
// die run:
//
// 1. De stub roteert bij elke `POST /v1/runs` naar de volgende opname, en welke
//    dat is hangt af van hoeveel er in dit stubproces al gestart zijn. Een test
//    die "alles wordt groen" verwacht, klopt dus één op de drie keer.
// 2. Hoeveel stappen een scenario heeft is inhoud. De vorige versie van deze
//    spec verwachtte er twintig; er kwamen zes en de suite stond maanden rood.
//
// Wat hier wél vastligt is het gedrag dat voor élke opname en élk scenario geldt:
// een run loopt van wachtend naar een eindtoestand, laat niets halverwege staan,
// en de verbinding blijft erna open. De uitkomsten per opname staan in
// `pipeline-opgeslagen.spec.js`, waar wij kiezen welke opname speelt.
const SCENARIO = '01';

const EINDTOESTANDEN = ['status-groen', 'status-rood', 'status-niet-uitgevoerd'];

// De stub zendt live op een vast tempo van 400 ms per bericht (`TEMPO_MS` in
// stub.js — niet op de tijdstempels van de opname, wat het commentaar daar wél
// suggereert). Met drie berichten per stap is dat ruim een seconde per stap, dus
// schalen we mee met de stappenlijst in plaats van een rond getal te kiezen dat
// bij 6 stappen ruim was en bij 27 misschien niet.
const wachtOpEindeMs = (scenario) => 20_000 + scenario.stappen.length * 3_000;

async function standPerStap(page) {
  return page.locator('.graph .node').evaluateAll((nodes) =>
    nodes.map((n) => ({
      nr: Number(n.querySelector('.nr').textContent.trim().replace('#', '')),
      status: [...n.querySelector('.shape').classList].find((c) => c.startsWith('status-')),
    }))
  );
}

test('een verse sessie hangt aan de stream zonder dat er iets gestart is', async ({ page, request }) => {
  const scenario = await haalStamdata(request, SCENARIO);
  await page.goto(`/scenario/${SCENARIO}`);

  // Sinds run-stream 0.11.0 blijft de stream tussen runs open, dus verbinden
  // hoort bij het openen van de pagina en niet bij de startknop.
  await expect(page.locator('.verbinding')).toHaveText('verbonden met showcase-CBT');

  const stand = await standPerStap(page);
  expect(stand).toHaveLength(scenario.stappen.length);
  expect(stand.every((s) => s.status === 'status-wachtend')).toBe(true);
  await expect(page.locator('button.primary')).toHaveText('Start scenario');
  await expect(page.locator('button.primary')).toBeEnabled();
});

test('een run loopt van wachtend naar een eindtoestand en laat geen stap halverwege staan', async ({ page, request }) => {
  test.setTimeout(180_000);
  const scenario = await haalStamdata(request, SCENARIO);
  await page.goto(`/scenario/${SCENARIO}`);
  await expect(page.locator('.verbinding')).toHaveText('verbonden met showcase-CBT');

  const knop = page.locator('button.primary');
  await knop.click();

  // Zolang de run loopt is starten dicht: er kan er één tegelijk lopen, en een
  // tweede poging zou een 409 opleveren.
  await expect(knop).toHaveText('bezig...');
  await expect(knop).toBeDisabled();

  // Klaar is klaar zodra de knop weer open staat — dat is `run-afgerond`, en het
  // werkt voor een run die slaagt net zo goed als voor een die stopt.
  await expect(knop).toHaveText('Start scenario', { timeout: wachtOpEindeMs(scenario) });
  await expect(knop).toBeEnabled();

  const stand = await standPerStap(page);
  expect(stand).toHaveLength(scenario.stappen.length);

  // Niets blijft op "lopend" hangen: dat is een bewering dat er nú iets draait,
  // en na `run-afgerond` is die onwaar.
  expect(stand.filter((s) => s.status === 'status-lopend')).toHaveLength(0);
  expect(stand.some((s) => EINDTOESTANDEN.includes(s.status))).toBe(true);

  // Hier staat met opzet niet "geen enkele stap blijft wachtend". Eén van de drie
  // opnames is een run die bij stap 3 begint, en de stub knipt de
  // openingsmomentopname eraf zodra je over een bestaande verbinding start — die
  // eerste twee stappen krijgen dan nooit een bericht en blijven dus terecht
  // wachtend. Welke opname speelt weten we niet, dus die eis zou hier per
  // rotatiestand kloppen of niet. Deterministisch staat hij in
  // `pipeline-opgeslagen.spec.js`, waar wij de opname kiezen.

  // De domeinregel, voorwaardelijk zodat hij ook klopt voor een run waarin niets
  // mislukt: valt er een stap om, dan komt er daarna niets meer aan de beurt en
  // heet dat "niet uitgevoerd" en niet "wachtend".
  const gevallen = stand.find((s) => s.status === 'status-rood');
  if (gevallen) {
    for (const stap of stand.filter((s) => s.nr > gevallen.nr)) {
      expect(stap.status, `stap ${stap.nr} na de mislukte stap ${gevallen.nr}`).toBe('status-niet-uitgevoerd');
    }
  }

  // Het cli-paneel is geen samenvatting maar het transcript; na een run staat er
  // uitvoer in plaats van de wachtstand.
  await expect(page.locator('.cli-panel .empty')).toHaveCount(0);
  await expect(page.locator('.cli-panel .line').first()).toBeVisible();
});

test('de verbinding blijft na een afgeronde run open, zodat de volgende run erover kan', async ({ page, request }) => {
  test.setTimeout(180_000);
  const scenario = await haalStamdata(request, SCENARIO);
  await page.goto(`/scenario/${SCENARIO}`);
  const knop = page.locator('button.primary');

  await knop.click();
  await expect(knop).toHaveText('bezig...');
  await expect(knop).toHaveText('Start scenario', { timeout: wachtOpEindeMs(scenario) });

  // Tot 0.10.0 koppelden we hier zelf los, omdat de stream per run bestond.
  // Deden we dat nu nog, dan zou de sessie de volgende run niet meer zien.
  await expect(page.locator('.verbinding')).toHaveText('verbonden met showcase-CBT');
  await expect(knop).toBeEnabled();
});
