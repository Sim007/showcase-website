// Labels komen uit de stamdata. Elk scenario-antwoord draagt
// `deelsystemen: [{ id, naam }]`, dus een eigen lijst bijhouden betekende
// dezelfde naam op twee plekken — en een deelsysteem dat wij niet kenden kwam
// als id in beeld. Gemeten met verbouwde stamdata: "facturatie" in plaats van
// "Facturatie", op de pil, de swimlane, het cli-paneel en het rapport tegelijk.
//
// Alleen de kleuren blijven code (`--ds-<id>` in styles.css). Een kleur kiezen is
// geen data, en een scenario dat een kleur meelevert zou het contract iets laten
// zeggen over onze weergave.
export const KETEN = 'keten';

// Een stap zonder deelsysteem spant over de keten (Stap-schema). Het contract
// geeft die geen eigen entry, dus er is geen naam om op te halen: die stellen we
// samen uit de deelsystemen die dit scenario heeft, in de volgorde waarin het
// contract ze levert. Bij een derde deelsysteem groeit dat label mee, waar een
// vaste tekst stil onwaar zou worden.
export function maakDeelsysteemLabels(deelsystemen = []) {
  const labels = {};
  for (const ds of deelsystemen) {
    if (ds?.id) labels[ds.id] = ds.naam || ds.id;
  }
  const namen = deelsystemen.map((d) => d?.naam).filter(Boolean);
  if (namen.length) labels[KETEN] = namen.join(' + ');
  return labels;
}

// Valt een deelsysteem buiten de stamdata, dan tonen we de id. Dat is lelijk en
// dat hoort het te zijn: het betekent dat de stream een deelsysteem noemt dat
// het scenario niet kent, en dat is een bevinding en geen weergavekwestie.
export function labelVan(labels, id) {
  return labels?.[id] || id;
}
