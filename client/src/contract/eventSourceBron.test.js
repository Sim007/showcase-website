import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { maakLiveBron } from './eventSourceBron.js';

class NepEventSource {
  static instanties = [];
  constructor(url) {
    this.url = url;
    this.gesloten = false;
    NepEventSource.instanties.push(this);
  }
  close() {
    this.gesloten = true;
  }
  open() {
    this.onopen?.();
  }
  stuur(bericht) {
    // Een gesloten EventSource levert niets meer af; die eigenschap moet de
    // nep ook hebben, anders toetst een test iets wat de browser nooit doet.
    if (this.gesloten) return;
    this.onmessage?.({ data: JSON.stringify(bericht) });
  }
}

const origEventSource = global.EventSource;
const origFetch = global.fetch;

beforeEach(() => {
  NepEventSource.instanties = [];
  global.EventSource = NepEventSource;
  global.fetch = vi.fn(async () => ({
    ok: true,
    status: 201,
    json: async () => ({ runId: 'run-7c41a9', scenarioId: '01', gestartOp: '2026-08-06T09:12:44Z' }),
  }));
});

afterEach(() => {
  global.EventSource = origEventSource;
  global.fetch = origFetch;
});

const opties = () => ({
  apiBase: 'http://localhost:8090',
  onBericht: vi.fn(),
  onOpen: vi.fn(),
  onLosgekoppeld: vi.fn(),
  onVerbindingWeg: vi.fn(),
});

describe('maakLiveBron', () => {
  it('verbindt niet uit zichzelf bij het aanmaken — de sessie zegt wanneer', () => {
    maakLiveBron(opties());
    expect(NepEventSource.instanties).toHaveLength(0);
  });

  it('opent precies één stream bij verbind, zonder dat er een run gestart is', () => {
    const bron = maakLiveBron(opties());
    bron.verbind();
    expect(NepEventSource.instanties).toHaveLength(1);
    expect(NepEventSource.instanties[0].url).toBe('http://localhost:8090/v1/runs/stream');
  });

  // Eén verbinding per sessie: de start gaat over de stream die er al is. Zou
  // hij een tweede openen, dan kwam de momentopname van die tweede verbinding
  // er dwars doorheen.
  it('hergebruikt de openstaande stream bij een start', async () => {
    const bron = maakLiveBron(opties());
    bron.verbind();
    await bron.start('01');
    await bron.start('01');
    expect(NepEventSource.instanties).toHaveLength(1);
  });

  it('opent precies één stream bij start als er nog niet verbonden was', async () => {
    const bron = maakLiveBron(opties());
    await bron.start('01');
    expect(NepEventSource.instanties).toHaveLength(1);
    expect(NepEventSource.instanties[0].url).toBe('http://localhost:8090/v1/runs/stream');
  });

  it('verbreek sluit de stream, zodat de browser niet uit zichzelf opnieuw verbindt', async () => {
    const bron = maakLiveBron(opties());
    await bron.start('01');
    bron.verbreek();
    expect(NepEventSource.instanties[0].gesloten).toBe(true);
  });

  it('een volgende start opent een verse stream in plaats van de gesloten te hergebruiken', async () => {
    const bron = maakLiveBron(opties());
    await bron.start('01');
    bron.verbreek();
    await bron.start('01');
    expect(NepEventSource.instanties).toHaveLength(2);
    expect(NepEventSource.instanties[1].gesloten).toBe(false);
  });

  // Gemeten tegen stubbundel 0.11.0: een tweede POST /v1/runs tijdens een
  // lopende run geeft 409 met code RUN_LOOPT_AL en het runId van die run in de
  // message-tekst. We hangen aan de status en niet aan die tekst — de spec zegt
  // uitdrukkelijk dat de waarden van `code` niet bij het contract horen.
  it('blijft verbonden bij een 409 — dan loopt er al een run die we juist willen volgen', async () => {
    global.fetch = vi.fn(async () => ({
      ok: false,
      status: 409,
      json: async () => ({ code: 'RUN_LOOPT_AL', message: 'run-7c41a9 loopt nog voor scenario 01' }),
    }));
    const bron = maakLiveBron(opties());
    bron.verbind();
    const uitkomst = await bron.start('01');
    expect(uitkomst.ok).toBe(false);
    expect(NepEventSource.instanties[0].gesloten).toBe(false);
    expect(NepEventSource.instanties).toHaveLength(1);
  });

  // Ook een geweigerde poging is geen reden om op te hangen: de verbinding
  // hoort bij de sessie en niet bij deze ene start.
  it('blijft verbonden bij een 400 op een verzoek dat de spec afkeurt', async () => {
    global.fetch = vi.fn(async () => ({
      ok: false,
      status: 400,
      json: async () => ({ code: 'VERZOEK_ONGELDIG', message: 'data must NOT have additional properties' }),
    }));
    const bron = maakLiveBron(opties());
    bron.verbind();
    const uitkomst = await bron.start('01');
    expect(uitkomst.ok).toBe(false);
    expect(NepEventSource.instanties[0].gesloten).toBe(false);
  });

  it('geeft het runId uit de 201 door — dat is de run die daadwerkelijk gaat spelen', async () => {
    const bron = maakLiveBron(opties());
    bron.verbind();
    const uitkomst = await bron.start('01');
    expect(uitkomst.ok).toBe(true);
    expect(uitkomst.run.runId).toBe('run-7c41a9');
  });

  it('herverbindt niet uit zichzelf: bij een fout gaat de stream dicht', async () => {
    const o = opties();
    const bron = maakLiveBron(o);
    await bron.start('01');
    const stream = NepEventSource.instanties[0];

    stream.onerror();

    // Zonder close() zou de browser na een paar seconden zelf opnieuw
    // verbinden en de berichten uit de tussentijd stil overslaan.
    expect(stream.gesloten).toBe(true);
    expect(NepEventSource.instanties).toHaveLength(1);
  });

  it('meldt een wegvallende verbinding als iets anders dan zelf loskoppelen', async () => {
    const o = opties();
    const bron = maakLiveBron(o);
    await bron.start('01');

    NepEventSource.instanties[0].onerror();
    expect(o.onVerbindingWeg).toHaveBeenCalledTimes(1);
    expect(o.onLosgekoppeld).not.toHaveBeenCalled();

    await bron.start('01');
    bron.verbreek();
    expect(o.onLosgekoppeld).toHaveBeenCalledTimes(1);
    expect(o.onVerbindingWeg).toHaveBeenCalledTimes(1);
  });

  // Nooit verbonden geweest is iets anders dan weggevallen: bij het eerste er
  // is geen stand die je verliest, bij het tweede wel. Alleen het tweede hoort
  // het dashboard te bevriezen.
  it('meldt of de verbinding ooit gestaan heeft toen hij wegviel', () => {
    const o = opties();
    const bron = maakLiveBron(o);

    bron.verbind();
    NepEventSource.instanties[0].onerror();
    expect(o.onVerbindingWeg.mock.calls[0][0]).toEqual({ ooitVerbonden: false });

    bron.verbind();
    NepEventSource.instanties[1].open();
    NepEventSource.instanties[1].onerror();
    expect(o.onVerbindingWeg.mock.calls[1][0]).toEqual({ ooitVerbonden: true });
  });

  it('opent na een weggevallen verbinding een verse stream in plaats van de dode', async () => {
    const bron = maakLiveBron(opties());
    await bron.start('01');
    NepEventSource.instanties[0].onerror();

    await bron.start('01');

    expect(NepEventSource.instanties).toHaveLength(2);
    expect(NepEventSource.instanties[1].gesloten).toBe(false);
  });

  it('geeft alleen geldige berichten door en slaat een onbekend berichttype over', async () => {
    const o = opties();
    const bron = maakLiveBron(o);
    await bron.start('01');
    const stream = NepEventSource.instanties[0];

    stream.stuur({ soort: 'stap-afgerond', tijd: '2026-08-06T09:12:48Z', runId: 'run-7c41a9', stapNummer: 1, uitkomst: 'geslaagd' });
    stream.stuur({ soort: 'deelsysteem-overgeslagen', tijd: '2026-08-06T09:12:55Z', runId: 'run-7c41a9', deelsysteem: 'order' });

    expect(o.onBericht).toHaveBeenCalledTimes(1);
    expect(o.onBericht.mock.calls[0][0].soort).toBe('stap-afgerond');
  });
});
