import { test, expect } from '@playwright/test';

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
