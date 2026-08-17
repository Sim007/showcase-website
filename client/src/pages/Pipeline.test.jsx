import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Alleen de pagina onder test: de databron eromheen is gemockt, zodat we de
// renderbeslissingen kunnen afdwingen zonder een stream of stamdata-fetch.
const h = vi.hoisted(() => ({ waarde: null }));
vi.mock('../usePipelineRun.js', () => ({ usePipelineRun: () => h.waarde }));

import Pipeline from './Pipeline.jsx';

const DATASET = {
  id: '01',
  titel: 'Basis (API)',
  ondertitel: 'Hoe het gaat met contracttesten',
  omgevingen: [{ id: 'ci', naam: 'CI' }, { id: 'acceptatie', naam: 'Acceptatie' }],
};

const STEPS = [
  { nr: 1, deelsysteem: 'payment', omgeving: 'code', type: 'actie', stap: 'unittests', uitkomst: 'groen' },
  { nr: 2, deelsysteem: 'payment', omgeving: 'ci', type: 'gate', stap: 'contract', uitkomst: 'lopend' },
  { nr: 3, deelsysteem: 'order', omgeving: 'ci', type: 'gate', stap: 'contract', uitkomst: 'wachtend' },
];

function toon({ verbindingWeg = false, ...rest } = {}) {
  h.waarde = {
    dataset: DATASET,
    steps: STEPS,
    deelsysteemStatussen: {},
    error: null,
    stamdataUitLokaleKopie: false,
    bron: 'live',
    setBron: () => {},
    connected: false,
    verbindingWeg,
    running: false,
    scenarioId: null,
    start: () => {},
    ...rest,
  };
  return render(
    <MemoryRouter initialEntries={['/scenario/01']}>
      <Routes>
        <Route path="/scenario/:id" element={<Pipeline />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Pipeline — bevroren dashboard', () => {
  beforeEach(() => {
    h.waarde = null;
  });

  it('vergrijst niet zolang de verbinding er is', () => {
    const { container } = toon();
    expect(container.querySelector('.pipeline-page.bevroren')).toBeNull();
    expect(screen.queryByText(/laatste bekende stand/i)).not.toBeInTheDocument();
  });

  // Het hele dashboard bevriest, niet alleen de lopende stap: de wachtende
  // stappen beweren dat ze nog aan de beurt komen, en dat wordt op hetzelfde
  // moment onwaar. Vandaar één klasse op de pagina in plaats van per status.
  it('zet de bevroren-klasse op de hele pagina bij verbindingsverlies', () => {
    const { container } = toon({ verbindingWeg: true });
    expect(container.querySelector('.pipeline-page.bevroren')).not.toBeNull();
  });

  // De indicator bovenin zegt hetzelfde, dus expliciet op de melding zoeken —
  // anders is dit een test die groen blijft als de melding verdwijnt.
  it('zet er één regel boven die zegt wat je ziet', () => {
    const { container } = toon({ verbindingWeg: true });
    const meldingen = container.querySelectorAll('.bevroren-melding');
    expect(meldingen).toHaveLength(1);
    expect(meldingen[0].textContent).toMatch(/laatste bekende stand/i);
  });

  // Vergrijzen alleen is niet genoeg: pointer-events houdt de muis tegen, maar
  // een gefocust aanvinkvakje bleef met de spatiebalk schakelen. Dan zou je een
  // swimlane kunnen verbergen in een beeld dat niets meer bijhoudt.
  it('sluit de deelsysteem-vakjes af, niet alleen visueel', () => {
    toon({ verbindingWeg: true });
    for (const vakje of screen.getAllByRole('checkbox')) {
      expect(vakje).toBeDisabled();
    }
  });

  it('laat de startknop wél leven — opnieuw starten is de herstelactie', () => {
    toon({ verbindingWeg: true });
    expect(screen.getByRole('button', { name: 'Start scenario' })).toBeEnabled();
  });
});
