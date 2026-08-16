// Vijf standen, en ze zeggen alle vijf iets anders. "Niet verbonden" dekte
// eerder zowel de rusttoestand als een storing, en dat zijn niet dezelfde
// dingen: tussen runs door luisteren we bewust niet, en dat is geen probleem.
// Een verbinding die van de andere kant wegvalt is dat wél — er komt dan niets
// meer, en er wordt niet automatisch herverbonden (zie contract/eventSourceBron.js).
//
// "Gereed" leunt op één ding: dat de stamdata op deze pagina net van
// showcase-CBT kwam. Kwam hij uit de meegeleverde kopie, dan is dat bewijs er
// niet — dan is showcase-CBT juist aantoonbaar onbereikbaar, en zou "gereed"
// precies de stille onwaarheid zijn die deze showcase afwijst.
export function verbindingsStatus({ bron, connected, verbindingWeg, stamdataUitLokaleKopie }) {
  if (bron !== 'live') return { klasse: 'opgeslagen', tekst: 'opgeslagen run — geen live verbinding' };
  if (connected) return { klasse: 'verbonden', tekst: 'verbonden met showcase-CBT' };
  if (verbindingWeg) return { klasse: 'weg', tekst: 'verbinding met showcase-CBT weggevallen' };
  if (stamdataUitLokaleKopie) return { klasse: 'weg', tekst: 'showcase-CBT niet bereikbaar' };
  return { klasse: 'gereed', tekst: 'showcase-CBT gereed — nog geen run' };
}
