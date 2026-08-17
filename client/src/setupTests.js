import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// jsdom implementeert Element.scrollTo niet. CliPanel scrollt zichzelf naar
// beneden bij nieuwe regels, dus elke test die een pagina mét dat paneel rendert
// zou hierop stuklopen. Een lege stub is genoeg: het scrollgedrag is niets om op
// te beweren in een omgeving zonder layout — dat hoort in de e2e-tests.
if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = () => {};
}

afterEach(() => {
  cleanup();
});
