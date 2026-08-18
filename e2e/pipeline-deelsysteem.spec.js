import { test, expect } from '@playwright/test';
import { haalStamdata, verwachteKolommen, verwachteSwimlanes } from './stamdata.js';

// Regressietests voor de swimlanes: elk deelsysteem is een eigen horizontale rij
// over alle omgevingskolommen, zodat bv. alle Order-stappen op dezelfde hoogte
// beginnen. Wat er precies in staat komt uit de stamdata en niet uit deze test —
// zie `stamdata.js` voor waarom.

const SCENARIO = '01';

test('het rooster volgt de stamdata: kolommen zijn de omgevingen, rijen de deelsystemen', async ({ page, request }) => {
  const scenario = await haalStamdata(request, SCENARIO);
  await page.goto(`/scenario/${SCENARIO}`);

  await expect(page.locator('.graph-row-header')).toBeVisible();
  await expect(page.locator('.col-head')).toHaveText(verwachteKolommen(scenario));

  const swimlanes = verwachteSwimlanes(scenario);
  await expect(page.locator('.swimlane')).toHaveCount(swimlanes.length);

  for (const [i, lane] of swimlanes.entries()) {
    const rij = page.locator('.swimlane').nth(i);
    await expect(rij, `swimlane ${i} hoort ds-${lane.id} te zijn`).toHaveClass(new RegExp(`\\bds-${lane.id}\\b`));
    const label = rij.locator('.lane-label h5');
    if (lane.naam) {
      // Het contract levert de naam mee, dus die hoort er te staan — niet een
      // naam die wij ergens apart bijhouden.
      await expect(label).toHaveText(lane.naam);
    } else {
      // Een stap zonder deelsysteem spant over de keten. Het contract geeft die
      // geen naam, dus we eisen alleen dat er iets leesbaars staat.
      await expect(label).not.toHaveText('');
    }
  }
});

test('elke stap uit de stamdata staat precies één keer in het rooster', async ({ page, request }) => {
  const scenario = await haalStamdata(request, SCENARIO);
  await page.goto(`/scenario/${SCENARIO}`);

  const nummers = await page.locator('.graph .node .nr').allTextContents();
  expect(nummers.map((t) => t.trim())).toEqual(scenario.stappen.map((s) => `#${s.nummer}`));
});

test('de deelsystemen-banner toont de deelsystemen uit de stamdata, allemaal aan', async ({ page, request }) => {
  const scenario = await haalStamdata(request, SCENARIO);
  await page.goto(`/scenario/${SCENARIO}`);

  // De keten staat niet in de banner: die is geen deelsysteem dat je kunt
  // verbergen, maar de stappen die er dwars over lopen.
  const teTonen = verwachteSwimlanes(scenario).filter((l) => l.naam !== null);

  const banner = page.locator('.deelsystemen-banner');
  await expect(banner.locator('.ds-pill')).toHaveText(teTonen.map((l) => l.naam));
  for (const lane of teTonen) {
    await expect(banner.getByRole('checkbox', { name: lane.naam })).toBeChecked();
  }
});

test('een deelsysteem uitvinken verbergt die swimlane, opnieuw aanvinken toont hem weer', async ({ page, request }) => {
  const scenario = await haalStamdata(request, SCENARIO);
  const eerste = verwachteSwimlanes(scenario).find((l) => l.naam !== null);

  await page.goto(`/scenario/${SCENARIO}`);
  const pil = page.locator('.deelsystemen-banner .ds-pill', { hasText: eerste.naam });
  const vakje = pil.getByRole('checkbox');
  const lane = page.locator(`.swimlane.ds-${eerste.id}`);

  await expect(lane).toBeVisible();

  await vakje.uncheck();
  await expect(lane).toHaveCount(0);
  await expect(pil).toHaveClass(/ds-pill-off/);
  // De andere swimlanes blijven staan: verbergen is een keuze over één
  // deelsysteem, niet over het beeld.
  await expect(page.locator('.swimlane')).toHaveCount(verwachteSwimlanes(scenario).length - 1);

  await vakje.check();
  await expect(lane).toBeVisible();
  await expect(pil).not.toHaveClass(/ds-pill-off/);
});

test('rapport-knop leidt naar een losse rapportpagina met Deelsysteem-kolom', async ({ page, request }) => {
  const scenario = await haalStamdata(request, SCENARIO);
  await page.goto(`/scenario/${SCENARIO}`);
  await expect(page.locator('.report-table')).toHaveCount(0);

  await page.getByRole('link', { name: 'Rapport' }).click();
  await expect(page).toHaveURL(new RegExp(`/scenario/${SCENARIO}/rapport$`));

  const tabel = page.locator('.report-table');
  await expect(tabel).toBeVisible();
  await expect(tabel.locator('th', { hasText: 'Deelsysteem' })).toBeVisible();
  await expect(tabel.locator('tbody tr')).toHaveCount(scenario.stappen.length);

  const eersteLane = verwachteSwimlanes(scenario)[0];
  if (eersteLane.naam) {
    await expect(tabel.locator('tbody tr').first().locator('td.deelsysteem')).toHaveText(eersteLane.naam);
  }

  await page.getByRole('link', { name: new RegExp(`scenario ${SCENARIO}`) }).click();
  await expect(page).toHaveURL(new RegExp(`/scenario/${SCENARIO}$`));
});
