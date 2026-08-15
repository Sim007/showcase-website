import { describe, it, expect } from 'vitest';
import { valideerBericht } from './schema.js';

describe('valideerBericht', () => {
  it('keurt een geldig stap-afgerond-bericht goed', () => {
    const bericht = { soort: 'stap-afgerond', tijd: '2026-08-06T09:12:48Z', runId: 'run-7c41a9', stapNummer: 1, uitkomst: 'geslaagd' };
    expect(valideerBericht(bericht)).toEqual({ ok: true });
  });

  it('slaat een onbekend berichttype over zonder fout', () => {
    const bericht = { soort: 'deelsysteem-overgeslagen', tijd: '2026-08-06T09:12:55Z', runId: 'run-7c41a9', deelsysteem: 'order' };
    expect(valideerBericht(bericht)).toMatchObject({ ok: false, reden: 'onbekend-berichttype' });
  });

  it('accepteert een onbekend veld op een verder geldig bericht (additiviteit)', () => {
    const bericht = { soort: 'run-gestart', tijd: '2026-08-06T09:12:44Z', runId: 'run-7c41a9', scenarioId: '01', herkomst: 'toekomstige-versie' };
    expect(valideerBericht(bericht)).toEqual({ ok: true });
  });

  it('accepteert een onbekende reden-waarde op run-afgerond (geen enum-afdwinging)', () => {
    const bericht = { soort: 'run-afgerond', tijd: '2026-08-06T09:12:55Z', runId: 'run-7c41a9', reden: 'gestopt-door-beheerder', gestoptBijStap: 3 };
    expect(valideerBericht(bericht)).toEqual({ ok: true });
  });

  it('keurt een bekend berichttype met een ontbrekend verplicht veld af', () => {
    const bericht = { soort: 'stap-afgerond', tijd: '2026-08-06T09:12:48Z', runId: 'run-7c41a9', stapNummer: 1 };
    expect(valideerBericht(bericht)).toMatchObject({ ok: false, reden: 'ongeldige-vorm' });
  });
});
