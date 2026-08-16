// Bepaalt of een deelsysteem stilstaat doordat de run ophield. Er is geen
// stopsignaal per deelsysteem in het contract — showcase-CBT meldt twee
// feiten (welke stappen afgerond zijn, en dat de run ophield) en wij trekken
// hier de conclusie.
//
// Eén regel dekt twee gevallen die er verschillend uitzien maar hetzelfde
// betekenen: het deelsysteem waarvan een stap mislukte, en het deelsysteem
// dat door diezelfde mislukking nooit aan de beurt kwam. Beide hebben stappen
// die niet groen zijn en krijgen daar nooit meer bericht over. Alleen een
// deelsysteem dat al zijn stappen groen had voordat de run ophield, is
// daadwerkelijk klaar.
export function deelsysteemIsGestopt(stappenVanDitDeelsysteem, runGestopt) {
  if (!runGestopt) return false;
  return stappenVanDitDeelsysteem.some((s) => s.uitkomst !== 'groen');
}

// Leidt de zichtbare status van één deelsysteem af — niet uit het contract
// aangeleverd, want showcase-CBT toetst, showcase-website leidt af (zie
// context.md). `gestopt` komt uit deelsysteemIsGestopt hierboven; de rest
// volgt uit de uitkomsten van de eigen stappen.
//
// Vier statussen, niet drie: naast nog-niet-gestart / succesvol-afgerond /
// gestopt is er ook lopend — een deelsysteem waarvan al stappen liepen maar
// dat nog niet klaar of gestopt is. Zonder die vierde status zou een run die
// halverwege staat onterecht als "nog niet gestart" tonen.
export function deriveDeelsysteemStatus(stappenVanDitDeelsysteem, gestopt) {
  if (gestopt) return 'gestopt';

  const begonnen = stappenVanDitDeelsysteem.filter((s) => s.uitkomst && s.uitkomst !== 'wachtend');
  if (begonnen.length === 0) return 'nog-niet-gestart';

  const allemaalGroen = stappenVanDitDeelsysteem.every((s) => s.uitkomst === 'groen');
  if (allemaalGroen) return 'succesvol-afgerond';

  return 'lopend';
}
