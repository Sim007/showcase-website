import { useEffect, useRef, useState } from 'react';
import { CBT_BASE } from './api.js';
import { initState, reduceerBericht, isGeeindigdMetStop } from './contract/berichtReducer.js';
import { maakLiveBron } from './contract/eventSourceBron.js';
import { maakOpgeslagenBron } from './contract/opgeslagenBron.js';

// Eén consument voor beide modi: dezelfde validatie (schema.js), dezelfde
// vertaling (vertaal.js) en dezelfde reducer (berichtReducer.js). Het enige
// verschil zit aan de invoerkant — een echte EventSource, of het terugspelen
// van een eerder vastgelegde stream uit een bestand. Zie
// verkenning-EventSource.md voor waarom er hier geen tweede databronvorm en
// geen vertaling-tussen-twee-vormen meer nodig is.
//
// "Verbonden" betekent hier expliciet verbonden met showcase-CBT — in
// opgeslagen-modus is dat nooit waar, ook al loopt de plaat gewoon door
// (usecases-showcase-website.md, "Twee modi": de indicator ís het onderscheid
// tussen live en opgeslagen).
export function useLiveRun({ bron = 'live', opgeslagenPad } = {}) {
  const [state, setState] = useState(initState());
  const [connected, setConnected] = useState(false);
  const bronRef = useRef(null);

  useEffect(() => {
    setState(initState());
    setConnected(false);

    const onBericht = (bericht) => setState((s) => reduceerBericht(s, bericht));

    const actieveBron =
      bron === 'opgeslagen'
        ? maakOpgeslagenBron({ pad: opgeslagenPad, onBericht })
        : maakLiveBron({ apiBase: CBT_BASE, onBericht, onOpen: () => setConnected(true), onClose: () => setConnected(false) });

    bronRef.current = actieveBron;
    return () => actieveBron.stop();
  }, [bron, opgeslagenPad]);

  function start(scenarioId) {
    return bronRef.current?.start(scenarioId);
  }

  function reset() {
    bronRef.current?.stop();
    setState(initState());
  }

  return {
    connected,
    running: state.running,
    scenarioId: state.scenarioId,
    stappen: state.stappen,
    cliRegels: state.cliRegels,
    reden: state.reden,
    gestoptBijStap: state.gestoptBijStap,
    runGestopt: isGeeindigdMetStop(state.reden),
    start,
    reset,
  };
}
