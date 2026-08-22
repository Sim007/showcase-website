import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ShowcaseTile from './ShowcaseTile.jsx';

const werktShowcase = { id: '01', titel: 'Basis (API)', beschrijving: 'Contracttesten.', status: 'werkt' };
const binnenkortShowcase = { id: '02', titel: 'Wijziging zonder breuk', beschrijving: 'Additief.', status: 'binnenkort' };
const alleenOpgeslagenShowcase = { id: '00', titel: 'Startsituatie', beschrijving: 'Zonder contracttesten.', status: 'alleen-opgeslagen' };

describe('ShowcaseTile', () => {
  it('links to the scenario route when status is werkt', () => {
    render(<ShowcaseTile showcase={werktShowcase} />, { wrapper: MemoryRouter });
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/scenario/01');
    expect(screen.getByText('● werkt')).toBeInTheDocument();
  });

  it('renders a non-clickable tile when status is binnenkort', () => {
    render(<ShowcaseTile showcase={binnenkortShowcase} />, { wrapper: MemoryRouter });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('○ binnenkort')).toBeInTheDocument();
  });

  // De derde stand, voor scenario 00: openen kan wel, starten nog niet. Hij moet
  // dus doorklikken zoals 'werkt', maar er niet uitzien als 'werkt' — anders is
  // het onderscheid er alleen in de code en niet op het scherm.
  it('links through for alleen-opgeslagen, but says something else than werkt', () => {
    render(<ShowcaseTile showcase={alleenOpgeslagenShowcase} />, { wrapper: MemoryRouter });
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/scenario/00');
    expect(link).toHaveAttribute('data-status', 'alleen-opgeslagen');
    expect(screen.getByText('◑ alleen opgeslagen')).toBeInTheDocument();
    expect(screen.queryByText('● werkt')).not.toBeInTheDocument();
  });

  // Een status die we niet kennen is geen reden om te crashen, en al helemaal
  // geen reden om door te laten klikken: dan weten we niet wat de tegel belooft.
  it('does not let an unknown status click through', () => {
    render(<ShowcaseTile showcase={{ ...binnenkortShowcase, status: 'iets-nieuws' }} />, {
      wrapper: MemoryRouter,
    });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('○ binnenkort')).toBeInTheDocument();
  });
});
