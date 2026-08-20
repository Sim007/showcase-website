import { describe, it, expect } from 'vitest';
import { ankerTijd, verstrekenSinds, absoluutLeesbaar } from './tijdWeergave.js';

// De fixtures uit de stubbundel staan op 2026-08-06 09:12. Het rapport zette die
// waarde ruw in de tijdkolom, dus een run van vandaag toonde de datum van de
// opname. Deze functies zetten dat om in "hoe lang na de start", wat waar is voor
// een live run en voor een afgespeelde opname.
const STAPPEN = [
  { nr: 1, tijd: '2026-08-06T09:12:48Z' },
  { nr: 2, tijd: '2026-08-06T09:12:51Z' },
  { nr: 3, tijd: '2026-08-06T09:13:54Z' },
];

describe('ankerTijd', () => {
  it('neemt het vroegste tijdstempel dat we hebben', () => {
    expect(ankerTijd(STAPPEN)).toBe('2026-08-06T09:12:48Z');
  });

  it('kijkt naar de tijden en niet naar de volgorde in de lijst', () => {
    expect(ankerTijd([...STAPPEN].reverse())).toBe('2026-08-06T09:12:48Z');
  });

  // Een momentopname draagt geen tijd per afgeronde stap, dus die stappen hebben
  // er geen. Dan is het anker de eerste stap waarvan we het wél weten.
  it('slaat stappen zonder tijd over', () => {
    expect(ankerTijd([{ nr: 1, tijd: undefined }, { nr: 2, tijd: '2026-08-06T09:12:51Z' }]))
      .toBe('2026-08-06T09:12:51Z');
  });

  it('geeft niets terug als geen enkele stap een tijd heeft', () => {
    expect(ankerTijd([{ nr: 1 }, { nr: 2 }])).toBeNull();
    expect(ankerTijd([])).toBeNull();
    expect(ankerTijd()).toBeNull();
  });
});

describe('verstrekenSinds', () => {
  it('rekent seconden na de start uit', () => {
    expect(verstrekenSinds('2026-08-06T09:12:48Z', '2026-08-06T09:12:51Z')).toBe('+0:03');
  });

  it('rekent over de minuut heen door', () => {
    expect(verstrekenSinds('2026-08-06T09:12:48Z', '2026-08-06T09:13:54Z')).toBe('+1:06');
  });

  it('is nul voor de stap die het anker zelf is', () => {
    expect(verstrekenSinds('2026-08-06T09:12:48Z', '2026-08-06T09:12:48Z')).toBe('+0:00');
  });

  // Geen tijd is geen nul: dan weten we het niet, en dat hoort de tabel als
  // streepje te tonen in plaats van als "+0:00".
  it('geeft niets terug zonder anker of zonder tijd', () => {
    expect(verstrekenSinds(null, '2026-08-06T09:12:51Z')).toBeNull();
    expect(verstrekenSinds('2026-08-06T09:12:48Z', undefined)).toBeNull();
  });

  it('geeft niets terug bij een onleesbare of negatieve waarde', () => {
    expect(verstrekenSinds('2026-08-06T09:12:48Z', 'gisteren')).toBeNull();
    expect(verstrekenSinds('2026-08-06T09:12:48Z', '2026-08-06T09:12:40Z')).toBeNull();
  });
});

describe('absoluutLeesbaar', () => {
  it('maakt er iets leesbaars van, met de tijdzone erbij', () => {
    const uit = absoluutLeesbaar('2026-08-06T09:12:48Z');
    expect(uit).toMatch(/2026/);
    expect(uit).toMatch(/aug/);
    // De zone hoort erbij: anders is het niet te onderscheiden van de
    // UTC-waarde die in het bericht staat.
    expect(uit).toMatch(/[A-Z]{2,}|GMT|UTC/);
  });

  it('houdt een onleesbare waarde zichtbaar in plaats van hem te verbergen', () => {
    expect(absoluutLeesbaar('gisteren')).toBe('gisteren');
    expect(absoluutLeesbaar(null)).toBeNull();
  });
});
