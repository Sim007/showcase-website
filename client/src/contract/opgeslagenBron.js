import { valideerBericht } from './schema.js';

// Opgeslagen bron: geen verbinding, een eerder vastgelegde stream uit een
// bestand — letterlijk de fixtures uit de showcase-cbt stubbundel (21/12/14
// berichten, met tijdstempels). Zelfde consument als de live bron: dezelfde
// validatie, dezelfde tolerantie. Het enige verschil zit aan de invoerkant.
export function maakOpgeslagenBron({ pad, onBericht }) {
  let getimede = [];
  let lopendeTimeouts = [];
  let geladen = false;

  async function laadEenmalig() {
    if (geladen) return;
    const res = await fetch(pad);
    if (!res.ok) throw new Error(`kon opgeslagen stream niet laden: ${pad}`);
    const berichten = await res.json();
    const eersteTijd = berichten.length ? new Date(berichten[0].tijd).getTime() : 0;
    getimede = berichten.map((bericht) => ({
      bericht,
      vertraging: new Date(bericht.tijd).getTime() - eersteTijd,
    }));
    geladen = true;
  }

  function speelAf() {
    stop();
    for (const { bericht, vertraging } of getimede) {
      const id = setTimeout(() => {
        const { ok } = valideerBericht(bericht);
        if (ok) onBericht(bericht);
      }, vertraging);
      lopendeTimeouts.push(id);
    }
  }

  function stop() {
    lopendeTimeouts.forEach(clearTimeout);
    lopendeTimeouts = [];
  }

  async function start() {
    await laadEenmalig();
    speelAf();
    return { ok: true };
  }

  return { start, stop };
}
