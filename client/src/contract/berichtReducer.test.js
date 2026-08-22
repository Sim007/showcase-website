import { describe, it, expect } from 'vitest';
import { initState, reduceerBericht, isGeeindigdMetStop } from './berichtReducer.js';

// Letterlijk de 'gestopt'-fixture uit de showcase-cbt stubbundel (0.11.0):
// stap 3 mislukt, stap 4/5/6 krijgen geen enkel bericht. Elke opname heeft sinds
// 0.11.0 zijn eigen runId — 'gestopt' is run-3b8e02.
//
// Met opzet niet meegegroeid met de bundel. In 0.13.0 telt 'gestopt' 9 stappen
// en valt hij op de eerste contractgate; wat de reducer moet kunnen is niet
// "negen" maar "een stap valt om en de rest krijgt niets", en dat leest hier
// beter op zes regels dan op dertig. Die aantallen staan vast in
// e2e/pipeline-opgeslagen.spec.js, tegen de echte opname.
const GESTOPT_STREAM = [
  { soort: 'momentopname', tijd: '2026-08-06T09:12:44Z', run: null, afgerondeStappen: [] },
  { soort: 'run-gestart', tijd: '2026-08-06T09:12:45Z', runId: 'run-3b8e02', scenarioId: '01' },
  { soort: 'stap-gestart', tijd: '2026-08-06T09:12:46Z', runId: 'run-3b8e02', stapNummer: 1 },
  { soort: 'cli-uitvoer', tijd: '2026-08-06T09:12:47Z', runId: 'run-3b8e02', stapNummer: 1, regel: '$ ci/pipeline-contract.sh payment payment-api 1.0.0 contracts/payment/payment-api/1.0.0/openapi.yaml' },
  { soort: 'stap-afgerond', tijd: '2026-08-06T09:12:48Z', runId: 'run-3b8e02', stapNummer: 1, uitkomst: 'geslaagd' },
  { soort: 'stap-gestart', tijd: '2026-08-06T09:12:49Z', runId: 'run-3b8e02', stapNummer: 2 },
  { soort: 'cli-uitvoer', tijd: '2026-08-06T09:12:50Z', runId: 'run-3b8e02', stapNummer: 2, regel: '$ ci/pipeline-microservice.sh payment payment-api' },
  { soort: 'stap-afgerond', tijd: '2026-08-06T09:12:51Z', runId: 'run-3b8e02', stapNummer: 2, uitkomst: 'geslaagd' },
  { soort: 'stap-gestart', tijd: '2026-08-06T09:12:52Z', runId: 'run-3b8e02', stapNummer: 3 },
  { soort: 'cli-uitvoer', tijd: '2026-08-06T09:12:53Z', runId: 'run-3b8e02', stapNummer: 3, regel: '$ ci/pipeline-ci.sh payment 1.0.0' },
  { soort: 'stap-afgerond', tijd: '2026-08-06T09:12:54Z', runId: 'run-3b8e02', stapNummer: 3, uitkomst: 'mislukt' },
  { soort: 'run-afgerond', tijd: '2026-08-06T09:12:55Z', runId: 'run-3b8e02', reden: 'gestopt', gestoptBijStap: 3 },
];

// De kop van de 'midden'-fixture (0.11.0): een momentopname van een run die al
// loopt, zonder `run-gestart` ervoor.
//
// Dit is weer een echte late kijker: sinds bundel 0.11.1 stelt de stub bij een
// tweede verbinding tijdens een lopende run de momentopname samen uit wat hij
// verstuurd heeft (nagemeten tegen 0.13.0 op 22-08-2026). Deze test blijft
// hiernaast staan omdat hij het geval deterministisch vastlegt: welke stappen
// afgerond zijn hangt hier niet af van wanneer je aansluit.
const LATE_KIJKER = [
  {
    soort: 'momentopname',
    tijd: '2026-08-06T09:12:50Z',
    run: { runId: 'run-9d15f4', scenarioId: '01', gestartOp: '2026-08-06T09:12:44Z' },
    afgerondeStappen: [
      { stapNummer: 1, uitkomst: 'geslaagd' },
      { stapNummer: 2, uitkomst: 'geslaagd' },
    ],
    lopendeStap: 3,
  },
  { soort: 'stap-gestart', tijd: '2026-08-06T09:12:51Z', runId: 'run-9d15f4', stapNummer: 3 },
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
    expect(state.cliRegels.get(1)).toEqual([
      '$ ci/pipeline-contract.sh payment payment-api 1.0.0 contracts/payment/payment-api/1.0.0/openapi.yaml',
    ]);
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
    expect(state.runId).toBe('run-9d15f4');
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
      run: { runId: 'run-9d15f4', scenarioId: '01', gestartOp: '2026-08-06T09:12:44Z' },
      afgerondeStappen: [{ stapNummer: 1, uitkomst: 'geslaagd' }],
      lopendeStap: 2,
    });
    expect(na.stappen.has(3)).toBe(false);
    expect(na.stappen.get(1).uitkomst).toBe('groen');
    expect(na.lopendeStap).toBe(2);
  });

  // Dezelfde run: de cli-regels blijven staan. Een herverbinding maakt eerder
  // getoonde uitvoer niet ongeldig, en de momentopname draagt zelf geen cli.
  it('laat de cli-uitvoer staan bij een momentopname van dezelfde run', () => {
    const metUitvoer = reduceerBericht(speelAf(LATE_KIJKER), {
      soort: 'cli-uitvoer', tijd: '2026-08-06T09:12:52Z', runId: 'run-9d15f4', stapNummer: 3, regel: '$ ci/pipeline-ci.sh payment 1.0.0',
    });
    const na = reduceerBericht(metUitvoer, {
      soort: 'momentopname',
      tijd: '2026-08-06T09:13:10Z',
      run: { runId: 'run-9d15f4', scenarioId: '01', gestartOp: '2026-08-06T09:12:44Z' },
      afgerondeStappen: [{ stapNummer: 1, uitkomst: 'geslaagd' }],
      lopendeStap: 2,
    });
    expect(na.cliRegels.get(3)).toHaveLength(1);
  });

  // Een ander runId: geen herverbinding maar de volgende run. Sinds 0.11.0 komt
  // dat echt voor — de opname die bij stap 3 begint opent met een momentopname
  // en heeft geen `run-gestart` die de plaat leegmaakt. Bleef de uitvoer staan,
  // dan hing die onder stappen die deze momentopname als afgerond opgeeft.
  it('wist de cli-uitvoer bij een momentopname van een andere run', () => {
    const na = reduceerBericht(speelAf(GESTOPT_STREAM), {
      soort: 'momentopname',
      tijd: '2026-08-06T09:13:10Z',
      run: { runId: 'run-9d15f4', scenarioId: '01', gestartOp: '2026-08-06T09:12:44Z' },
      afgerondeStappen: [
        { stapNummer: 1, uitkomst: 'geslaagd' },
        { stapNummer: 2, uitkomst: 'geslaagd' },
      ],
      lopendeStap: 3,
    });
    expect(na.cliRegels.size).toBe(0);
    expect(na.runId).toBe('run-9d15f4');
    expect(na.stappen.get(1).uitkomst).toBe('groen');
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
