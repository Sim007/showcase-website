import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { maakOpgeslagenBron } from './opgeslagenBron.js';

// Een opname wordt over het net geladen, ook in de opgeslagen modus: het is een
// bestand naast de app. De nep moet dus een echte Response nadoen, inclusief de
// koptekst waar de controle op leunt.
function nepAntwoord({ status = 200, type = 'application/json', body = [] } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (naam) => (naam.toLowerCase() === 'content-type' ? type : null) },
    json: async () => {
      if (typeof body === 'string') throw new SyntaxError(`Unexpected token '<', "${body.slice(0, 10)}"... is not valid JSON`);
      return body;
    },
  };
}

const origFetch = global.fetch;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  global.fetch = origFetch;
});

const berichten = [
  { soort: 'run-gestart', tijd: '2026-08-06T09:12:45Z', runId: 'run-3b8e02', scenarioId: '01' },
  { soort: 'stap-gestart', tijd: '2026-08-06T09:12:47Z', runId: 'run-3b8e02', stapNummer: 1 },
];

describe('maakOpgeslagenBron', () => {
  it('speelt de berichten af op de tijdstempels die erin staan', async () => {
    global.fetch = vi.fn(async () => nepAntwoord({ body: berichten }));
    const ontvangen = [];
    const bron = maakOpgeslagenBron({ pad: '/opgeslagen/voltooid.json', onBericht: (b) => ontvangen.push(b) });

    await bron.start();
    await vi.advanceTimersByTimeAsync(0); // het eerste bericht staat op vertraging 0
    expect(ontvangen).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(2000); // twee seconden later in de opname
    expect(ontvangen.map((b) => b.soort)).toEqual(['run-gestart', 'stap-gestart']);
  });

  // De reden dat deze controle bestaat: een ontbrekende opname komt niet als 404
  // binnen. De dev-server en een statische host met SPA-terugval geven de
  // index-HTML met status 200, dus alleen `res.ok` toetsen laat dit door tot
  // `res.json()` erover valt. Gemeten op 22-08 tegen de dev-server op 5173:
  // HTTP 200, content-type text/html, en dan SyntaxError over een '<'.
  it('zegt dat de opname niet bestaat wanneer de server HTML teruggeeft met 200', async () => {
    global.fetch = vi.fn(async () => nepAntwoord({ type: 'text/html', body: '<!doctype html>' }));
    const bron = maakOpgeslagenBron({ pad: '/opgeslagen/00-voltooid.json', onBericht: () => {} });

    await expect(bron.start()).rejects.toThrow(/bestaat niet of is geen JSON/);
    // En niet de melding die je hiervóór kreeg, die over de vorm van JSON gaat
    // in plaats van over het ontbrekende bestand.
    await expect(bron.start()).rejects.not.toThrow(/Unexpected token/);
  });

  it('noemt de status wanneer het laden echt mislukt', async () => {
    global.fetch = vi.fn(async () => nepAntwoord({ status: 500, type: 'text/plain' }));
    const bron = maakOpgeslagenBron({ pad: '/opgeslagen/voltooid.json', onBericht: () => {} });

    await expect(bron.start()).rejects.toThrow(/kon opgeslagen stream niet laden.*HTTP 500/);
  });

  // In dezelfde map staan de stamdatakopieën, en die zijn objecten. Het
  // verkeerde bestand aanwijzen hoort hier te stoppen, met een melding over wat
  // er staat, en niet verderop op een `.map` die niet bestaat.
  it('weigert een JSON-object in plaats van een lijst berichten', async () => {
    global.fetch = vi.fn(async () => nepAntwoord({ body: { id: '01', stappen: [] } }));
    const bron = maakOpgeslagenBron({ pad: '/opgeslagen/scenario-01.json', onBericht: () => {} });

    await expect(bron.start()).rejects.toThrow(/geen lijst berichten maar object/);
  });

  it('laadt één keer, ook bij opnieuw afspelen', async () => {
    global.fetch = vi.fn(async () => nepAntwoord({ body: berichten }));
    const bron = maakOpgeslagenBron({ pad: '/opgeslagen/voltooid.json', onBericht: () => {} });

    await bron.start();
    await bron.start();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
