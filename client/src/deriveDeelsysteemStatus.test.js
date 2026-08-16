import { describe, it, expect } from 'vitest';
import { deriveDeelsysteemStatus, deelsysteemIsGestopt } from './deriveDeelsysteemStatus.js';

describe('deelsysteemIsGestopt', () => {
  it('is onwaar zolang de run niet is opgehouden', () => {
    const stappen = [{ uitkomst: 'groen' }, { uitkomst: 'rood' }];
    expect(deelsysteemIsGestopt(stappen, false)).toBe(false);
  });

  it('is waar voor het deelsysteem waarvan een stap mislukte', () => {
    const stappen = [{ uitkomst: 'groen' }, { uitkomst: 'groen' }, { uitkomst: 'rood' }];
    expect(deelsysteemIsGestopt(stappen, true)).toBe(true);
  });

  it('is waar voor een deelsysteem dat door die mislukking nooit aan de beurt kwam', () => {
    const stappen = [{ uitkomst: 'niet-uitgevoerd' }, { uitkomst: 'niet-uitgevoerd' }];
    expect(deelsysteemIsGestopt(stappen, true)).toBe(true);
  });

  it('is onwaar als dit deelsysteem al zijn stappen groen had voordat de run ophield', () => {
    const stappen = [{ uitkomst: 'groen' }, { uitkomst: 'groen' }];
    expect(deelsysteemIsGestopt(stappen, true)).toBe(false);
  });
});

describe('deriveDeelsysteemStatus', () => {
  it('is nog-niet-gestart als geen enkele stap iets anders dan wachtend is', () => {
    const stappen = [{ uitkomst: 'wachtend' }, { uitkomst: 'wachtend' }];
    expect(deriveDeelsysteemStatus(stappen, false)).toBe('nog-niet-gestart');
  });

  it('is nog-niet-gestart bij een lege stappenlijst', () => {
    expect(deriveDeelsysteemStatus([], false)).toBe('nog-niet-gestart');
  });

  it('is lopend zodra een stap gestart is maar niet alles groen of gestopt is', () => {
    const stappen = [{ uitkomst: 'groen' }, { uitkomst: 'lopend' }, { uitkomst: 'wachtend' }];
    expect(deriveDeelsysteemStatus(stappen, false)).toBe('lopend');
  });

  it('is succesvol-afgerond als alle stappen groen zijn', () => {
    const stappen = [{ uitkomst: 'groen' }, { uitkomst: 'groen' }];
    expect(deriveDeelsysteemStatus(stappen, false)).toBe('succesvol-afgerond');
  });

  it('is gestopt zodra het expliciete stopsignaal binnen is, ook als niet elke stap dat al toont', () => {
    const stappen = [{ uitkomst: 'groen' }, { uitkomst: 'rood' }, { uitkomst: 'lopend' }];
    expect(deriveDeelsysteemStatus(stappen, true)).toBe('gestopt');
  });

  it('gestopt weegt zwaarder dan de eigen stapuitkomsten', () => {
    const stappen = [{ uitkomst: 'groen' }, { uitkomst: 'groen' }];
    expect(deriveDeelsysteemStatus(stappen, true)).toBe('gestopt');
  });
});
