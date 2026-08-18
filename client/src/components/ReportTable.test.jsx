import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReportTable from './ReportTable.jsx';
import { maakDeelsysteemLabels } from '../deelsysteemLabels.js';

// De labels komen uit de stamdata van het scenario, niet uit een lijst in de
// code — dus levert de test ze net zo aan als de pagina dat doet.
const LABELS = maakDeelsysteemLabels([
  { id: 'payment', naam: 'Payment' },
  { id: 'order', naam: 'Order' },
]);

const steps = [
  { nr: 1, omgeving: 'code', deelsysteem: 'payment', type: 'actie', stap: 'unit', cli: 'ci/x.sh', uitkomst: 'groen', tijd: '10:00:00', bijzonderheden: 'Tests run: 9' },
  { nr: 2, omgeving: 'code', deelsysteem: 'order', type: 'gate', stap: 'image bouwen', cli: 'ci/y.sh', uitkomst: 'wachtend', tijd: null, bijzonderheden: '' },
];

describe('ReportTable', () => {
  it('shows a Deelsysteem column with the human-readable label per row', () => {
    render(<ReportTable steps={steps} labels={LABELS} />);
    expect(screen.getByRole('columnheader', { name: 'Deelsysteem' })).toBeInTheDocument();

    const rows = screen.getAllByRole('row').slice(1); // skip header row
    expect(rows[0]).toHaveTextContent('Payment');
    expect(rows[1]).toHaveTextContent('Order');
  });

  it('falls back to the raw value for an unknown deelsysteem', () => {
    render(<ReportTable steps={[{ ...steps[0], deelsysteem: 'mystery' }]} labels={LABELS} />);
    expect(screen.getByRole('row', { name: /mystery/ })).toBeInTheDocument();
  });

  it('toont een streepje in plaats van een lege cli-cel voor een niet-uitgevoerde stap', () => {
    const nietUitgevoerd = {
      nr: 3,
      omgeving: 'test',
      deelsysteem: 'payment',
      type: 'actie',
      stap: 'smoke',
      uitkomst: 'niet-uitgevoerd',
      tijd: '10:00:05',
      bijzonderheden: 'pipeline van dit deelsysteem is gestopt',
    };
    render(<ReportTable steps={[nietUitgevoerd]} />);
    const row = screen.getAllByRole('row')[1];
    expect(row).toHaveTextContent('niet uitgevoerd');
    expect(row).toHaveTextContent('—');
  });
});
