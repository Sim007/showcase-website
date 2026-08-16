import { valideerBericht } from './schema.js';

// Live bron: EventSource op de stream van showcase-CBT (of de stub), met
// fetch POST om een run te starten.
//
// Bewust pas verbinden wanneer er een run te volgen is, en weer loskoppelen
// zodra die run is afgerond. De stream kent geen "er gebeurt even niets"-
// signaal: sluit de andere kant hem, dan verbindt de browser uit zichzelf
// opnieuw, en alles wat er dan binnenkomt oogt als een run die niemand
// startte. Tegen de stub gebeurt dat elke paar seconden, eindeloos.
//
// De prijs staat hier expliciet: een run die al liep vóórdat je de pagina
// opende, zie je zo niet meer vanzelf — terwijl de momentopname uit het
// contract daar juist voor bedoeld is. Zodra er een echt showcase-CBT staat
// (dat niet bij elke verbinding een volgende opname afspeelt) hoort dit terug
// naar verbinden zodra de pagina opent.
export function maakLiveBron({ apiBase, onBericht, onOpen, onClose }) {
  let source = null;

  function verbind() {
    if (source) return;
    source = new EventSource(`${apiBase}/v1/runs/stream`);
    source.onopen = () => onOpen?.();
    source.onerror = () => onClose?.();
    source.onmessage = (event) => {
      let bericht;
      try {
        bericht = JSON.parse(event.data);
      } catch {
        return;
      }
      const { ok } = valideerBericht(bericht);
      if (ok) onBericht(bericht);
    };
  }

  function verbreek() {
    if (!source) return;
    source.close();
    source = null;
    onClose?.();
  }

  async function start(scenarioId) {
    // Eerst luisteren, dan pas starten — anders missen we de eerste berichten
    // van onze eigen run.
    verbind();
    const res = await fetch(`${apiBase}/v1/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId }),
    });
    if (res.status === 409) {
      // Er loopt al een run: verbonden blijven, want die willen we juist volgen.
      const fout = await res.json().catch(() => null);
      console.warn('Er loopt al een run:', fout);
      return { ok: false, fout };
    }
    if (!res.ok) {
      verbreek();
      return { ok: false, fout: await res.json().catch(() => null) };
    }
    return { ok: true, run: await res.json() };
  }

  return { start, stop: verbreek, verbreek };
}
