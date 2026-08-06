// Leidt de zichtbare status van één deelsysteem af — niet uit het contract
// aangeleverd, want showcase-CBT toetst, showcase-website leidt af (zie
// context.md). `gestopt` komt uit het expliciete stopsignaal van de stream;
// de rest volgt uit de uitkomsten van de eigen stappen.
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
