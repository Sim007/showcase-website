import { Link } from 'react-router-dom';

// Drie standen, en het verschil tussen de tweede en de derde is de kern van deze
// showcase.
//
// `werkt` betekent: openen én starten doen dit scenario. Dat is een harde
// belofte en er staat een test op (`e2e/landing.spec.js`) die een run start om
// hem na te gaan.
//
// `alleen-opgeslagen` bestaat sinds bundel 0.13.0, voor scenario 00. Openen doet
// dit scenario — eigen titel, eigen stappen — en er is een echte opname om af te
// spelen, maar starten kan nog niet: de stub kijkt niet naar het gevraagde id en
// speelt de volgende opname uit een rotatie die alleen scenario 01 bevat.
// Gemeten: `POST /v1/runs {"scenarioId":"00"}` geeft 201 met `scenarioId: "01"`.
//
// Die stand op `werkt` zetten zou half werkend zijn, en dat is voor een tegel
// erger dan niet werkend. Hem op `binnenkort` laten is óók onwaar, want er valt
// wel degelijk iets te zien. Vandaar een eigen woord dat precies zegt wat het is.
const STANDEN = {
  werkt: { klasse: 'werkt', tekst: '● werkt', klikbaar: true },
  'alleen-opgeslagen': { klasse: 'alleen-opgeslagen', tekst: '◑ alleen opgeslagen', klikbaar: true },
  binnenkort: { klasse: 'binnenkort', tekst: '○ binnenkort', klikbaar: false },
};

export default function ShowcaseTile({ showcase }) {
  // Een onbekende status is geen reden om te crashen en al helemaal geen reden
  // om door te laten klikken: dan weten we niet wat de tegel belooft.
  const stand = STANDEN[showcase.status] ?? STANDEN.binnenkort;
  const content = (
    <>
      <div className="nr">Scenario {showcase.id}</div>
      <h3>{showcase.titel}</h3>
      <p>{showcase.beschrijving}</p>
      <span className={`badge ${stand.klasse}`}>{stand.tekst}</span>
    </>
  );

  if (stand.klikbaar) {
    return (
      <Link
        className="tile"
        data-clickable="true"
        data-status={showcase.status}
        to={`/scenario/${showcase.id}`}
      >
        {content}
      </Link>
    );
  }
  return (
    <div className="tile" data-clickable="false" data-status={showcase.status}>
      {content}
    </div>
  );
}
