// Welke opgeslagen runs in de bronkeuze staan, en onder welk label.
//
// Deze lijst staat los van LiveRunProvider omdat `scripts/opnames.mjs` hem moet
// kunnen lezen: dat script leidt de opnames af uit de stubbundel en toetst dat
// elke opname uit de bundel ook echt af te spelen is. Zonder die toets landt een
// nieuw geleverde opname in de repo en speelt hij nergens — precies het soort
// stilte waar deze showcase over gaat. Een .jsx-bestand kan een node-script niet
// importeren, vandaar een eigen module.
//
// De labels blijven handwerk, en dat is opzettelijk: "begint bij stap 3" is een
// redactionele keuze over wat een kijker moet begrijpen, geen gegeven uit het
// contract. De sleutels zijn dat wel — die moeten kloppen met de bestandsnamen
// die uit de bundel komen.
export const OPGESLAGEN_VARIANTEN = [
  { key: 'voltooid', label: 'opgeslagen run: voltooid' },
  { key: 'gestopt', label: 'opgeslagen run: gestopt' },
  // 'midden' heette zo omdat je er middenin een run instapte. Tegen de bundel
  // is dat niet meer te doen — die roteert op POST en stelt zelf geen
  // momentopname samen — maar deze opname begint nog steeds met een
  // momentopname van een lópende run: stap 1 en 2 afgerond, stap 3 bezig, geen
  // `run-gestart`. Wat hier verdwenen is, is het instappen zelf, niet de
  // berichten die je er als late kijker van kreeg. Vandaar een label over de
  // opname en niet over de kijker.
  { key: 'midden', label: 'opgeslagen run: begint bij stap 3' },
];
