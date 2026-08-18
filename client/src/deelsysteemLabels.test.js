import { describe, it, expect } from 'vitest';
import { KETEN, maakDeelsysteemLabels, labelVan } from './deelsysteemLabels.js';

describe('maakDeelsysteemLabels', () => {
  it('neemt de naam over die het scenario meelevert', () => {
    const labels = maakDeelsysteemLabels([
      { id: 'payment', naam: 'Payment' },
      { id: 'order', naam: 'Order' },
    ]);
    expect(labels.payment).toBe('Payment');
    expect(labels.order).toBe('Order');
  });

  // Dit is de bevinding die de e2e-suite opleverde toen de stamdata verbouwd
  // werd naar een derde deelsysteem: een naam die wij niet kenden, kwam als id in
  // beeld. Nu komt élke naam uit dezelfde bron als de stappen.
  it('kent ook een deelsysteem dat wij nooit eerder gezien hebben', () => {
    const labels = maakDeelsysteemLabels([
      { id: 'payment', naam: 'Payment' },
      { id: 'facturatie', naam: 'Facturatie' },
    ]);
    expect(labels.facturatie).toBe('Facturatie');
  });

  // Een stap zonder deelsysteem spant over de keten; het contract geeft die geen
  // eigen entry, dus stellen we het label samen uit wat er is — in de volgorde
  // waarin het contract de deelsystemen levert.
  it('stelt het ketenlabel samen uit de deelsystemen van dit scenario', () => {
    expect(
      maakDeelsysteemLabels([
        { id: 'payment', naam: 'Payment' },
        { id: 'order', naam: 'Order' },
      ])[KETEN]
    ).toBe('Payment + Order');
  });

  it('laat het ketenlabel meegroeien met een derde deelsysteem', () => {
    expect(
      maakDeelsysteemLabels([
        { id: 'payment', naam: 'Payment' },
        { id: 'order', naam: 'Order' },
        { id: 'facturatie', naam: 'Facturatie' },
      ])[KETEN]
    ).toBe('Payment + Order + Facturatie');
  });

  it('verzint niets als er geen deelsystemen zijn', () => {
    expect(maakDeelsysteemLabels([])).toEqual({});
    expect(maakDeelsysteemLabels(undefined)).toEqual({});
  });

  // Een deelsysteem zonder naam is een contractafwijking, geen reden om leeg te
  // renderen: dan is de id nog het enige eerlijke dat we hebben.
  it('valt terug op de id als de naam ontbreekt', () => {
    expect(maakDeelsysteemLabels([{ id: 'payment' }]).payment).toBe('payment');
  });
});

describe('labelVan', () => {
  it('geeft het label als het bekend is', () => {
    expect(labelVan({ payment: 'Payment' }, 'payment')).toBe('Payment');
  });

  // De stream noemt dan een deelsysteem dat het scenario niet kent. Dat hoort
  // zichtbaar te zijn als de ruwe waarde, niet weggepoetst.
  it('geeft de ruwe id terug voor een deelsysteem dat het scenario niet kent', () => {
    expect(labelVan({ payment: 'Payment' }, 'mystery')).toBe('mystery');
    expect(labelVan(undefined, 'mystery')).toBe('mystery');
  });
});
