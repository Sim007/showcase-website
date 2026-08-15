// Vertaling aan de grens — hier en nergens anders in de UI. Onbekende
// waarden zijn met opzet niet fataal: ze komen ongewijzigd door, zodat de
// bestaande OUTCOME_META-fallback (OUTCOME_META[x] || OUTCOME_META.wachtend)
// ze opvangt in plaats van dat de client crasht op een enum-uitbreiding.
const UITKOMST_NAAR_KLEUR = { geslaagd: 'groen', mislukt: 'rood' };

export function vertaalUitkomst(uitkomst) {
  if (uitkomst == null) return uitkomst;
  const vertaald = UITKOMST_NAAR_KLEUR[uitkomst];
  if (!vertaald) console.warn(`Onbekende uitkomstwaarde "${uitkomst}" — toon ongewijzigd.`);
  return vertaald || uitkomst;
}

// Stap uit scenario-api (nummer/omschrijving/deelsysteem?/omgeving?) naar de
// vorm die PipelineGraph/CliPanel/ReportTable al kennen (nr/stap/...).
// Afwezig deelsysteem betekent "spant over de keten" (Stap-schema); afwezig
// omgeving betekent "draait op de code, niet op een omgeving" — allebei
// betekenisvolle afwezigheid in het contract, geen waarde in onze eigen
// stamdata. Zie bezwaar 2 uit de verkenning: squad showcase-cbt kijkt of de
// spec dit expliciet genoeg vastlegt.
export function vertaalStap(stap) {
  return {
    nr: stap.nummer,
    type: stap.type,
    stap: stap.omschrijving,
    deelsysteem: stap.deelsysteem ?? 'keten',
    omgeving: stap.omgeving ?? 'code',
    testsoort: stap.testsoort,
    gereedschap: stap.gereedschap,
    cli: stap.cli,
  };
}
