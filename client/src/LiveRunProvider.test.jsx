import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// De transportlaag wordt hier vervangen: het gaat om wat de provider met de
// state doet bij een start, niet om EventSource.
const h = vi.hoisted(() => ({
  bron: { start: vi.fn(), stop: vi.fn(), verbreek: vi.fn() },
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

import { LiveRunProvider, useLiveRun } from './LiveRunProvider.jsx';

const wrapper = ({ children }) => <LiveRunProvider>{children}</LiveRunProvider>;

describe('LiveRunProvider', () => {
  beforeEach(() => {
    h.bron.start.mockClear();
    h.bron.stop.mockClear();
  });

  // Er is geen resetknop meer: starten ís de reset. Zonder dit schoonvegen
  // blijft de vorige run in beeld staan tot de nieuwe run diezelfde stap
  // toevallig overschrijft — en de stappen die de nieuwe run níét raakt zouden
  // een uitkomst tonen die bij een run hoort die al voorbij is.
  it('veegt de vorige stand schoon voordat de nieuwe run begint', () => {
    const { result } = renderHook(() => useLiveRun(), { wrapper });

    act(() => {
      h.onBericht({ soort: 'run-gestart', runId: 'r1', scenarioId: '01' });
      h.onBericht({ soort: 'stap-gestart', stapNummer: 1, tijd: '2026-08-17T08:00:00Z' });
    });
    expect(result.current.stappen.size).toBe(1);
    expect(result.current.running).toBe(true);

    act(() => {
      result.current.start('01');
    });

    expect(result.current.stappen.size).toBe(0);
    expect(result.current.cliRegels.size).toBe(0);
    expect(result.current.running).toBe(false);
    expect(result.current.scenarioId).toBe(null);
  });

  it('stopt de lopende bron vóór het starten, niet erna', () => {
    const { result } = renderHook(() => useLiveRun(), { wrapper });

    act(() => {
      result.current.start('01');
    });

    expect(h.bron.stop).toHaveBeenCalledTimes(1);
    expect(h.bron.start).toHaveBeenCalledWith('01');
    expect(h.bron.stop.mock.invocationCallOrder[0]).toBeLessThan(
      h.bron.start.mock.invocationCallOrder[0]
    );
  });

  // Het bevroren dashboard zegt zelf "start opnieuw om verder te kijken" —
  // dan moet starten die bevroren stand ook daadwerkelijk opheffen, anders
  // blijft de laatste bekende stand als bewering staan terwijl er weer een
  // echte run loopt.
  it('heft een bevroren dashboard op bij het starten', () => {
    const { result } = renderHook(() => useLiveRun(), { wrapper });

    act(() => {
      h.onVerbindingWeg();
    });
    expect(result.current.verbindingWeg).toBe(true);

    act(() => {
      result.current.start('01');
    });
    expect(result.current.verbindingWeg).toBe(false);
  });

  it('biedt geen losse reset meer aan', () => {
    const { result } = renderHook(() => useLiveRun(), { wrapper });
    expect(result.current.reset).toBeUndefined();
  });
});
