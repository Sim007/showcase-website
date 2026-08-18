// Verwachtingen worden hier afgeleid uit de stamdata die de pagina zélf krijgt,
// niet opgeschreven als getal of naam.
//
// Waarom: de suite stond kapot omdat hij 20 stappen verwachtte en de inhoud er 6
// werd. Dat is geen inhoudsprobleem maar een testprobleem — het aantal stappen
// was nooit het gedrag dat we wilden vastleggen. Wat we wél willen vastleggen is
// de relatie: de kolommen zijn de omgevingen uit de stamdata, de swimlanes zijn
// de deelsystemen in volgorde van eerste voorkomen. Die relatie geldt voor
// scenario 01 en straks voor 09, hoeveel stappen ze ook hebben.
//
// Dat betekent ook dat deze specs alleen rood gaan als de página iets anders
// toont dan de data zegt. Landt er een scenario met een nieuw deelsysteem, dan
// is dat een echte bevinding en geen onderhoudsklusje aan de test.
export const CBT_BASE = process.env.VITE_CBT_BASE || 'http://localhost:8090';

export async function haalStamdata(request, id) {
  const res = await request.get(`${CBT_BASE}/v1/scenarios/${id}`);
  if (!res.ok()) throw new Error(`GET /v1/scenarios/${id} gaf ${res.status()}`);
  return res.json();
}

// De eerste kolom is de rijkop, de tweede is de code. "Code" is geen omgeving —
// unit- en integratietests draaien op de code zelf — maar wel een kolom, en de
// pagina zet hem er daarom vóór de omgevingen uit het contract.
export function verwachteKolommen(scenario) {
  return ['Pipeline', 'Code', ...scenario.omgevingen.map((o) => o.naam)];
}

// Een stap zonder deelsysteem spant over de keten (Stap-schema). Het contract
// geeft die keten geen naam, dus verwachten we hier geen naam — alleen dat er
// een swimlane is en dat hij een label heeft.
export function verwachteSwimlanes(scenario) {
  const orde = [];
  for (const stap of scenario.stappen) {
    const ds = stap.deelsysteem ?? 'keten';
    if (!orde.includes(ds)) orde.push(ds);
  }
  const namen = new Map(scenario.deelsystemen.map((d) => [d.id, d.naam]));
  return orde.map((id) => ({ id, naam: namen.get(id) ?? null }));
}

export function stapNummers(scenario) {
  return scenario.stappen.map((s) => s.nummer);
}
