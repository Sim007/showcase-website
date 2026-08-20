// De `tijd` op een bericht is het moment volgens showcase-CBT, niet het moment
// waarop wij het lazen. Bij een opgeslagen of afgespeelde opname is dat dus een
// tijdstempel uit het verleden: de fixtures uit de stubbundel staan op
// 2026-08-06 09:12. Het rapport zette die waarde ruw in de kolom, waardoor er
// gisteren bij een demo "2026-08-06T09:12:48Z" stond bij een run van dat moment.
// Dat is niet fout gelezen — het is precies wat er in het bericht staat — maar
// het leest als een datum die niet klopt.
//
// Daarom staat in de tabel hoe lang ná de start van de run een stap klaar was.
// Dat is waar voor een live run en voor een afgespeelde opname, en het bevat
// niets wat wij zelf verzinnen. Het absolute moment van de provider blijft
// beschikbaar op de rij zelf, en de start staat één keer boven de tabel.
//
// Wij verzinnen met opzet geen ontvangsttijd. "Toen wij dit bericht kregen" is
// niet hetzelfde feit als "toen dit gebeurde", en het contract levert alleen het
// tweede.

// Vroegste tijdstempel dat we hebben. Een momentopname draagt geen tijd per
// afgeronde stap, dus die stappen hebben er geen — het anker is de eerste stap
// waarvan we het wél weten.
export function ankerTijd(stappen = []) {
  const tijden = stappen.map((s) => s?.tijd).filter(Boolean).sort();
  return tijden[0] ?? null;
}

export function verstrekenSinds(anker, tijd) {
  if (!anker || !tijd) return null;
  const ms = new Date(tijd) - new Date(anker);
  if (Number.isNaN(ms) || ms < 0) return null;
  const seconden = Math.round(ms / 1000);
  const minuten = Math.floor(seconden / 60);
  return `+${minuten}:${String(seconden % 60).padStart(2, '0')}`;
}

// Absoluut, in de tijdzone van de kijker, met de zone erbij zodat het niet te
// verwarren is met de UTC-waarde uit het bericht.
export function absoluutLeesbaar(tijd) {
  if (!tijd) return null;
  const d = new Date(tijd);
  if (Number.isNaN(d.getTime())) return String(tijd);
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  }).format(d);
}
