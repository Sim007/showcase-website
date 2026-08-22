import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CBT_BASE } from './api.js';
import { initState, startState, reduceerBericht, isGeeindigdMetStop } from './contract/berichtReducer.js';
import { maakLiveBron } from './contract/eventSourceBron.js';
import { maakOpgeslagenBron } from './contract/opgeslagenBron.js';

// De lijst zelf staat in een eigen module zodat scripts/opnames.mjs hem kan
// lezen; hier alleen doorgegeven, want dit is waar de rest van de app hem haalt.
export { OPGESLAGEN_VARIANTEN } from './opgeslagenVarianten.js';

const LiveRunContext = createContext(null);

// Eén verbinding per sessie, en dus één plek waar hij hoort: hier, boven de
// paginas. Stond hij in de pagina-hook, dan verbrak elke stap van dashboard
// naar rapport de stream en begon de runstate leeg — gemeten: een net afgeronde
// run stond op het rapport weer volledig op "wachtend".
//
// De bronkeuze (live of een opgeslagen opname) hoort om dezelfde reden hier:
// het is een keuze voor de hele sessie, niet voor één pagina, en de verbinding
// hangt eraan.
export function LiveRunProvider({ children }) {
  const [bron, setBron] = useState('live');
  const [state, setState] = useState(initState());
  const [connected, setConnected] = useState(false);
  const [verbindingWeg, setVerbindingWeg] = useState(false);
  const [nietBereikbaar, setNietBereikbaar] = useState(false);
  const [bronFout, setBronFout] = useState(null);
  const bronRef = useRef(null);

  useEffect(() => {
    setState(initState());
    setConnected(false);
    setVerbindingWeg(false);
    setNietBereikbaar(false);
    setBronFout(null);

    // Alleen nog reduceren. Loskoppelen bij `run-afgerond` hoorde bij een stream
    // die per run bestond: zolang showcase-CBT na een run sloot en bij de
    // volgende verbinding de eerstvolgende opname afspeelde, was openblijven
    // hetzelfde als een run laten beginnen die niemand startte. Vanaf
    // run-stream 0.11.0 blijft de stream open en roteert de opname op
    // `POST /v1/runs` — de vervaldatum die hier stond, is bereikt.
    const onBericht = (bericht) => setState((s) => reduceerBericht(s, bericht));

    const actieveBron =
      bron === 'live'
        ? maakLiveBron({
            apiBase: CBT_BASE,
            onBericht,
            onOpen: () => {
              setConnected(true);
              setVerbindingWeg(false);
              setNietBereikbaar(false);
            },
            onLosgekoppeld: () => setConnected(false),
            // Nooit verbonden geweest is iets anders dan weggevallen: er is dan
            // geen laatste bekende stand, dus niets om te bevriezen. Het
            // dashboard moet dan gewoon leeg en bruikbaar blijven en zeggen dat
            // showcase-CBT niet bereikbaar is.
            onVerbindingWeg: ({ ooitVerbonden } = {}) => {
              setConnected(false);
              setVerbindingWeg(Boolean(ooitVerbonden));
              setNietBereikbaar(!ooitVerbonden);
            },
          })
        : maakOpgeslagenBron({ pad: `/opgeslagen/${bron}.json`, onBericht });

    bronRef.current = actieveBron;
    // Verbinden hoort bij de sessie, niet bij de startknop: er kan een run
    // lopen die iemand anders startte, en die willen we vanaf het eerste
    // bericht volgen. De momentopname bij verbinden vertelt of dat zo is.
    actieveBron.verbind?.();
    return () => actieveBron.stop();
  }, [bron]);

  // Er is nog steeds geen resetknop — je reset om opnieuw te beginnen, dus dat
  // is dezelfde handeling. Maar het schoonvegen zit niet meer in de klik: de
  // stream bepaalt wat er op het dashboard staat.
  //
  // Gemeten tegen bundel 0.11.0: een tweede start tijdens een lopende run geeft
  // 409 en er begint niets. Een klik is daarmee geen bewijs meer dat er een run
  // volgt, en alleen iets wat bewijsbaar begint mag de vorige stand wissen.
  // `run-gestart` is dat bewijs, en die maakt de plaat zelf leeg.
  //
  // Dat het oude schoonvegen tot nu toe geen schade deed, kwam van de knop:
  // `disabled={running}` houdt hem dicht zolang er een run loopt. Die vlag komt
  // uit de stream, en juist na een weggevallen verbinding klopt hij niet meer —
  // dan staat de knop open terwijl er aan de andere kant nog een run loopt. Op
  // zo'n leunende garantie hoort dit niet te staan.
  //
  // Een opgeslagen opname is de uitzondering: daar ís starten opnieuw afspelen,
  // dat kan niet op een 409 stuiten, en de opname die bij stap 3 begint heeft
  // geen `run-gestart` om achter te schuilen.
  //
  // verbindingWeg gaat hier wél uit: het bevroren dashboard zegt zelf "start
  // opnieuw om verder te kijken", dus dát is het moment waarop de laatste
  // bekende stand geen bewering meer is.
  // Correctie op het bovenstaande, na een demo bij squad 1: wachten op
  // `run-gestart` is te laat. Tussen de klik en het eerste bericht bleef de
  // vorige run in beeld — gemeten 250 ms na de klik nog negen cli-regels van de
  // voorgaande run, inclusief "niet uitgevoerd, pipeline gestopt". Tegen de stub
  // is dat een fractie van een seconde, tegen een echte showcase-CBT de
  // rondgang plus de tijd tot de eerste stap. Het leest als uitvoer van een run
  // die je net startte, en dat is precies de stille onwaarheid die deze showcase
  // afwijst.
  //
  // Het eerste moment waarop we eerlijk weten dat er een run begint, is de 201.
  // Die draagt het runId van de opname die gaat spelen, dus daarop schoonvegen
  // is niet optimistisch maar vastgesteld. Een 409 laat de plaat staan, zoals
  // hij hoort.
  //
  // De vergelijking met het runId maakt het bestand tegen de race: kwamen de
  // eerste berichten van de nieuwe run al binnen vóór het antwoord op de POST,
  // dan staat dat runId er al en gooien we die berichten niet weg.
  const start = useCallback(
    async (scenarioId) => {
      setVerbindingWeg(false);
      setBronFout(null);
      if (bron !== 'live') {
        setState(initState());
        // Een opname kan ontbreken: verkeerde naam, of een asset die niet met de
        // bundel meekwam. Zonder dit blijft die afwijzing in een niet-afgehandelde
        // belofte hangen — de knop veert terug en er gebeurt niets, wat de lastigste
        // storing is om te herkennen. De controle in opgeslagenBron weet precies wat
        // er mis is; die melding hoort dus in beeld en niet alleen in de console.
        try {
          return await bronRef.current?.start(scenarioId);
        } catch (fout) {
          setBronFout(fout.message);
          return { ok: false, fout: fout.message };
        }
      }
      const uitkomst = await bronRef.current?.start(scenarioId);
      const nieuwId = uitkomst?.ok ? uitkomst.run?.runId : null;
      if (nieuwId) setState((s) => (s.runId === nieuwId ? s : startState(uitkomst.run)));
      return uitkomst;
    },
    [bron]
  );

  // De runstate leeft boven de router, zodat de stap van dashboard naar rapport
  // een lopende run niet weggooit. Keerzijde, gemeld na de demo: wie via het
  // hoofdmenu terugkomt op een scenario, kijkt nog naar de vorige run — groene
  // stappen en een vol cli-paneel op een pagina die net opnieuw geopend voelt.
  //
  // Het overzicht bezoeken is het einde van je blik op die run. Een lopende run
  // blijft wél staan: die weggooien is exact de bug waarvoor deze state boven de
  // router is gezet. Vandaar de voorwaarde, en niet een resetknop — er is nog
  // steeds geen handeling die "wissen" heet.
  const vergeetAfgerondeRun = useCallback(() => {
    setState((s) => (s.running ? s : initState()));
  }, []);

  const waarde = useMemo(
    () => ({
      bron,
      setBron,
      vergeetAfgerondeRun,
      connected,
      verbindingWeg,
      nietBereikbaar,
      bronFout,
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
    }),
    [bron, connected, verbindingWeg, nietBereikbaar, bronFout, state, start, vergeetAfgerondeRun]
  );

  return <LiveRunContext.Provider value={waarde}>{children}</LiveRunContext.Provider>;
}

export function useLiveRun() {
  const context = useContext(LiveRunContext);
  if (!context) throw new Error('useLiveRun gebruikt buiten een LiveRunProvider');
  return context;
}
