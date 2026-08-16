// Twee aparte bases: de eigen server levert alleen nog content die niet uit
// het contract komt (intro, showcase-tegels — beheerd door de
// testconsultant). Scenario's en runs komen rechtstreeks van showcase-CBT
// (of de stub) — geen proxy ertussen, zie context.md
// "Architectuurprincipe showcase-website" en de CORS-toelichting in de spec.
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
export const CBT_BASE = import.meta.env.VITE_CBT_BASE || 'http://localhost:8090';

export async function fetchIntro() {
  const res = await fetch(`${API_BASE}/api/content/intro`);
  if (!res.ok) throw new Error('kon intro.md niet laden');
  return res.json();
}

export async function fetchShowcases() {
  const res = await fetch(`${API_BASE}/api/content/showcases`);
  if (!res.ok) throw new Error('kon showcases.json niet laden');
  return res.json();
}

export async function fetchScenario(id) {
  const res = await fetch(`${CBT_BASE}/v1/scenarios/${id}`);
  if (!res.ok) throw new Error('kon scenario niet laden');
  return res.json();
}

// Meegeleverde kopie van de stamdata, voor wanneer showcase-CBT niet bereikbaar
// is. Niet elk scenario heeft er een: er ligt alleen wat we ooit echt hebben
// opgehaald, en een bestand verzinnen zou een scenario tonen dat niemand heeft
// gemeten. Ontbreekt hij, dan hoort de pagina te falen en niet te doen alsof.
export async function fetchLokaleScenarioKopie(id) {
  const res = await fetch(`/opgeslagen/scenario-${id}.json`);
  if (!res.ok) throw new Error('geen lokale kopie van dit scenario');
  return res.json();
}
