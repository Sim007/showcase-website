// Vier standen, en ze zeggen alle vier iets anders. "Niet verbonden" dekte
// eerder zowel de rusttoestand als een storing, en dat zijn niet dezelfde
// dingen: tussen runs door luisteren we bewust niet, en dat is geen probleem.
// Een verbinding die van de andere kant wegvalt is dat wél — er komt dan niets
// meer, en er wordt niet automatisch herverbonden (zie contract/eventSourceBron.js).
//
// Dat showcase-CBT bereikbaar is weten we los van de stream: de stamdata op de
// pagina kwam er net vandaan.
export function verbindingsStatus({ bron, connected, verbindingWeg }) {
  if (bron !== 'live') return { klasse: 'opgeslagen', tekst: 'opgeslagen run — geen live verbinding' };
  if (connected) return { klasse: 'verbonden', tekst: 'verbonden met showcase-CBT' };
  if (verbindingWeg) return { klasse: 'weg', tekst: 'verbinding met showcase-CBT weggevallen' };
  return { klasse: 'gereed', tekst: 'showcase-CBT gereed — nog geen run' };
}
