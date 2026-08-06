import { listScenarios, getScenario } from './scenarioStore.js';
import { getScript } from './simulatorScripts.js';
import { createRunner } from '../simulator.js';

// De enige plek waar de rest van showcase-website doorheen praat om bij
// showcase-CBT te komen. Vandaag zit de simulator hier achter — inclusief
// het toetsen van de gates, want dat is showcase-CBT's taak, niet die van de
// website (zie context.md, "Architectuurprincipe showcase-website").
//
// Nog niet aangesloten op een echt showcase-CBT: dat is een latere stap.
// Wanneer die komt, praat hij via dezelfde vier functies met app.js en
// index.js — die twee weten niet dat er vandaag een simulator achter zit.
export function createCbtAdapter(broadcast) {
  const runner = createRunner(broadcast);

  function metStreamvelden(stamdata, script) {
    const scriptPerNr = new Map(script.stappen.map((s) => [s.nr, s]));
    return {
      ...stamdata,
      stappen: stamdata.stappen.map((stap) => ({ ...stap, ...scriptPerNr.get(stap.nr) })),
    };
  }

  function start(id) {
    if (runner.isRunning()) return false;
    const stamdata = getScenario(id);
    const script = getScript(id);
    if (!stamdata || !script) return false;
    runner.start(id, metStreamvelden(stamdata, script));
    return true;
  }

  return {
    listScenarios,
    getScenario,
    start,
    reset: runner.reset,
    getState: runner.getState,
    isRunning: runner.isRunning,
  };
}
