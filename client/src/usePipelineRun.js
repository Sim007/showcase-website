import { useEffect, useMemo, useState } from 'react';
import { fetchHoofdstuk } from './api.js';
import { useLiveRun } from './useLiveRun.js';
import { deriveDeelsysteemStatus } from './deriveDeelsysteemStatus.js';

// Combineert de statische stamdata van een hoofdstuk met de live run-state
// (gedeeld over alle clients) tot één stappenlijst, en leidt daaruit de
// status per deelsysteem af. Gebruikt door zowel de pipeline-pagina (graph +
// cli) als de rapport-pagina (tabel), zodat beide hetzelfde beeld tonen van
// een lopende of afgeronde run.
export function usePipelineRun(id) {
  const [dataset, setDataset] = useState(null);
  const [error, setError] = useState(null);
  const { connected, running, hoofdstuk, stappen, gestopteDeelsystemen, start, reset } = useLiveRun();

  useEffect(() => {
    setDataset(null);
    fetchHoofdstuk(id).then(setDataset).catch((e) => setError(e.message));
  }, [id]);

  const steps = useMemo(() => {
    if (!dataset) return [];
    const liveForThisChapter = hoofdstuk === id;
    return dataset.stappen.map((stap) => {
      const live = liveForThisChapter ? stappen[stap.nr] : null;
      return live ? { ...stap, ...live } : { ...stap, uitkomst: 'wachtend', tijd: null };
    });
  }, [dataset, stappen, hoofdstuk, id]);

  const deelsysteemStatussen = useMemo(() => {
    const liveForThisChapter = hoofdstuk === id;
    const ids = [...new Set(steps.map((s) => s.deelsysteem))];
    const map = {};
    for (const ds of ids) {
      const eigenStappen = steps.filter((s) => s.deelsysteem === ds);
      const gestopt = liveForThisChapter && gestopteDeelsystemen.has(ds);
      map[ds] = deriveDeelsysteemStatus(eigenStappen, gestopt);
    }
    return map;
  }, [steps, gestopteDeelsystemen, hoofdstuk, id]);

  return { dataset, steps, deelsysteemStatussen, error, connected, running, hoofdstuk, start, reset };
}
