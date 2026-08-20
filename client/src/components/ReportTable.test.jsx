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
  { nr: 1, omgeving: 'code', deelsysteem: 'payment', type: 'actie', stap: 'unit', cli: 'ci/x.sh', uitkomst: 'groen', tijd: '2026-08-06T09:12:48Z', bijzonderheden: 'Tests run: 9' },
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

  // Het rapport toonde de ruwe tijdstempel uit het bericht, dus een run van
  // vandaag stond op de datum van de opname (6 augustus). De kolom rekent nu
  // vanaf de eerste stap die we een tijd van weten.
  it('toont de tijd als afstand tot de start, niet als absolute datum', () => {
    render(
      <ReportTable
        steps={[
          { nr: 1, omgeving: 'ci', deelsysteem: 'payment', type: 'actie', stap: 'unit', cli: 'ci/x.sh', uitkomst: 'groen', tijd: '2026-08-06T09:12:48Z' },
          { nr: 2, omgeving: 'ci', deelsysteem: 'payment', type: 'gate', stap: 'contract', cli: 'ci/y.sh', uitkomst: 'groen', tijd: '2026-08-06T09:12:51Z' },
        ]}
        labels={LABELS}
      />
    );
    const rijen = screen.getAllByRole('row').slice(1);
    expect(rijen[0]).toHaveTextContent('+0:00');
    expect(rijen[1]).toHaveTextContent('+0:03');
    expect(screen.queryByText(/2026-08-06T/)).not.toBeInTheDocument();
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
      tijd: '2026-08-06T09:12:53Z',
      bijzonderheden: 'pipeline van dit deelsysteem is gestopt',
    };
    render(<ReportTable steps={[nietUitgevoerd]} />);
    const row = screen.getAllByRole('row')[1];
    expect(row).toHaveTextContent('niet uitgevoerd');
    expect(row).toHaveTextContent('—');
  });
});
