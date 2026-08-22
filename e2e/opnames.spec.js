import { test, expect } from '@playwright/test';
import { toets } from '../scripts/opnames.mjs';

// Geen browsertest, en met opzet toch hier: dit is de enige suite die de
// stubbundel binnenhaalt, en een gate die je apart moet aanroepen is precies
// wat deze repo twee keer eerder heeft laten liggen. Dus loopt hij mee met elke
// `npm run test:e2e`, lokaal en in CI.
//
// Wat hij vasthoudt: wat wij afspelen is wat er in de bundel staat. De vier
// bestanden onder `client/public/opgeslagen/` en onze kopie van het
// berichtschema zijn afgeleid, niet overgenomen — zie scripts/opnames.mjs.
test('wat de opgeslagen modus afspeelt komt uit de stubbundel', async () => {
  const { doelen, bevindingen } = toets();

  // Als de bundel niets oplevert, is deze test geen bewijs maar een lege
  // bewering. Dan hoort hij om te vallen.
  expect(doelen.length, 'de bundel hoort opnames en stamdata te leveren').toBeGreaterThan(0);

  expect(
    bevindingen.map((b) => `${b.soort}: ${b.tekst}`),
    'de afgeleide bestanden lopen uit de pas met .stub/bundel/'
  ).toEqual([]);
});
