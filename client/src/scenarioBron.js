import { fetchScenario, fetchLokaleScenarioKopie } from './api.js';

// Stamdata wordt één keer per scenario opgehaald en daarna vastgehouden.
//
// Waarom vasthouden: hij werd per pagina opnieuw opgehaald, dus wie na een
// weggevallen verbinding doorliep naar het rapport kreeg "kon scenario niet
// laden" in plaats van de bevroren laatste stand. De stamdata is bovendien
// per definitie statisch — hij beschrijft wat er zou gebeuren, vóór er iets
// draait — dus er valt niets te missen door hem te bewaren.
//
// Waarom een terugval: de opgeslagen modus hoort te werken zónder
// showcase-CBT, en dat lukte niet zolang de stappenlijst dáár vandaan moest
// komen. Een cache helpt daar niet: die is leeg als er nooit verbinding was.
//
// De herkomst gaat mee naar boven. Een lokale kopie tonen alsof hij van
// showcase-CBT komt, is precies de stille bewering die deze showcase afwijst.
const cache = new Map();
const lopend = new Map();

export const HERKOMST = {
  showcaseCbt: 'showcase-cbt',
  lokaleKopie: 'lokale-kopie',
};

export function leegScenarioCache() {
  cache.clear();
  lopend.clear();
}

export function haalScenario(id) {
  if (cache.has(id)) return Promise.resolve(cache.get(id));
  if (lopend.has(id)) return lopend.get(id);

  const belofte = (async () => {
    try {
      const dataset = await fetchScenario(id);
      return { dataset, herkomst: HERKOMST.showcaseCbt };
    } catch (fout) {
      const dataset = await fetchLokaleScenarioKopie(id).catch(() => null);
      if (!dataset) throw fout;
      return { dataset, herkomst: HERKOMST.lokaleKopie };
    }
  })()
    .then((uitkomst) => {
      cache.set(id, uitkomst);
      return uitkomst;
    })
    .finally(() => lopend.delete(id));

  lopend.set(id, belofte);
  return belofte;
}
