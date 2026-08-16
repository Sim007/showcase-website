import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ShowcaseTile from './ShowcaseTile.jsx';

const werktShowcase = { id: '01', titel: 'Basis (API)', beschrijving: 'Contracttesten.', status: 'werkt' };
const binnenkortShowcase = { id: '02', titel: 'Wijziging zonder breuk', beschrijving: 'Additief.', status: 'binnenkort' };

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
});
