import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import PipelineGraph from './PipelineGraph.jsx';
import { maakDeelsysteemLabels } from '../deelsysteemLabels.js';

const LABELS = maakDeelsysteemLabels([
  { id: 'payment', naam: 'Payment' },
  { id: 'order', naam: 'Order' },
]);

const steps = [
  { nr: 1, omgeving: 'code', deelsysteem: 'payment', type: 'actie', stap: 'unit', uitkomst: 'groen' },
  { nr: 2, omgeving: 'code', deelsysteem: 'order', type: 'actie', stap: 'unit', uitkomst: 'groen' },
  { nr: 3, omgeving: 'ci', deelsysteem: 'payment', type: 'gate', stap: 'oordeel', uitkomst: 'groen' },
  { nr: 4, omgeving: 'acceptatie', deelsysteem: 'payment', type: 'actie', stap: 'healthcheck', uitkomst: 'groen' },
  { nr: 5, omgeving: 'acceptatie', deelsysteem: 'order', type: 'actie', stap: 'healthcheck', uitkomst: 'groen' },
  { nr: 6, omgeving: 'acceptatie', deelsysteem: 'keten', type: 'actie', stap: 'gebruikersflow', uitkomst: 'wachtend' },
];

describe('PipelineGraph', () => {
  it('zonder omgevingen-prop: leidt kolommen af uit de stappen, lege omgevingen overgeslagen', () => {
    render(<PipelineGraph steps={steps} labels={LABELS} />);
    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('CI')).toBeInTheDocument();
    expect(screen.getByText('Acceptatie')).toBeInTheDocument();
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
    expect(screen.queryByText('Keten')).not.toBeInTheDocument();
  });

  it('met omgevingen-prop: toont ook een omgeving zonder eigen stap in deze dataset', () => {
    const omgevingen = [
      { key: 'code', label: 'Code' },
      { key: 'ci', label: 'CI' },
      { key: 'test', label: 'Test' },
      { key: 'acceptatie', label: 'Acceptatie' },
    ];
    render(<PipelineGraph steps={steps} omgevingen={omgevingen} labels={LABELS} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders one swimlane row per deelsysteem, in order of first appearance', () => {
    render(<PipelineGraph steps={steps} labels={LABELS} />);
    const laneLabels = screen.getAllByRole('heading', { level: 5 }).map((h) => h.textContent);
    expect(laneLabels).toEqual(['Payment', 'Order', 'Payment + Order']);
  });

  it('puts every deelsysteem-brede stap (keten) as its own swimlane, not mixed with payment/order', () => {
    render(<PipelineGraph steps={steps} labels={LABELS} />);
    const ketenLane = screen.getByText('Payment + Order').closest('.swimlane');
    expect(within(ketenLane).getByText('gebruikersflow')).toBeInTheDocument();
    expect(within(ketenLane).queryByText('unit')).not.toBeInTheDocument();
  });

  it('shows the step number and label for each node on one line', () => {
    render(<PipelineGraph steps={steps} labels={LABELS} />);
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getAllByText('unit')).toHaveLength(2);
  });

  it('toont een statuspil per deelsysteem, met een neutrale default zonder statussen-prop', () => {
    render(<PipelineGraph steps={steps} labels={LABELS} />);
    expect(screen.getAllByText('○ nog niet gestart')).toHaveLength(3);
  });

  it('toont de meegegeven status per deelsysteem, icoon + label', () => {
    render(
      <PipelineGraph
        steps={steps}
        statussen={{ payment: 'succesvol-afgerond', order: 'gestopt', keten: 'lopend' }}
      />
    );
    expect(screen.getByText('✓ afgerond')).toBeInTheDocument();
    expect(screen.getByText('✕ gestopt')).toBeInTheDocument();
    expect(screen.getByText('◐ lopend')).toBeInTheDocument();
  });
});
