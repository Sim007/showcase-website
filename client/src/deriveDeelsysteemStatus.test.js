import { describe, it, expect } from 'vitest';
import { deriveDeelsysteemStatus } from './deriveDeelsysteemStatus.js';

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
