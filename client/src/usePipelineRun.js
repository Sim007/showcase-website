import { useEffect, useMemo, useState } from 'react';
import { fetchScenario } from './api.js';
import { useLiveRun } from './useLiveRun.js';
import { vertaalStap } from './contract/vertaal.js';
import { deriveDeelsysteemStatus } from './deriveDeelsysteemStatus.js';

// Combineert de statische stamdata van een scenario (GET /v1/scenarios/:id)
// met de live/opgeslagen stream tot één stappenlijst, en leidt daaruit de
// status per deelsysteem af. Het contract stopt alleen stapNummer + uitkomst
// in de stream — de rest (deelsysteem, omgeving, cli, ...) komt uit de
// stamdata en wordt hier gejoined, niet uit tekst geparsed.
export function usePipelineRun(id, { bron, opgeslagenPad } = {}) {
  const [dataset, setDataset] = useState(null);
  const [error, setError] = useState(null);
  const { connected, running, scenarioId, stappen, cliRegels, runGestopt, start, reset } = useLiveRun({ bron, opgeslagenPad });

  useEffect(() => {
    setDataset(null);
    fetchScenario(id).then(setDataset).catch((e) => setError(e.message));
  }, [id]);

  const liveVoorDitScenario = scenarioId === id;

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
      const gestopt = liveVoorDitScenario && runGestopt && eigenStappen.some((s) => s.uitkomst === 'niet-uitgevoerd');
      map[ds] = deriveDeelsysteemStatus(eigenStappen, gestopt);
    }
    return map;
  }, [steps, liveVoorDitScenario, runGestopt]);

  return { dataset, steps, deelsysteemStatussen, error, connected, running, scenarioId, start, reset };
}
