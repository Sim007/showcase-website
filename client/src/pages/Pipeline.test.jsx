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

// De eis is dat de simulatiemodus zonder showcase-CBT werkt. Functioneel doet
// hij dat; wat ontbrak was dat de pagina die weg aanwees. Zonder verbinding is
// starten het enige wat niet kan, en dus het moment om te zeggen wat wel kan.
describe('Pipeline — showcase-CBT niet bereikbaar', () => {
  beforeEach(() => {
    h.waarde = null;
  });

  it('wijst naar de opgeslagen runs als er geen verbinding te maken is', () => {
    toon({ nietBereikbaar: true });
    expect(screen.getByText(/kies linksboven bij de bronkeuze een opgeslagen run/i)).toBeInTheDocument();
  });

  it('bevriest daarvoor niet — er is geen stand die verloren gaat', () => {
    const { container } = toon({ nietBereikbaar: true });
    expect(container.querySelector('.pipeline-page.bevroren')).toBeNull();
    for (const vakje of screen.getAllByRole('checkbox')) {
      expect(vakje).toBeEnabled();
    }
  });

  // Staat er al een opgeslagen run aan, dan is de tip beantwoord en zou hij
  // alleen nog ruis zijn boven een dashboard dat gewoon werkt.
  it('zwijgt zodra er een opgeslagen run gekozen is', () => {
    toon({ nietBereikbaar: true, bron: 'voltooid' });
    expect(screen.queryByText(/kies linksboven bij de bronkeuze/i)).not.toBeInTheDocument();
  });
});

// Een opgeslagen run die niet te laden is. Dit is de fout die je bij een nieuw
// geleverde opname het eerst maakt (verkeerde naam, asset niet meegekomen), en
// zonder deze melding veert de knop terug en gebeurt er niets — de storing die
// het langst duurt voordat iemand hem begrijpt. De controle zelf zit in
// opgeslagenBron.js; hier gaat het erom dat hij in beeld komt.
describe('Pipeline — de opgeslagen run is niet te laden', () => {
  beforeEach(() => {
    h.waarde = null;
  });

  it('zet de reden op de pagina in plaats van hem in de console te laten', () => {
    toon({ bron: '00-voltooid', bronFout: 'opgeslagen stream /opgeslagen/00-voltooid.json bestaat niet of is geen JSON' });
    expect(screen.getByText(/niet af te spelen/i)).toBeInTheDocument();
    expect(screen.getByText(/bestaat niet of is geen JSON/i)).toBeInTheDocument();
  });

  it('zwijgt wanneer er niets mis is', () => {
    toon({ bron: 'voltooid' });
    expect(screen.queryByText(/niet af te spelen/i)).not.toBeInTheDocument();
  });

  // Zonder stamdata valt er niets te tonen, ook geen opgeslagen run. Dan hoort
  // er in elk geval een uitgang te zijn: dit was een pagina met alleen de
  // browserknop terug.
  it('houdt de weg terug open als de stappenlijst helemaal ontbreekt', () => {
    toon({ dataset: null, error: 'Failed to fetch' });
    expect(screen.getByRole('link', { name: /showcase-cbt/i })).toBeInTheDocument();
    expect(screen.getByText(/ook geen opgeslagen run/i)).toBeInTheDocument();
  });
});
