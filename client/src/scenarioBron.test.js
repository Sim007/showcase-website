import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { haalScenario, leegScenarioCache, HERKOMST } from './scenarioBron.js';

const SCENARIO = { id: '01', titel: 'Basis (API)', omgevingen: [], deelsystemen: [], stappen: [] };
const origFetch = global.fetch;

function antwoord(body, ok = true) {
  return { ok, json: async () => body };
}

beforeEach(() => {
  leegScenarioCache();
});

afterEach(() => {
  global.fetch = origFetch;
});

describe('haalScenario', () => {
  it('haalt bij showcase-CBT op en meldt dat als herkomst', async () => {
    global.fetch = vi.fn(async () => antwoord(SCENARIO));
    const uitkomst = await haalScenario('01');
    expect(uitkomst.dataset).toEqual(SCENARIO);
    expect(uitkomst.herkomst).toBe(HERKOMST.showcaseCbt);
  });

  it('haalt hetzelfde scenario maar één keer op, ook na navigeren', async () => {
    global.fetch = vi.fn(async () => antwoord(SCENARIO));
    await haalScenario('01');
    await haalScenario('01');
    await haalScenario('01');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('bundelt gelijktijdige aanvragen tot één verzoek', async () => {
    global.fetch = vi.fn(async () => antwoord(SCENARIO));
    await Promise.all([haalScenario('01'), haalScenario('01')]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('valt terug op de lokale kopie als showcase-CBT niet bereikbaar is', async () => {
    global.fetch = vi.fn(async (url) => {
      if (String(url).includes('/v1/scenarios/')) throw new Error('net::ERR_CONNECTION_REFUSED');
      return antwoord(SCENARIO);
    });
    const uitkomst = await haalScenario('01');
    expect(uitkomst.dataset).toEqual(SCENARIO);
    expect(uitkomst.herkomst).toBe(HERKOMST.lokaleKopie);
  });

  it('faalt zichtbaar als er ook geen lokale kopie is, in plaats van iets te verzinnen', async () => {
    global.fetch = vi.fn(async (url) => {
      if (String(url).includes('/v1/scenarios/')) throw new Error('kon scenario niet laden');
      return antwoord(null, false);
    });
    await expect(haalScenario('07')).rejects.toThrow('kon scenario niet laden');
  });

  it('onthoudt een mislukking niet, zodat een herstelde verbinding weer werkt', async () => {
    global.fetch = vi.fn(async () => {
      throw new Error('weg');
    });
    await expect(haalScenario('01')).rejects.toThrow();

    global.fetch = vi.fn(async () => antwoord(SCENARIO));
    const uitkomst = await haalScenario('01');
    expect(uitkomst.herkomst).toBe(HERKOMST.showcaseCbt);
  });
});
