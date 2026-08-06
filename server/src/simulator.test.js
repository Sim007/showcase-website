import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRunner } from './simulator.js';

const dataset = {
  stappen: [
    { nr: 1, omgeving: 'code', deelsysteem: 'payment', type: 'actie', stap: 'unit', cli: 'ci/x.sh', uitkomst: 'groen' },
    { nr: 2, omgeving: 'ci', deelsysteem: 'payment', type: 'gate', stap: 'oordeel', cli: 'ci/y.sh', uitkomst: 'groen' },
  ],
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('createRunner', () => {
  it('broadcasts run-gestart, een lopend+eind-bericht per stap, dan run-beeindigd', async () => {
    const broadcast = vi.fn();
    const runner = createRunner(broadcast);

    const done = runner.start('01', dataset);
    await vi.runAllTimersAsync();
    await done;

    const types = broadcast.mock.calls.map(([msg]) => msg.type);
    expect(types).toEqual([
      'run-gestart',
      'stap-gestart',
      'stap-beeindigd',
      'stap-gestart',
      'stap-beeindigd',
      'run-beeindigd',
    ]);

    const stapMsgs = broadcast.mock.calls
      .filter(([msg]) => msg.type.startsWith('stap-'))
      .map(([msg]) => msg.stap);
    expect(stapMsgs.map((s) => [s.nr, s.uitkomst])).toEqual([
      [1, 'lopend'],
      [1, 'groen'],
      [2, 'lopend'],
      [2, 'groen'],
    ]);
  });

  it('leaves the final state as klaar with every stap upserted', async () => {
    const runner = createRunner(vi.fn());
    const done = runner.start('01', dataset);
    await vi.runAllTimersAsync();
    await done;

    const state = runner.getState();
    expect(state.status).toBe('klaar');
    expect(state.hoofdstuk).toBe('01');
    expect(state.stappen).toHaveLength(2);
    expect(runner.isRunning()).toBe(false);
  });

  it('refuses a second start while a run is in progress', async () => {
    const runner = createRunner(vi.fn());
    const first = runner.start('01', dataset);
    expect(runner.isRunning()).toBe(true);

    const second = await runner.start('01', dataset);
    expect(second).toBe(false);

    await vi.runAllTimersAsync();
    await first;
  });

  it('reset() clears an idle run and reports success', () => {
    const runner = createRunner(vi.fn());
    expect(runner.reset()).toBe(true);
    expect(runner.getState()).toEqual({ hoofdstuk: null, status: 'idle', stappen: [] });
  });

  it('reset() refuses while a run is in progress', async () => {
    const runner = createRunner(vi.fn());
    const done = runner.start('01', dataset);
    expect(runner.reset()).toBe(false);
    await vi.runAllTimersAsync();
    await done;
  });

  describe('rood pad', () => {
    const datasetMetRodeGate = {
      stappen: [
        { nr: 1, omgeving: 'code', deelsysteem: 'payment', type: 'actie', stap: 'unit', cli: 'ci/a.sh', uitkomst: 'groen', bijzonderheden: 'Tests run: 3' },
        { nr: 2, omgeving: 'ci', deelsysteem: 'payment', type: 'gate', stap: 'oordeel', cli: 'ci/b.sh', uitkomst: 'rood', bijzonderheden: 'contract mismatch' },
        { nr: 3, omgeving: 'test', deelsysteem: 'payment', type: 'actie', stap: 'smoke', cli: 'ci/c.sh', uitkomst: 'groen', bijzonderheden: 'Tests run: 1' },
        { nr: 4, omgeving: 'code', deelsysteem: 'order', type: 'actie', stap: 'unit', cli: 'ci/d.sh', uitkomst: 'groen', bijzonderheden: 'Tests run: 5' },
      ],
    };

    it('stopt alleen de pipeline van het deelsysteem waar de gate niet gehaald wordt', async () => {
      const runner = createRunner(vi.fn());
      const done = runner.start('03', datasetMetRodeGate);
      await vi.runAllTimersAsync();
      await done;

      const perNr = Object.fromEntries(runner.getState().stappen.map((s) => [s.nr, s.uitkomst]));
      expect(perNr).toEqual({ 1: 'groen', 2: 'rood', 3: 'niet-uitgevoerd', 4: 'groen' });
    });

    it('broadcast een deelsysteem-gestopt event zodra de gate niet gehaald wordt', async () => {
      const broadcast = vi.fn();
      const runner = createRunner(broadcast);
      const done = runner.start('03', datasetMetRodeGate);
      await vi.runAllTimersAsync();
      await done;

      const stopEvents = broadcast.mock.calls.map(([msg]) => msg).filter((msg) => msg.type === 'deelsysteem-gestopt');
      expect(stopEvents).toEqual([{ type: 'deelsysteem-gestopt', deelsysteem: 'payment', nr: 2 }]);
    });

    it('stuurt voor een niet-uitgevoerde stap geen stap-gestart, alleen direct een stap-beeindigd', async () => {
      const broadcast = vi.fn();
      const runner = createRunner(broadcast);
      const done = runner.start('03', datasetMetRodeGate);
      await vi.runAllTimersAsync();
      await done;

      const berichtenVoorStap3 = broadcast.mock.calls.map(([msg]) => msg).filter((msg) => msg.stap?.nr === 3);
      expect(berichtenVoorStap3).toHaveLength(1);
      expect(berichtenVoorStap3[0].type).toBe('stap-beeindigd');
      expect(berichtenVoorStap3[0].stap.uitkomst).toBe('niet-uitgevoerd');
      expect(berichtenVoorStap3[0].stap.cli).toBeUndefined();
    });

    it('laat een ander deelsysteem gewoon doorlopen', async () => {
      const broadcast = vi.fn();
      const runner = createRunner(broadcast);
      const done = runner.start('03', datasetMetRodeGate);
      await vi.runAllTimersAsync();
      await done;

      const berichtenVoorStap4 = broadcast.mock.calls.map(([msg]) => msg).filter((msg) => msg.stap?.nr === 4);
      expect(berichtenVoorStap4.map((m) => m.type)).toEqual(['stap-gestart', 'stap-beeindigd']);
    });
  });
});
