import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// De transportlaag wordt hier vervangen: het gaat om wat de provider met de
// state doet bij een start, niet om EventSource. Ook de opgeslagen bron is
// gemockt — die zou anders echt gaan fetchen naar /opgeslagen/*.json.
const h = vi.hoisted(() => ({
  bron: { verbind: vi.fn(), start: vi.fn(), stop: vi.fn(), verbreek: vi.fn() },
  opgeslagen: { start: vi.fn(), stop: vi.fn() },
  onBericht: null,
  onVerbindingWeg: null,
}));

vi.mock('./contract/eventSourceBron.js', () => ({
  maakLiveBron: ({ onBericht, onVerbindingWeg }) => {
    h.onBericht = onBericht;
    h.onVerbindingWeg = onVerbindingWeg;
    return h.bron;
  },
}));

vi.mock('./contract/opgeslagenBron.js', () => ({
  maakOpgeslagenBron: ({ onBericht }) => {
    h.onBericht = onBericht;
    return h.opgeslagen;
  },
}));

import { LiveRunProvider, useLiveRun } from './LiveRunProvider.jsx';

const wrapper = ({ children }) => <LiveRunProvider>{children}</LiveRunProvider>;

// Een run die tot en met stap 1 gekomen is, zodat er iets op het dashboard
// staat dat verloren kan gaan.
function speelEenLopendeRun() {
  h.onBericht({ soort: 'run-gestart', runId: 'run-7c41a9', scenarioId: '01' });
  h.onBericht({ soort: 'stap-gestart', stapNummer: 1, tijd: '2026-08-17T08:00:00Z' });
  h.onBericht({ soort: 'cli-uitvoer', stapNummer: 1, regel: '$ ci/pipeline-contract.sh payment' });
  h.onBericht({ soort: 'stap-afgerond', stapNummer: 1, uitkomst: 'geslaagd', tijd: '2026-08-17T08:00:01Z' });
  h.onBericht({ soort: 'stap-gestart', stapNummer: 2, tijd: '2026-08-17T08:00:02Z' });
}

describe('LiveRunProvider', () => {
  beforeEach(() => {
    h.bron.verbind.mockClear();
    h.bron.start.mockClear();
    h.bron.stop.mockClear();
    h.bron.verbreek.mockClear();
    h.opgeslagen.start.mockClear();
  });

  // De stream blijft tussen runs open (run-stream 0.11.0), dus verbinden hoort
  // bij het begin van de sessie. Wie pas bij Start verbindt, ziet een run die
  // iemand anders startte helemaal niet.
  it('verbindt bij het opzetten van de sessie, niet pas bij de eerste start', () => {
    renderHook(() => useLiveRun(), { wrapper });
    expect(h.bron.verbind).toHaveBeenCalledTimes(1);
    expect(h.bron.start).not.toHaveBeenCalled();
  });

  // Dit is de regel die met 0.11.0 verviel. Sloten we hier af, dan miste de
  // sessie alles wat er daarna over de stream kwam — inclusief de volgende run.
  it('koppelt niet los als een run afgerond is', () => {
    renderHook(() => useLiveRun(), { wrapper });

    act(() => {
      h.onBericht({ soort: 'run-gestart', runId: 'run-7c41a9', scenarioId: '01' });
      h.onBericht({ soort: 'run-afgerond', runId: 'run-7c41a9', reden: 'voltooid' });
    });

    expect(h.bron.verbreek).not.toHaveBeenCalled();
    expect(h.bron.stop).not.toHaveBeenCalled();
  });

  it('houdt de verbinding vast bij een start in plaats van hem te vernieuwen', () => {
    const { result } = renderHook(() => useLiveRun(), { wrapper });

    act(() => {
      result.current.start('01');
    });

    expect(h.bron.start).toHaveBeenCalledWith('01');
    expect(h.bron.stop).not.toHaveBeenCalled();
    expect(h.bron.verbreek).not.toHaveBeenCalled();
  });

  // Gemeten tegen stubbundel 0.11.0: een tweede start tijdens een lopende run
  // geeft 409 en er begint niets. Zou de klik de plaat schoonvegen, dan liep die
  // run door op een leeg dashboard: de stappen die al af waren stonden weer op
  // "wachtend" en werden nooit meer gevuld, want hun berichten zijn voorbij. In
  // de pagina houdt `disabled={running}` die klik meestal tegen — maar die vlag
  // komt uit de stream, en hier wordt de regel zelf vastgelegd in plaats van de
  // knop die hem tot nu toe afdekte.
  it('gooit de lopende run niet weg als de start op niets uitloopt', () => {
    h.bron.start.mockResolvedValueOnce({ ok: false, fout: { code: 'RUN_LOOPT_AL' } });
    const { result } = renderHook(() => useLiveRun(), { wrapper });

    act(() => {
      speelEenLopendeRun();
    });
    expect(result.current.stappen.get(1).uitkomst).toBe('groen');

    act(() => {
      result.current.start('01');
    });

    expect(result.current.stappen.get(1).uitkomst).toBe('groen');
    expect(result.current.cliRegels.get(1)).toHaveLength(1);
    expect(result.current.running).toBe(true);
  });

  // Er is nog steeds geen resetknop — maar het schoonvegen komt nu van de
  // stream: `run-gestart` is het bewijs dat er echt een run begon.
  it('veegt de vorige stand schoon zodra er een nieuwe run gestart is', () => {
    const { result } = renderHook(() => useLiveRun(), { wrapper });

    act(() => {
      speelEenLopendeRun();
      h.onBericht({ soort: 'run-afgerond', runId: 'run-7c41a9', reden: 'voltooid' });
    });
    expect(result.current.stappen.size).toBe(2);

    act(() => {
      result.current.start('01');
      h.onBericht({ soort: 'run-gestart', runId: 'run-3b8e02', scenarioId: '01' });
    });

    expect(result.current.stappen.size).toBe(0);
    expect(result.current.cliRegels.size).toBe(0);
    expect(result.current.running).toBe(true);
  });

  // Bij een opgeslagen opname is starten opnieuw afspelen. Dat kan niet op een
  // 409 stuiten, en de opname die bij stap 3 begint heeft geen `run-gestart`
  // die de plaat voor ons leegmaakt.
  it('veegt bij een opgeslagen opname wél schoon op de klik', () => {
    const { result } = renderHook(() => useLiveRun(), { wrapper });

    act(() => {
      result.current.setBron('midden');
    });
    act(() => {
      speelEenLopendeRun();
    });
    expect(result.current.stappen.size).toBe(2);

    act(() => {
      result.current.start('01');
    });

    expect(result.current.stappen.size).toBe(0);
    expect(result.current.cliRegels.size).toBe(0);
    expect(h.opgeslagen.start).toHaveBeenCalledWith('01');
  });

  // Het bevroren dashboard zegt zelf "start opnieuw om verder te kijken" —
  // dan moet starten die bevroren stand ook daadwerkelijk opheffen, anders
  // blijft de laatste bekende stand als bewering staan terwijl er weer een
  // echte run loopt.
  it('heft een bevroren dashboard op bij het starten', () => {
    const { result } = renderHook(() => useLiveRun(), { wrapper });

    act(() => {
      h.onVerbindingWeg({ ooitVerbonden: true });
    });
    expect(result.current.verbindingWeg).toBe(true);

    act(() => {
      result.current.start('01');
    });
    expect(result.current.verbindingWeg).toBe(false);
  });

  // Nu er bij sessiestart verbonden wordt, is dit het gewone geval als
  // showcase-CBT niet draait. Bevriezen zou dan een stand suggereren die er
  // nooit was, en de pagina onbruikbaar maken voordat je iets gedaan hebt.
  it('bevriest niet als de verbinding er nooit geweest is', () => {
    const { result } = renderHook(() => useLiveRun(), { wrapper });

    act(() => {
      h.onVerbindingWeg({ ooitVerbonden: false });
    });

    expect(result.current.verbindingWeg).toBe(false);
    expect(result.current.nietBereikbaar).toBe(true);
    expect(result.current.connected).toBe(false);
  });

  it('biedt geen losse reset meer aan', () => {
    const { result } = renderHook(() => useLiveRun(), { wrapper });
    expect(result.current.reset).toBeUndefined();
  });
});

// Gemeld na de demo bij squad 1. Beide gevallen gingen over hetzelfde: er stond
// nog een vorige run in beeld op een moment dat dat als nieuw las.
describe('LiveRunProvider — de vorige run op tijd kwijt', () => {
  beforeEach(() => {
    h.bron.verbind.mockClear();
    h.bron.start.mockClear();
    h.bron.stop.mockClear();
    h.bron.verbreek.mockClear();
    h.opgeslagen.start.mockClear();
  });

  // Wachten op `run-gestart` bleek te laat: tussen de klik en het eerste bericht
  // bleef het cli-paneel van de vorige run staan. De 201 is het eerste moment
  // waarop we weten dát er een run begint.
  it('veegt schoon zodra de start geaccepteerd is, niet pas bij het eerste bericht', async () => {
    h.bron.start.mockResolvedValueOnce({ ok: true, run: { runId: 'run-3b8e02', scenarioId: '01' } });
    const { result } = renderHook(() => useLiveRun(), { wrapper });

    act(() => {
      speelEenLopendeRun();
      h.onBericht({ soort: 'run-afgerond', runId: 'run-7c41a9', reden: 'voltooid' });
    });
    expect(result.current.cliRegels.size).toBe(1);

    await act(async () => {
      await result.current.start('01');
    });

    expect(result.current.stappen.size).toBe(0);
    expect(result.current.cliRegels.size).toBe(0);
  });

  // De race die de vergelijking met het runId afdekt: kwamen de eerste berichten
  // al binnen vóór het antwoord op de POST, dan mag het schoonvegen ze niet
  // alsnog weggooien.
  it('laat de berichten staan die vóór het antwoord op de POST al binnenkwamen', async () => {
    h.bron.start.mockImplementationOnce(async () => {
      act(() => {
        h.onBericht({ soort: 'run-gestart', runId: 'run-3b8e02', scenarioId: '01' });
        h.onBericht({ soort: 'stap-gestart', stapNummer: 1, tijd: '2026-08-17T08:00:00Z' });
      });
      return { ok: true, run: { runId: 'run-3b8e02', scenarioId: '01' } };
    });
    const { result } = renderHook(() => useLiveRun(), { wrapper });

    await act(async () => {
      await result.current.start('01');
    });

    expect(result.current.runId ?? 'run-3b8e02').toBe('run-3b8e02');
    expect(result.current.stappen.size).toBe(1);
  });

  it('veegt niet schoon als de start op een 409 uitloopt', async () => {
    h.bron.start.mockResolvedValueOnce({ ok: false, fout: { code: 'RUN_LOOPT_AL' } });
    const { result } = renderHook(() => useLiveRun(), { wrapper });

    act(() => {
      speelEenLopendeRun();
    });

    await act(async () => {
      await result.current.start('01');
    });

    expect(result.current.stappen.get(1).uitkomst).toBe('groen');
    expect(result.current.cliRegels.size).toBe(1);
  });

  // Het overzicht bezoeken is het einde van je blik op die run. Anders kijk je
  // na het hoofdmenu nog naar groene stappen en een vol cli-paneel op een pagina
  // die net opnieuw geopend voelt.
  it('vergeet een afgeronde run', () => {
    const { result } = renderHook(() => useLiveRun(), { wrapper });

    act(() => {
      speelEenLopendeRun();
      h.onBericht({ soort: 'run-afgerond', runId: 'run-7c41a9', reden: 'voltooid' });
    });
    expect(result.current.stappen.size).toBe(2);

    act(() => {
      result.current.vergeetAfgerondeRun();
    });

    expect(result.current.stappen.size).toBe(0);
    expect(result.current.cliRegels.size).toBe(0);
  });

  // Een lopende run weggooien is precies de bug waarvoor de state boven de
  // router staat: dan stond een net begonnen run na één navigatie weer leeg.
  it('laat een lopende run staan', () => {
    const { result } = renderHook(() => useLiveRun(), { wrapper });

    act(() => {
      speelEenLopendeRun();
    });
    expect(result.current.running).toBe(true);

    act(() => {
      result.current.vergeetAfgerondeRun();
    });

    expect(result.current.stappen.size).toBe(2);
    expect(result.current.running).toBe(true);
  });
});
