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

    const onBericht = (bericht) => {
      setState((s) => reduceerBericht(s, bericht));
      // Klaar met deze run: loskoppelen, anders verbindt de browser uit
      // zichzelf opnieuw en loopt er zo weer een run binnen die niemand
      // startte. Zie contract/eventSourceBron.js.
      if (bericht.soort === 'run-afgerond') bronRef.current?.verbreek?.();
    };

    const actieveBron =
      bron === 'opgeslagen'
        ? maakOpgeslagenBron({ pad: opgeslagenPad, onBericht })
        : maakLiveBron({ apiBase: CBT_BASE, onBericht, onOpen: () => setConnected(true), onClose: () => setConnected(false) });

    bronRef.current = actieveBron;
    return () => actieveBron.stop();
  }, [bron, opgeslagenPad]);

  // Starten ís de reset. Een aparte resetknop vroeg om een handeling die
  // niemand los wil doen — je reset om opnieuw te kunnen beginnen. Zonder dit
  // schoonvegen zouden de uitkomsten van de vorige run blijven staan tot de
  // nieuwe run diezelfde stap overschrijft, en dat leest als een run die al
  // half gelopen heeft voordat hij begon.
  function start(scenarioId) {
    bronRef.current?.stop();
    setState(initState());
    return bronRef.current?.start(scenarioId);
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
  };
}
