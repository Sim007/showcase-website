import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CBT_BASE } from './api.js';
import { initState, reduceerBericht, isGeeindigdMetStop } from './contract/berichtReducer.js';
import { maakLiveBron } from './contract/eventSourceBron.js';
import { maakOpgeslagenBron } from './contract/opgeslagenBron.js';

export const OPGESLAGEN_VARIANTEN = [
  { key: 'voltooid', label: 'opgeslagen: voltooid' },
  { key: 'gestopt', label: 'opgeslagen: gestopt' },
  { key: 'midden', label: 'opgeslagen: midden' },
];

const LiveRunContext = createContext(null);

// Eén verbinding per sessie, en dus één plek waar hij hoort: hier, boven de
// paginas. Stond hij in de pagina-hook, dan verbrak elke stap van plaat naar
// rapport de stream en begon de runstate leeg — gemeten: een net afgeronde run
// stond op het rapport weer volledig op "wachtend".
//
// De bronkeuze (live of een opgeslagen opname) hoort om dezelfde reden hier:
// het is een keuze voor de hele sessie, niet voor één pagina, en de verbinding
// hangt eraan.
export function LiveRunProvider({ children }) {
  const [bron, setBron] = useState('live');
  const [state, setState] = useState(initState());
  const [connected, setConnected] = useState(false);
  const [verbindingWeg, setVerbindingWeg] = useState(false);
  const bronRef = useRef(null);

  useEffect(() => {
    setState(initState());
    setConnected(false);
    setVerbindingWeg(false);

    const onBericht = (bericht) => {
      setState((s) => reduceerBericht(s, bericht));
      // Klaar met deze run: zelf loskoppelen. Zolang showcase-CBT de stream na
      // een run sluit en bij de volgende verbinding de eerstvolgende opname
      // afspeelt, is openblijven hetzelfde als een run laten beginnen die
      // niemand startte. Dit vervalt zodra de stream tussen runs openblijft.
      if (bericht.soort === 'run-afgerond') bronRef.current?.verbreek?.();
    };

    const actieveBron =
      bron === 'live'
        ? maakLiveBron({
            apiBase: CBT_BASE,
            onBericht,
            onOpen: () => {
              setConnected(true);
              setVerbindingWeg(false);
            },
            onLosgekoppeld: () => setConnected(false),
            onVerbindingWeg: () => {
              setConnected(false);
              setVerbindingWeg(true);
            },
          })
        : maakOpgeslagenBron({ pad: `/opgeslagen/${bron}.json`, onBericht });

    bronRef.current = actieveBron;
    return () => actieveBron.stop();
  }, [bron]);

  const start = useCallback((scenarioId) => bronRef.current?.start(scenarioId), []);

  const reset = useCallback(() => {
    bronRef.current?.stop();
    setState(initState());
    setVerbindingWeg(false);
  }, []);

  const waarde = useMemo(
    () => ({
      bron,
      setBron,
      connected,
      verbindingWeg,
      // Valt de verbinding weg, dan loopt er voor ons niets meer: er komt geen
      // run-afgerond meer binnen, dus zonder dit zou de knop eeuwig op
      // "bezig..." blijven staan. Opnieuw starten is de herstelactie.
      running: state.running && !verbindingWeg,
      scenarioId: state.scenarioId,
      stappen: state.stappen,
      cliRegels: state.cliRegels,
      reden: state.reden,
      gestoptBijStap: state.gestoptBijStap,
      runGestopt: isGeeindigdMetStop(state.reden),
      start,
      reset,
    }),
    [bron, connected, verbindingWeg, state, start, reset]
  );

  return <LiveRunContext.Provider value={waarde}>{children}</LiveRunContext.Provider>;
}

export function useLiveRun() {
  const context = useContext(LiveRunContext);
  if (!context) throw new Error('useLiveRun gebruikt buiten een LiveRunProvider');
  return context;
}
