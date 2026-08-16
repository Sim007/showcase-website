import { test, expect } from '@playwright/test';

// De server deelt één run-state over alle verbonden clients (zie README —
// "Eén run tegelijk gedeeld"). Dit is de enige spec die daadwerkelijk een
// run start, zodat hij niet kan botsen met een start-poging uit een andere
// spec. Scenario 00 heeft de minste stappen (20) en is dus het snelst.
test.describe.configure({ mode: 'serial' });

test('starting a run walks every step from wachtend to groen and can be reset', async ({ page }) => {
  test.setTimeout(90_000);

  await page.goto('/scenario/00');

  const step1 = page.locator('.node').filter({ has: page.locator('.nr', { hasText: /^#1$/ }) });
  const step20 = page.locator('.node').filter({ has: page.locator('.nr', { hasText: /^#20$/ }) });
  const startButton = page.locator('button.primary');
  const resetButton = page.getByRole('button', { name: 'reset' });

  // een eerdere, niet-gereset run (bv. een gebruiker die zelf op de site
  // klikte) mag deze test niet laten falen — begin altijd bij idle.
  if (await resetButton.isEnabled()) {
    await resetButton.click();
  }
  await expect(step1.locator('.shape')).toHaveClass(/status-wachtend/);

  try {
    await startButton.click();
    await expect(startButton).toBeDisabled();
    await expect(startButton).toHaveText('bezig...');

    // eerste stap doorloopt lopend -> groen
    await expect(step1.locator('.shape')).toHaveClass(/status-lopend/, { timeout: 5_000 });
    await expect(step1.locator('.shape')).toHaveClass(/status-groen/, { timeout: 5_000 });
    await expect(page.locator('.cli-panel')).toContainText('ci/pipeline-microservice.sh payment payment-api');

    // hele run loopt door tot en met de laatste stap (gebruikersflow, keten)
    await expect(step20.locator('.shape')).toHaveClass(/status-groen/, { timeout: 60_000 });
    await expect(startButton).toHaveText('Start scenario 00');
    await expect(startButton).toBeEnabled();
  } finally {
    // laat de gedeelde server-state idle achter voor de volgende test/gebruiker
    if (await resetButton.isEnabled()) {
      await resetButton.click();
      await expect(step1.locator('.shape')).toHaveClass(/status-wachtend/);
    }
  }
});
