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
  stuur(bericht) {
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

const opties = () => ({ apiBase: 'http://localhost:8090', onBericht: vi.fn() });

describe('maakLiveBron', () => {
  it('verbindt nog niet bij het aanmaken — pas als er een run te volgen is', () => {
    maakLiveBron(opties());
    expect(NepEventSource.instanties).toHaveLength(0);
  });

  it('opent precies één stream bij start', async () => {
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

  it('blijft verbonden bij een 409 — dan loopt er al een run die we juist willen volgen', async () => {
    global.fetch = vi.fn(async () => ({
      ok: false,
      status: 409,
      json: async () => ({ code: 'RUN_LOOPT_AL', message: 'run-7c41a9 loopt nog' }),
    }));
    const bron = maakLiveBron(opties());
    const uitkomst = await bron.start('01');
    expect(uitkomst.ok).toBe(false);
    expect(NepEventSource.instanties[0].gesloten).toBe(false);
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
