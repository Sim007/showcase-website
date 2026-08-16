import { useEffect, useMemo, useState } from 'react';
import { haalScenario, HERKOMST } from './scenarioBron.js';
import { useLiveRun } from './LiveRunProvider.jsx';
import { vertaalStap } from './contract/vertaal.js';
import { deriveDeelsysteemStatus, deelsysteemIsGestopt } from './deriveDeelsysteemStatus.js';

// Combineert de statische stamdata van een scenario (GET /v1/scenarios/:id)
// met de live/opgeslagen stream tot één stappenlijst, en leidt daaruit de
// status per deelsysteem af. Het contract stopt alleen stapNummer + uitkomst
// in de stream — de rest (deelsysteem, omgeving, cli, ...) komt uit de
// stamdata en wordt hier gejoined, niet uit tekst geparsed.
//
// De verbinding zelf zit niet hier maar in LiveRunProvider: één per sessie,
// zodat navigeren tussen dashboard en rapport de lopende run niet weggooit.
export function usePipelineRun(id) {
  const [dataset, setDataset] = useState(null);
  const [herkomst, setHerkomst] = useState(null);
  const [error, setError] = useState(null);
  const live = useLiveRun();
  const { scenarioId, stappen, cliRegels, runGestopt } = live;

  useEffect(() => {
    let actueel = true;
    setDataset(null);
    setHerkomst(null);
    setError(null);
    haalScenario(id)
      .then(({ dataset: d, herkomst: h }) => {
        if (!actueel) return;
        setDataset(d);
        setHerkomst(h);
      })
      .catch((e) => actueel && setError(e.message));
    return () => {
      actueel = false;
    };
  }, [id]);

  // Koppel de stream aan de stamdata die we tónen, niet aan het id uit de URL.
  // De stapnummers in de berichten verwijzen naar de stappenlijst die we in
  // beeld hebben; alleen daarvan is bekend welke stap nummer 3 is. Normaal
  // zijn URL-id en stamdata-id hetzelfde. Zijn ze dat niet, dan klopt de
  // levering niet (de pagina meldt dat apart) — maar dan is de stamdata nog
  // steeds de juiste sleutel, en het URL-id juist de verkeerde.
  const liveVoorDitScenario = dataset != null && scenarioId === dataset.id;

  const steps = useMemo(() => {
    if (!dataset) return [];
    return dataset.stappen.map(vertaalStap).map((stap) => {
      const live = liveVoorDitScenario ? stappen.get(stap.nr) : null;
      if (live) return { ...stap, ...live, cliRegels: cliRegels.get(stap.nr) || [] };
      // Nooit een bericht ontvangen: als de run gestopt is, is dat het feit
      // ("niet uitgevoerd" — usecases-showcase-website.md, besluit 3), zo
      // niet dan wacht de stap gewoon nog op zijn beurt.
      const uitkomst = liveVoorDitScenario && runGestopt ? 'niet-uitgevoerd' : 'wachtend';
      return { ...stap, uitkomst, tijd: null, bijzonderheden: undefined, cliRegels: [] };
    });
  }, [dataset, stappen, cliRegels, liveVoorDitScenario, runGestopt]);

  const deelsysteemStatussen = useMemo(() => {
    const ids = [...new Set(steps.map((s) => s.deelsysteem))];
    const map = {};
    for (const ds of ids) {
      const eigenStappen = steps.filter((s) => s.deelsysteem === ds);
      const gestopt = deelsysteemIsGestopt(eigenStappen, liveVoorDitScenario && runGestopt);
      map[ds] = deriveDeelsysteemStatus(eigenStappen, gestopt);
    }
    return map;
  }, [steps, liveVoorDitScenario, runGestopt]);

  return {
    ...live,
    dataset,
    steps,
    deelsysteemStatussen,
    error,
    stamdataUitLokaleKopie: herkomst === HERKOMST.lokaleKopie,
  };
}
