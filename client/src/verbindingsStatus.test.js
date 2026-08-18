import { describe, it, expect } from 'vitest';
import { verbindingsStatus } from './verbindingsStatus.js';

describe('verbindingsStatus', () => {
  it('toont de opgeslagen modus als zodanig, ook als er toevallig geen verbinding is', () => {
    expect(verbindingsStatus({ bron: 'gestopt', connected: false, verbindingWeg: true }).klasse).toBe('opgeslagen');
  });

  it('is verbonden zolang de stream openstaat', () => {
    expect(verbindingsStatus({ bron: 'live', connected: true, verbindingWeg: false }).klasse).toBe('verbonden');
  });

  // Er is geen rusttoestand tussen runs meer — de stream staat de hele sessie
  // open. Wat overblijft is het gaatje tussen verbinden en verbonden zijn.
  it('onderscheidt een weggevallen verbinding van een die nog aan het opengaan is', () => {
    expect(verbindingsStatus({ bron: 'live', connected: false, verbindingWeg: true }).klasse).toBe('weg');
    expect(verbindingsStatus({ bron: 'live', connected: false, verbindingWeg: false }).klasse).toBe('gereed');
  });

  // Nooit verbonden geweest is geen storing tijdens het kijken maar een
  // showcase-CBT die er niet is. "Weggevallen" zou beweren dat er iets was.
  it('noemt een verbinding die nooit tot stand kwam niet weggevallen', () => {
    const status = verbindingsStatus({
      bron: 'live',
      connected: false,
      verbindingWeg: false,
      nietBereikbaar: true,
    });
    expect(status.klasse).toBe('weg');
    expect(status.tekst).toBe('showcase-CBT niet bereikbaar');
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
