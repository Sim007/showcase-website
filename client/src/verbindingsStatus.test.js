import { describe, it, expect } from 'vitest';
import { verbindingsStatus } from './verbindingsStatus.js';

describe('verbindingsStatus', () => {
  it('toont de opgeslagen modus als zodanig, ook als er toevallig geen verbinding is', () => {
    expect(verbindingsStatus({ bron: 'gestopt', connected: false, verbindingWeg: true }).klasse).toBe('opgeslagen');
  });

  it('is verbonden zolang de stream openstaat', () => {
    expect(verbindingsStatus({ bron: 'live', connected: true, verbindingWeg: false }).klasse).toBe('verbonden');
  });

  it('onderscheidt een weggevallen verbinding van de rusttoestand tussen runs', () => {
    expect(verbindingsStatus({ bron: 'live', connected: false, verbindingWeg: true }).klasse).toBe('weg');
    expect(verbindingsStatus({ bron: 'live', connected: false, verbindingWeg: false }).klasse).toBe('gereed');
  });

  it('noemt showcase-CBT niet "gereed" als de stamdata uit de lokale kopie kwam', () => {
    const status = verbindingsStatus({
      bron: 'live',
      connected: false,
      verbindingWeg: false,
      stamdataUitLokaleKopie: true,
    });
    expect(status.klasse).toBe('weg');
    expect(status.tekst).toContain('niet bereikbaar');
  });
});
