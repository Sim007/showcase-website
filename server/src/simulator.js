const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const nowStr = () =>
  new Date().toLocaleTimeString('nl-NL', { hour12: false });

// Speelt showcase-CBT na: toetst de gates en meldt de uitkomst via de
// stream. `dataset.stappen` is al de merge van stamdata + simulatiescript
// (zie adapter/index.js) — elke stap kent hier dus al zijn `uitkomst`.
//
// Zodra de gate van een stap niet gehaald wordt ("rood"), stopt de pipeline
// van dát deelsysteem: resterende stappen van hetzelfde deelsysteem worden
// niet meer uitgevoerd (geen delay, geen cli) en krijgen uitkomst
// 'niet-uitgevoerd'. Andere deelsystemen lopen door.
export function createRunner(broadcast) {
  let state = { hoofdstuk: null, status: 'idle', stappen: [] };
  let running = false;
  let cancelToken = 0;

  function upsert(stap) {
    const idx = state.stappen.findIndex((s) => s.nr === stap.nr);
    if (idx >= 0) state.stappen[idx] = stap;
    else state.stappen.push(stap);
  }

  async function start(hoofdstukId, dataset) {
    if (running) return false;
    running = true;
    const myToken = ++cancelToken;
    state = { hoofdstuk: hoofdstukId, status: 'lopend', stappen: [] };
    broadcast({ type: 'run-gestart', hoofdstuk: hoofdstukId });

    const gestopteDeelsystemen = new Set();

    for (const stap of dataset.stappen) {
      if (myToken !== cancelToken) {
        running = false;
        return;
      }

      if (gestopteDeelsystemen.has(stap.deelsysteem)) {
        const { cli, ...zonderCli } = stap;
        const overgeslagen = {
          ...zonderCli,
          uitkomst: 'niet-uitgevoerd',
          bijzonderheden: 'pipeline van dit deelsysteem is gestopt',
          tijd: nowStr(),
        };
        upsert(overgeslagen);
        broadcast({ type: 'stap-beeindigd', stap: overgeslagen });
        continue;
      }

      const gestart = { ...stap, uitkomst: 'lopend', tijd: nowStr() };
      upsert(gestart);
      broadcast({ type: 'stap-gestart', stap: gestart });
      await delay(500 + Math.random() * 700);

      if (myToken !== cancelToken) {
        running = false;
        return;
      }
      const beeindigd = { ...stap, tijd: nowStr() };
      upsert(beeindigd);
      broadcast({ type: 'stap-beeindigd', stap: beeindigd });

      if (beeindigd.uitkomst === 'rood') {
        gestopteDeelsystemen.add(beeindigd.deelsysteem);
        broadcast({ type: 'deelsysteem-gestopt', deelsysteem: beeindigd.deelsysteem, nr: beeindigd.nr });
      }

      await delay(250 + Math.random() * 450);
    }

    state.status = 'klaar';
    broadcast({ type: 'run-beeindigd', hoofdstuk: hoofdstukId });
    running = false;
  }

  function reset() {
    if (running) return false;
    cancelToken += 1;
    state = { hoofdstuk: null, status: 'idle', stappen: [] };
    return true;
  }

  return {
    start,
    reset,
    getState: () => state,
    isRunning: () => running,
  };
}
