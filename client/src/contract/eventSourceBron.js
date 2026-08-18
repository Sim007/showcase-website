import { valideerBericht } from './schema.js';

// Live bron: EventSource op de stream van showcase-CBT (of de stub), met
// fetch POST om een run te starten.
//
// **Eén verbinding per sessie, niet per run** (run-stream 0.11.0). De stream
// blijft tussen runs open en de andere kant sluit hem niet meer; bij verbinden
// komt eerst een momentopname — met `run: null` als er niets loopt — en een
// `POST /v1/runs` start de volgende opname over diezelfde verbinding. Verbinden
// hoort daarmee bij het begin van de sessie en niet bij de startknop: wie pas
// bij Start verbindt, ziet een run die iemand anders startte helemaal niet.
//
// **Geen automatische herverbinding.** EventSource probeert het uit zichzelf
// na een seconde of drie opnieuw, en dat is precies het gedrag dat hier niet
// deugt: de berichten uit de tussentijd komen nooit meer, dus je krijgt een
// dashboard met gaten dat er compleet uitziet. De stream is geen buffer. Valt de
// verbinding weg, dan zeggen we dat, laten we staan wat er binnenkwam, en is
// opnieuw beginnen de enige echte herstelactie — die hoort bij de mens achter
// de laptop, niet bij de browser.
//
// Twee manieren waarop de verbinding eindigt, en ze betekenen niet hetzelfde:
// `onLosgekoppeld` is die van onszelf (andere bron gekozen, pagina weg),
// `onVerbindingWeg` is die van de andere kant. Die laatste krijgt mee of de
// verbinding ooit stond: een stream die nooit openging is niet weggevallen —
// dan is showcase-CBT simpelweg niet bereikbaar, en er staat nog geen stand op
// het dashboard om te bevriezen.
export function maakLiveBron({ apiBase, onBericht, onOpen, onLosgekoppeld, onVerbindingWeg }) {
  let source = null;

  function verbind() {
    if (source) return;
    let ooitVerbonden = false;
    source = new EventSource(`${apiBase}/v1/runs/stream`);

    source.onopen = () => {
      ooitVerbonden = true;
      onOpen?.();
    };

    source.onerror = () => {
      // Sluiten vóór het melden: zonder close() gaat de browser alsnog
      // herverbinden, ook al hebben we net gezegd dat de verbinding weg is.
      const gesloten = source;
      source = null;
      gesloten.close();
      onVerbindingWeg?.({ ooitVerbonden });
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
    // Normaal staat de verbinding er al, sinds het begin van de sessie. Viel
    // hij weg, dan is de startknop de herstelactie — en verbind() is een no-op
    // zolang er een stream staat, dus hier ontstaat nooit een tweede.
    verbind();
    const res = await fetch(`${apiBase}/v1/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId }),
    });
    if (!res.ok) {
      // Verbonden blijven, wat de reden ook is. Bij een 409 loopt er al een run
      // en die volgen we juist over deze verbinding; bij een 400 of 404 is de
      // póging geweigerd, niet de sessie. Ophangen zou een sessiebrede
      // verbinding weggooien om iets wat er los van staat.
      //
      // We reageren op de HTTP-status en niet op `code`: de spec zegt
      // uitdrukkelijk dat die waarden niet bij het contract horen. Het runId van
      // de lopende run staat bij een 409 alleen in `message`, als mensentekst —
      // daar leiden we niets uit af, de stream heeft het ons al verteld.
      const fout = await res.json().catch(() => null);
      console.warn(`start geweigerd (${res.status}):`, fout);
      return { ok: false, fout };
    }
    return { ok: true, run: await res.json() };
  }

  return { verbind, start, stop: verbreek, verbreek };
}
