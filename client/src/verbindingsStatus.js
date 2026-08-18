// Vijf standen, en ze zeggen alle vijf iets anders. "Niet verbonden" dekte
// eerder zowel de rusttoestand als een storing. Die rusttoestand is er niet
// meer: de stream staat open vanaf het begin van de sessie en blijft tussen
// runs open (run-stream 0.11.0), dus "verbonden" is nu de normale stand en niet
// het teken dat er iets loopt. Wat er wél toe doet is het onderscheid tussen een
// verbinding die wegvalt — er komt dan niets meer, en er wordt niet automatisch
// herverbonden (zie contract/eventSourceBron.js) — en een verbinding die nooit
// tot stand kwam. Dat laatste is geen storing tijdens het kijken maar een
// showcase-CBT die er niet is.
//
// "Gereed" is daarmee alleen nog het gaatje tussen openen en open zijn: we
// hebben verbonden en de eerste momentopname is nog onderweg.
//
// "Gereed" leunt op één ding: dat de stamdata op deze pagina net van
// showcase-CBT kwam. Kwam hij uit de meegeleverde kopie, dan is dat bewijs er
// niet — dan is showcase-CBT juist aantoonbaar onbereikbaar, en zou "gereed"
// precies de stille onwaarheid zijn die deze showcase afwijst.
export function verbindingsStatus({ bron, connected, verbindingWeg, nietBereikbaar, stamdataUitLokaleKopie }) {
  if (bron !== 'live') return { klasse: 'opgeslagen', tekst: 'opgeslagen run — geen live verbinding' };
  if (connected) return { klasse: 'verbonden', tekst: 'verbonden met showcase-CBT' };
  if (verbindingWeg) return { klasse: 'weg', tekst: 'verbinding met showcase-CBT weggevallen' };
  if (nietBereikbaar || stamdataUitLokaleKopie) return { klasse: 'weg', tekst: 'showcase-CBT niet bereikbaar' };
  return { klasse: 'gereed', tekst: 'showcase-CBT gereed — nog geen run' };
}
