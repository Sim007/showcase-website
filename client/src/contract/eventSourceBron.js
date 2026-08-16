import { valideerBericht } from './schema.js';

// Live bron: EventSource op de stream van showcase-CBT (of de stub), met
// fetch POST om een run te starten.
//
// **Geen automatische herverbinding.** EventSource probeert het uit zichzelf
// na een seconde of drie opnieuw, en dat is precies het gedrag dat hier niet
// deugt: de berichten uit de tussentijd komen nooit meer, dus je krijgt een
// plaat met gaten die er compleet uitziet. De stream is geen buffer. Valt de
// verbinding weg, dan zeggen we dat, laten we staan wat er binnenkwam, en is
// opnieuw beginnen de enige echte herstelactie — die hoort bij de mens achter
// de laptop, niet bij de browser.
//
// Twee manieren waarop de verbinding eindigt, en ze betekenen niet hetzelfde:
// `onLosgekoppeld` is die van onszelf (run klaar, andere bron gekozen, pagina
// weg), `onVerbindingWeg` is die van de andere kant.
export function maakLiveBron({ apiBase, onBericht, onOpen, onLosgekoppeld, onVerbindingWeg }) {
  let source = null;

  function verbind() {
    if (source) return;
    source = new EventSource(`${apiBase}/v1/runs/stream`);

    source.onopen = () => onOpen?.();

    source.onerror = () => {
      // Sluiten vóór het melden: zonder close() gaat de browser alsnog
      // herverbinden, ook al hebben we net gezegd dat de verbinding weg is.
      const gesloten = source;
      source = null;
      gesloten.close();
      onVerbindingWeg?.();
    };

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
    const gesloten = source;
    source = null;
    gesloten.close();
    onLosgekoppeld?.();
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
