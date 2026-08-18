import { vertaalUitkomst } from './vertaal.js';

// Zuivere state machine over de zes berichtsoorten van run-stream. Bewust
// los van de transportlaag (EventSource of terugspeel-bestand) zodat beide
// bronnen exact dezelfde vertaling en dezelfde tolerantie krijgen.
export function initState() {
  return {
    runId: null,
    scenarioId: null,
    running: false,
    reden: null,
    gestoptBijStap: null,
    lopendeStap: null,
    stappen: new Map(), // stapNummer -> { uitkomst, bijzonderheden, tijd }
    cliRegels: new Map(), // stapNummer -> string[]
  };
}

function metStap(stappen, nr, patch) {
  const volgende = new Map(stappen);
  volgende.set(nr, { ...volgende.get(nr), ...patch });
  return volgende;
}

// Aanname, met opzet expliciet: een momentopname bevat nooit cli-uitvoer
// (zie MomentopnamePayload) — dat laat in het midden of eerder ontvangen
// regels bij een herverbinding moeten blijven staan of gewist moeten worden.
// Deze reducer kiest: laten staan. Cli-uitvoer is "om te tonen, niet om op
// te redeneren"; een reconnect maakt eerder getoonde regels niet ongeldig,
// en de spec geeft geen signaal dat ze dat wél zouden zijn.
//
// Dat geldt alleen zolang het dezelfde run is. Noemt de momentopname een ander
// runId, dan is het geen herverbinding maar een volgende run, en dan hoort er
// niets meer van de vorige in beeld te staan — ook de cli-regels niet. Sinds
// bundel 0.11.0 is dat een echt geval: elke opname heeft zijn eigen runId, en de
// opname die bij stap 3 begint opent met een momentopname zonder `run-gestart`
// ervoor. Zonder deze regel bleef de uitvoer van de vorige run onder stappen
// hangen die de nieuwe momentopname als "al afgerond" opgeeft.
export function reduceerBericht(state, bericht) {
  switch (bericht.soort) {
    case 'momentopname': {
      if (!bericht.run) {
        return { ...state, runId: null, scenarioId: null, running: false, lopendeStap: null };
      }
      const zelfdeRun = bericht.run.runId === state.runId;
      const stappen = new Map();
      for (const s of bericht.afgerondeStappen) {
        stappen.set(s.stapNummer, { uitkomst: vertaalUitkomst(s.uitkomst), bijzonderheden: undefined, tijd: undefined });
      }
      return {
        ...state,
        runId: bericht.run.runId,
        scenarioId: bericht.run.scenarioId,
        running: true,
        reden: null,
        gestoptBijStap: null,
        lopendeStap: bericht.lopendeStap ?? null,
        stappen,
        cliRegels: zelfdeRun ? state.cliRegels : new Map(),
      };
    }

    case 'run-gestart':
      return {
        ...state,
        runId: bericht.runId,
        scenarioId: bericht.scenarioId,
        running: true,
        reden: null,
        gestoptBijStap: null,
        lopendeStap: null,
        stappen: new Map(),
        cliRegels: new Map(),
      };

    case 'stap-gestart':
      return {
        ...state,
        lopendeStap: bericht.stapNummer,
        stappen: metStap(state.stappen, bericht.stapNummer, { uitkomst: 'lopend', tijd: bericht.tijd }),
      };

    case 'cli-uitvoer': {
      const cliRegels = new Map(state.cliRegels);
      const bestaand = cliRegels.get(bericht.stapNummer) || [];
      cliRegels.set(bericht.stapNummer, [...bestaand, bericht.regel]);
      return { ...state, cliRegels };
    }

    case 'stap-afgerond':
      return {
        ...state,
        stappen: metStap(state.stappen, bericht.stapNummer, {
          uitkomst: vertaalUitkomst(bericht.uitkomst),
          bijzonderheden: bericht.bijzonderheden,
          tijd: bericht.tijd,
        }),
      };

    case 'run-afgerond':
      return {
        ...state,
        running: false,
        reden: bericht.reden,
        gestoptBijStap: bericht.gestoptBijStap ?? null,
      };

    default:
      return state;
  }
}

// Onbekende reden: conservatief behandelen als "gestopt" voor de
// deelsysteem-afleiding. Aannemen dat een niet-herkende reden hetzelfde is
// als "voltooid" zou een deelsysteem voor altijd op "lopend" kunnen laten
// staan nadat de run al lang voorbij is; andersom is het ergste gevolg dat
// een deelsysteem te vroeg als "gestopt" toont. Dat laatste is veiliger.
export function isGeeindigdMetStop(reden) {
  return reden != null && reden !== 'voltooid';
}
