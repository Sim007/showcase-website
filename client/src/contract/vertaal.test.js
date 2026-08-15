import { describe, it, expect } from 'vitest';
import { vertaalUitkomst, vertaalStap } from './vertaal.js';

describe('vertaalUitkomst', () => {
  it('vertaalt geslaagd/mislukt naar groen/rood', () => {
    expect(vertaalUitkomst('geslaagd')).toBe('groen');
    expect(vertaalUitkomst('mislukt')).toBe('rood');
  });

  it('laat een onbekende waarde ongewijzigd door in plaats van te crashen', () => {
    expect(vertaalUitkomst('twijfelachtig')).toBe('twijfelachtig');
  });

  it('laat null/undefined ongemoeid', () => {
    expect(vertaalUitkomst(undefined)).toBeUndefined();
  });
});

describe('vertaalStap', () => {
  it('hernoemt nummer/omschrijving naar nr/stap', () => {
    const stap = vertaalStap({ nummer: 3, type: 'gate', omschrijving: 'Contractverificatie', deelsysteem: 'payment', omgeving: 'ci', testsoort: 'contract', gereedschap: 'Schemathesis', cli: 'ci/x.sh' });
    expect(stap).toMatchObject({ nr: 3, stap: 'Contractverificatie', deelsysteem: 'payment', omgeving: 'ci' });
  });

  it('vertaalt een afwezig deelsysteem naar keten', () => {
    const stap = vertaalStap({ nummer: 6, type: 'gate', omschrijving: 'De gebruikersflows over de keten', omgeving: 'acceptatie', testsoort: 'e2e', gereedschap: 'Playwright', cli: 'ci/x.sh' });
    expect(stap.deelsysteem).toBe('keten');
  });

  it('vertaalt een afwezige omgeving naar code', () => {
    const stap = vertaalStap({ nummer: 1, type: 'actie', omschrijving: 'Unittests', deelsysteem: 'payment', testsoort: 'unit', gereedschap: 'Maven', cli: 'ci/x.sh' });
    expect(stap.omgeving).toBe('code');
  });
});
