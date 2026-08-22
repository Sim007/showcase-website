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
//
// `scenarioId` staat er sinds bundel 0.13.0 bij, want vanaf dan zijn er opnames
// van méér dan één scenario. De bronkeuze geldt voor de hele sessie, dus je kunt
// op de pagina van 01 een opname van 00 kiezen; dan zegt de pagina dat, maar het
// label hoort het al te zeggen. Het is een bewering, dus `npm run opnames`
// toetst hem tegen het scenarioId in de opname zelf.
export const OPGESLAGEN_VARIANTEN = [
  { key: 'voltooid', scenarioId: '01', label: 'opgeslagen run: 01 voltooid' },
  { key: 'gestopt', scenarioId: '01', label: 'opgeslagen run: 01 gestopt' },
  // 'midden' heette zo omdat je er middenin een run instapte. Deze opname begint
  // met een momentopname van een lópende run — stap 1 en 2 afgerond, stap 3
  // bezig, geen `run-gestart` — dus het label gaat over de opname en niet over
  // de kijker.
  //
  // Instappen zélf kan sinds bundel 0.11.1 weer tegen de stub: verbind een tweede
  // keer tijdens een lopende run en hij stelt de momentopname samen uit wat hij
  // verstuurd heeft. Nagemeten tegen 0.13.0 op 22-08-2026: twaalf seconden na de
  // start kwam er een momentopname met negen afgeronde stappen en
  // `lopendeStap: 10`. Deze opname is dus niet meer de enige plek waar dat geval
  // te zien is — hij is wel de plek waar het deterministisch is.
  { key: 'midden', scenarioId: '01', label: 'opgeslagen run: 01 begint bij stap 3' },
  // De eerste échte opname in de bundel: 87 seconden van een werkelijke run van
  // scenario 00, niet afgeleid uit de stamdata. Dat verschil is voor deze
  // showcase het punt, dus het staat in het label.
  { key: '00-voltooid', scenarioId: '00', label: 'opgeslagen run: 00 voltooid (echte opname)' },
];
