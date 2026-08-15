import { valideerBericht } from './schema.js';

// Live bron: EventSource op de stream van showcase-CBT (of de stub), met
// fetch POST om een run te starten. Zelfde tolerantie als de opgeslagen
// bron: onbekend berichttype of ongeldige vorm wordt overgeslagen, nooit
// een crash.
export function maakLiveBron({ apiBase, onBericht, onOpen, onClose }) {
  const source = new EventSource(`${apiBase}/v1/runs/stream`);

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

  async function start(scenarioId) {
    const res = await fetch(`${apiBase}/v1/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId }),
    });
    if (res.status === 409) {
      const fout = await res.json();
      console.warn('Er loopt al een run:', fout);
      return { ok: false, fout };
    }
    if (!res.ok) return { ok: false, fout: await res.json().catch(() => null) };
    return { ok: true, run: await res.json() };
  }

  function stop() {
    source.close();
  }

  return { start, stop };
}
