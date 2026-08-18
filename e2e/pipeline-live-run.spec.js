import { test, expect } from '@playwright/test';

// De server deelt één run-state over alle verbonden clients (zie README —
// "Eén run tegelijk gedeeld"). Dit is de enige spec die daadwerkelijk een
// run start, zodat hij niet kan botsen met een start-poging uit een andere
// spec. Scenario 00 heeft de minste stappen (20) en is dus het snelst.
test.describe.configure({ mode: 'serial' });

test('starting a run walks every step from wachtend to groen', async ({ page }) => {
  test.setTimeout(90_000);

  await page.goto('/scenario/00');

  const step1 = page.locator('.node').filter({ has: page.locator('.nr', { hasText: /^#1$/ }) });
  const step20 = page.locator('.node').filter({ has: page.locator('.nr', { hasText: /^#20$/ }) });
  const startButton = page.locator('button.primary');

  // Er is geen resetknop meer: starten ís de reset. Een vers geladen pagina
  // verbindt meteen, maar zolang er niets loopt draagt de momentopname
  // `run: null` en staat alles dus nog op wachtend.
  await expect(step1.locator('.shape')).toHaveClass(/status-wachtend/);

  await startButton.click();
  await expect(startButton).toBeDisabled();
  await expect(startButton).toHaveText('bezig...');

  // eerste stap doorloopt lopend -> groen
  await expect(step1.locator('.shape')).toHaveClass(/status-lopend/, { timeout: 5_000 });
  await expect(step1.locator('.shape')).toHaveClass(/status-groen/, { timeout: 5_000 });
  await expect(page.locator('.cli-panel')).toContainText('ci/pipeline-microservice.sh payment payment-api');

  // hele run loopt door tot en met de laatste stap (gebruikersflow, keten)
  await expect(step20.locator('.shape')).toHaveClass(/status-groen/, { timeout: 60_000 });
  await expect(startButton).toHaveText('Start scenario');
  await expect(startButton).toBeEnabled();
});
