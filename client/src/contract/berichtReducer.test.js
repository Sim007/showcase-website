import { describe, it, expect } from 'vitest';
import { initState, reduceerBericht, isGeeindigdMetStop } from './berichtReducer.js';

// Letterlijk de 'gestopt'-fixture uit de showcase-cbt stubbundel (0.10.0):
// stap 3 mislukt, stap 4/5/6 krijgen geen enkel bericht.
const GESTOPT_STREAM = [
  { soort: 'momentopname', tijd: '2026-08-06T09:12:44Z', run: null, afgerondeStappen: [] },
  { soort: 'run-gestart', tijd: '2026-08-06T09:12:45Z', runId: 'run-7c41a9', scenarioId: '01' },
  { soort: 'stap-gestart', tijd: '2026-08-06T09:12:46Z', runId: 'run-7c41a9', stapNummer: 1 },
  { soort: 'cli-uitvoer', tijd: '2026-08-06T09:12:47Z', runId: 'run-7c41a9', stapNummer: 1, regel: '$ ci/pipeline-contract.sh payment payment-api 1.0.0' },
  { soort: 'stap-afgerond', tijd: '2026-08-06T09:12:48Z', runId: 'run-7c41a9', stapNummer: 1, uitkomst: 'geslaagd' },
  { soort: 'stap-gestart', tijd: '2026-08-06T09:12:49Z', runId: 'run-7c41a9', stapNummer: 2 },
  { soort: 'cli-uitvoer', tijd: '2026-08-06T09:12:50Z', runId: 'run-7c41a9', stapNummer: 2, regel: '$ ci/pipeline-microservice.sh payment payment-api' },
  { soort: 'stap-afgerond', tijd: '2026-08-06T09:12:51Z', runId: 'run-7c41a9', stapNummer: 2, uitkomst: 'geslaagd' },
  { soort: 'stap-gestart', tijd: '2026-08-06T09:12:52Z', runId: 'run-7c41a9', stapNummer: 3 },
  { soort: 'cli-uitvoer', tijd: '2026-08-06T09:12:53Z', runId: 'run-7c41a9', stapNummer: 3, regel: '$ ci/pipeline-ci.sh payment 1.0.0' },
  { soort: 'stap-afgerond', tijd: '2026-08-06T09:12:54Z', runId: 'run-7c41a9', stapNummer: 3, uitkomst: 'mislukt' },
  { soort: 'run-afgerond', tijd: '2026-08-06T09:12:55Z', runId: 'run-7c41a9', reden: 'gestopt', gestoptBijStap: 3 },
];

// De kop van de 'midden'-fixture (0.10.0): verbinden terwijl er al een run
// loopt. Squad showcase-cbt meldt dat de bundel vanaf 0.11.0 gaat roteren op
// POST /v1/runs en dat 'midden' een run wordt die bij stap 3 begint — dan is
// dit geval niet meer tegen de bundel te oefenen. Daarom staat het hier, tegen
// de spec, in plaats van alleen in de fixture.
const LATE_KIJKER = [
  {
    soort: 'momentopname',
    tijd: '2026-08-06T09:12:50Z',
    run: { runId: 'run-7c41a9', scenarioId: '01', gestartOp: '2026-08-06T09:12:44Z' },
    afgerondeStappen: [
      { stapNummer: 1, uitkomst: 'geslaagd' },
      { stapNummer: 2, uitkomst: 'geslaagd' },
    ],
    lopendeStap: 3,
  },
  { soort: 'stap-gestart', tijd: '2026-08-06T09:12:51Z', runId: 'run-7c41a9', stapNummer: 3 },
];

function speelAf(berichten) {
  return berichten.reduce(reduceerBericht, initState());
}

describe('berichtReducer — gestopt-fixture', () => {
  it('kent stap 1 en 2 geslaagd (vertaald naar groen) en stap 3 mislukt (rood) toe', () => {
    const state = speelAf(GESTOPT_STREAM);
    expect(state.stappen.get(1).uitkomst).toBe('groen');
    expect(state.stappen.get(2).uitkomst).toBe('groen');
    expect(state.stappen.get(3).uitkomst).toBe('rood');
  });

  it('heeft geen entry voor stap 4/5/6 — ze kregen nooit een bericht', () => {
    const state = speelAf(GESTOPT_STREAM);
    expect(state.stappen.has(4)).toBe(false);
    expect(state.stappen.has(5)).toBe(false);
    expect(state.stappen.has(6)).toBe(false);
  });

  it('accumuleert cli-uitvoer per stap in ontvangstvolgorde', () => {
    const state = speelAf(GESTOPT_STREAM);
    expect(state.cliRegels.get(1)).toEqual(['$ ci/pipeline-contract.sh payment payment-api 1.0.0']);
  });

  it('zet running op false en bewaart reden + gestoptBijStap na run-afgerond', () => {
    const state = speelAf(GESTOPT_STREAM);
    expect(state.running).toBe(false);
    expect(state.reden).toBe('gestopt');
    expect(state.gestoptBijStap).toBe(3);
  });

  it('isGeeindigdMetStop is waar voor gestopt/afgebroken en onbekende redenen, niet voor voltooid', () => {
    expect(isGeeindigdMetStop('gestopt')).toBe(true);
    expect(isGeeindigdMetStop('afgebroken')).toBe(true);
    expect(isGeeindigdMetStop('gestopt-door-beheerder')).toBe(true);
    expect(isGeeindigdMetStop('voltooid')).toBe(false);
    expect(isGeeindigdMetStop(null)).toBe(false);
  });
});

describe('berichtReducer — momentopname van een lopende run (late kijker)', () => {
  it('neemt de al afgeronde stappen over, vertaald', () => {
    const state = speelAf([LATE_KIJKER[0]]);
    expect(state.stappen.get(1).uitkomst).toBe('groen');
    expect(state.stappen.get(2).uitkomst).toBe('groen');
  });

  it('weet dat er een run loopt, met welke en sinds wanneer', () => {
    const state = speelAf([LATE_KIJKER[0]]);
    expect(state.running).toBe(true);
    expect(state.runId).toBe('run-7c41a9');
    expect(state.scenarioId).toBe('01');
    expect(state.lopendeStap).toBe(3);
  });

  // De lopende stap krijgt géén entry in stappen: de momentopname draagt hem
  // apart, en een uitkomst heeft hij nog niet. Zou hij er wel staan, dan zou
  // de UI een uitkomst tonen voor een stap die nog bezig is.
  it('geeft de lopende stap nog geen uitkomst', () => {
    const state = speelAf([LATE_KIJKER[0]]);
    expect(state.stappen.has(3)).toBe(false);
  });

  it('zet de lopende stap op lopend zodra het eerste eigen bericht binnenkomt', () => {
    const state = speelAf(LATE_KIJKER);
    expect(state.stappen.get(3).uitkomst).toBe('lopend');
    expect(state.stappen.get(1).uitkomst).toBe('groen');
  });

  // Een tweede momentopname (herverbinding) bouwt de stappenlijst opnieuw op:
  // hij is de waarheid, niet een aanvulling. Wat hij niet noemt, weten we niet.
  it('vervangt de stappenlijst bij een volgende momentopname', () => {
    const na = reduceerBericht(speelAf(LATE_KIJKER), {
      soort: 'momentopname',
      tijd: '2026-08-06T09:13:10Z',
      run: { runId: 'run-7c41a9', scenarioId: '01', gestartOp: '2026-08-06T09:12:44Z' },
      afgerondeStappen: [{ stapNummer: 1, uitkomst: 'geslaagd' }],
      lopendeStap: 2,
    });
    expect(na.stappen.has(3)).toBe(false);
    expect(na.stappen.get(1).uitkomst).toBe('groen');
    expect(na.lopendeStap).toBe(2);
  });
});

describe('berichtReducer — tolerantie', () => {
  it('negeert een onbekend veld op elk bericht zonder de state te breken', () => {
    const metOnbekendVeld = GESTOPT_STREAM.map((b) => ({ ...b, herkomst: 'toekomstige-versie' }));
    const state = speelAf(metOnbekendVeld);
    expect(state.reden).toBe('gestopt');
    expect(state.stappen.get(1).uitkomst).toBe('groen');
  });

  it('valt terug op de ruwe waarde bij een onbekende uitkomst, in plaats van te crashen', () => {
    const state = reduceerBericht(initState(), {
      soort: 'stap-afgerond',
      tijd: '2026-08-06T09:12:48Z',
      runId: 'run-7c41a9',
      stapNummer: 1,
      uitkomst: 'twijfelachtig',
    });
    expect(state.stappen.get(1).uitkomst).toBe('twijfelachtig');
  });
});
