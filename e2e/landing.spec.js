import { test, expect } from '@playwright/test';
import { haalStamdata } from './stamdata.js';

// Geen scenarionummer in deze specs: welke tegels er zijn en welke op "werkt"
// staan is inhoud (`content/showcases.json`), en die verandert per MVP. Wat niet
// verandert is de regel — een tegel die zegt dat hij werkt, linkt door naar zijn
// eigen scenario, en een tegel die dat niet zegt, linkt nergens naar.

test('elke tegel zegt of hij werkt, en alleen die tegels zijn een link', async ({ page }) => {
  await page.goto('/');

  const tegels = page.locator('.tile');
  await expect(tegels.first()).toBeVisible();

  const standen = await tegels.evaluateAll((els) =>
    els.map((el) => ({
      clickable: el.dataset.clickable === 'true',
      badge: el.querySelector('.badge')?.textContent?.trim() ?? null,
      isLink: el.tagName === 'A',
      href: el.getAttribute('href'),
      nr: el.querySelector('.nr')?.textContent?.trim() ?? null,
    }))
  );

  expect(standen.length).toBeGreaterThan(0);
  for (const tegel of standen) {
    expect(tegel.badge, `tegel ${tegel.nr} heeft geen badge`).toBeTruthy();
    // De badge en de aanklikbaarheid moeten hetzelfde zeggen. Zeggen ze iets
    // anders, dan belooft de pagina iets wat ze niet doet — precies wat een
    // demo als eerste tegenkomt.
    expect(tegel.isLink, `tegel ${tegel.nr} met badge "${tegel.badge}"`).toBe(tegel.clickable);
    if (tegel.clickable) expect(tegel.href).toBeTruthy();
    else expect(tegel.href).toBeNull();
  }
});

// De harde eis achter deze test: een werkt-tegel komt uit bij hét scenario dat
// erop staat. Levert showcase-CBT de stappen van een ander scenario, dan meldt
// de pagina dat wel, maar dan is de tegel een belofte die niet klopt en hoort de
// suite dat te zeggen.
test('een werkt-tegel komt uit bij het scenario dat erop staat', async ({ page }) => {
  await page.goto('/');

  const werkt = page.locator('.tile[data-clickable="true"]').first();
  await expect(werkt).toBeVisible();

  const nummer = (await werkt.locator('.nr').textContent()).trim().replace(/^Scenario\s+/, '');
  await werkt.click();

  await expect(page).toHaveURL(new RegExp(`/scenario/${nummer}$`));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(new RegExp(`^Scenario ${nummer}\\b`));
  await expect(page.locator('.melding', { hasText: /leverde de stappen van scenario/ })).toHaveCount(0);
});

// Openen is niet de hele belofte. Squad 1 heeft gemeten dat
// `POST /v1/runs {"scenarioId":"00"}` een 201 met `scenarioId: "01"` teruggeeft:
// de stub kijkt niet naar het gevraagde id, hij speelt de volgende opname uit de
// rotatie, en de opnames zijn niet per scenario gesplitst. Wij hebben dat hier
// nagemeten tegen bundel 0.11.0 — zelfde uitkomst.
//
// Vandaag valt dat nog op de vorige test op: `GET /v1/scenarios/00` levert óók de
// stamdata van 01, dus de mismatch-melding staat er. Bij bundel 0.12.0 wordt de
// stamdata per id gesplitst en verdwijnt precies dat signaal — 00 opent dan met
// eigen titel en eigen 19 stappen, terwijl starten nog steeds 01 speelt. Dat is
// het moment waarop een tegel er werkend uitziet en het niet is.
//
// Vandaar deze grens, en niet een afspraak in een document: een tegel mag pas
// "werkt" zeggen als starten óók een run voor dát scenario oplevert. Zet iemand
// 00 op "werkt" voordat de opnames gesplitst zijn, dan valt deze test om en zegt
// waarom.
test('een werkt-tegel start het scenario dat erop staat, niet een ander', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('.tile').first()).toBeVisible();

  const nummers = await page.locator('.tile[data-clickable="true"] .nr').evaluateAll((els) =>
    els.map((el) => el.textContent.trim().replace(/^Scenario\s+/, ''))
  );
  expect(nummers.length, 'er hoort minstens één werkt-tegel te zijn').toBeGreaterThan(0);

  // Elke werkt-tegel kost een hele run, dus het budget schaalt mee met hoeveel
  // er "werkt" zeggen in plaats van met een rond getal dat bij één tegel ruim is.
  test.setTimeout(60_000 + nummers.length * 120_000);

  for (const nr of nummers) {
    const scenario = await haalStamdata(request, nr);
    await page.goto(`/scenario/${nr}`);
    await expect(page.locator('.verbinding')).toHaveText('verbonden met showcase-CBT');

    const knop = page.locator('button.primary');
    await knop.click();

    // De 201 zegt welke run begon. Is dat een ander scenario dan de tegel
    // belooft, dan staat hier "wacht op ander scenario" — dat is het geval
    // waarvoor deze test bestaat.
    await expect(
      knop,
      `tegel ${nr} zegt "werkt", maar starten leverde een run voor een ander scenario`
    ).toHaveText('bezig...');

    await expect(knop).toHaveText('Start scenario', {
      timeout: 20_000 + scenario.stappen.length * 3_000,
    });

    // En de stream is op de stappen van dít scenario geland. Welke uitkomsten
    // dat zijn hangt van de rotatie af en staat hier dus niet; dat er überhaupt
    // gejoind is, wel. Bij een run voor een ander scenario blijft elke stap
    // wachtend, want `usePipelineRun` koppelt de stream alleen als het
    // scenario-id van de run bij de stamdata past.
    const stappen = page.locator('.graph .node .shape');
    const wachtend = page.locator('.graph .node .shape.status-wachtend');
    expect(
      await wachtend.count(),
      `tegel ${nr}: geen enkele stap kreeg een uitkomst, dus de run ging niet over dit scenario`
    ).toBeLessThan(await stappen.count());
  }
});
