// Leidt af wat wij afspelen uit de stubbundel, en toetst dat het nog klopt.
//
// Waarom dit bestaat: `client/public/opgeslagen/*.json` en onze kopie van
// `berichten-ontvangst.json` waren met de hand overgenomen uit de bundel. Ze
// waren inhoudelijk gelijk — nagemeten op 22-08-2026, bericht voor bericht —
// maar niets hield dat zo. Een afspraak dus, op de plek waar een gate hoort.
// Squad 1 wees kopiëren af als route voor hun opnames; datzelfde bezwaar geldt
// tegen onze kant van die kopie.
//
// Twee standen:
//   node scripts/opnames.mjs            toetst en meldt afwijkingen (exit 1)
//   node scripts/opnames.mjs --schrijf  schrijft de afgeleide bestanden
//
// De toets vergelijkt op inhoud en niet op bytes. Opmaak en regeleindes zijn
// geen bewering over de run — op Windows zet git ze bovendien om, en dan zou de
// gate rood staan om iets wat niemand gewijzigd heeft.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { OPGESLAGEN_VARIANTEN } from '../client/src/opgeslagenVarianten.js';

const wortel = join(dirname(fileURLToPath(import.meta.url)), '..');
const bundel = join(wortel, '.stub', 'bundel');
const opgeslagen = join(wortel, 'client', 'public', 'opgeslagen');
const schemaKopie = join(wortel, 'client', 'src', 'contract', 'berichten-ontvangst.json');

const SCENARIO_ROUTE = '^/v1/scenarios/[^/]+$';

function lees(pad) {
  return JSON.parse(readFileSync(pad, 'utf8'));
}

// Wat de bundel oplevert, per doelbestand: de inhoud die daar hoort te staan en
// hoe hij eruit hoort te zien als we hem schrijven.
export function verwachtUitBundel() {
  if (!existsSync(bundel)) {
    throw new Error(`.stub/bundel/ ontbreekt — draai eerst \`npm run stub:haal\``);
  }

  const doelen = [];

  // 1. De opnames. Welke er zijn, komt uit de bundel en staat hier niet
  //    vastgelegd: komt er een opname van scenario 00 bij, dan valt deze toets
  //    om met "de bundel heeft een opname die wij niet afspelen", en dat is
  //    precies het signaal dat we willen.
  const runs = join(bundel, 'runs');
  const opnames = existsSync(runs) ? readdirSync(runs).filter((n) => n.endsWith('.jsonl')) : [];
  for (const naam of opnames) {
    const ruw = readFileSync(join(runs, naam), 'utf8');
    const berichten = ruw
      .split('\n')
      .filter((r) => r.trim())
      .map((r) => JSON.parse(r));
    doelen.push({
      soort: 'opname',
      sleutel: naam.replace(/\.jsonl$/, ''),
      pad: join(opgeslagen, naam.replace(/\.jsonl$/, '.json')),
      bron: `runs/${naam}`,
      sha256: createHash('sha256').update(ruw).digest('hex'),
      inhoud: berichten,
      tekst: `${JSON.stringify(berichten, null, 2)}\n`,
    });
  }

  // 2. De lokale stamdatakopie, voor de opgeslagen modus zonder showcase-CBT.
  //    Die komt uit het antwoord dat de stub zelf op GET /v1/scenarios/:id geeft,
  //    dus uit `stub-data.json` en niet uit een draaiende stub: een gate mag geen
  //    poort nodig hebben.
  const stubData = lees(join(bundel, 'stub-data.json'));
  const route = stubData.routes?.find((r) => r.patroon === SCENARIO_ROUTE);
  if (!route) {
    throw new Error(`geen route ${SCENARIO_ROUTE} in stub-data.json — is de indeling van de bundel gewijzigd?`);
  }
  const body = route.body;
  if (Array.isArray(body) || typeof body !== 'object' || body === null || !body.id) {
    // Bij 0.12.0 splitst de stamdata per id. Dan verandert deze route van vorm en
    // moet dit script mee. Stil één bestand blijven schrijven zou de kopie van 00
    // laten wijzen naar de stamdata van 01 — precies de stille onwaarheid waar
    // deze showcase over gaat.
    throw new Error(
      'de route voor GET /v1/scenarios/:id levert niet één scenario-object meer; ' +
        'de bundel splitst de stamdata per id en dit script moet daarop aangepast worden'
    );
  }
  doelen.push({
    soort: 'stamdata',
    pad: join(opgeslagen, `scenario-${body.id}.json`),
    bron: `stub-data.json (${SCENARIO_ROUTE})`,
    inhoud: body,
    tekst: `${JSON.stringify(body)}\n`,
  });

  // 3. Het berichtschema waarmee wij elke opname en elk live bericht toetsen.
  const schema = lees(join(bundel, 'schemas', 'berichten-ontvangst.json'));
  doelen.push({
    soort: 'schema',
    pad: schemaKopie,
    bron: 'schemas/berichten-ontvangst.json',
    inhoud: schema,
    tekst: `${JSON.stringify(schema, null, 2)}\n`,
  });

  return doelen;
}

// Toetst het `opnames`-blok in manifest.json, als de bundel dat heeft. Dat blok
// is wat wij squad 1 gevraagd hebben te leveren (docs/reactie-20260822.md): per
// opname het bestand, het scenario, het runId, de aantallen, de versie waartegen
// hij is opgenomen en een sha256. Zonder deze toets zou dat een blok zijn dat wij
// vragen en niet lezen — dan is het geen levering maar een formaliteit.
//
// Bundel 0.11.0 heeft het blok nog niet. Dat is geen fout: dan valt het terug op
// wat er in runs/ staat, en zegt het dat een keer.
function toetsManifest(doelen) {
  const bevindingen = [];
  const manifest = lees(join(bundel, 'manifest.json'));
  const opnames = doelen.filter((d) => d.soort === 'opname');

  if (!Array.isArray(manifest.opnames)) {
    return {
      bevindingen,
      opmerking:
        `bundel ${manifest.bundelversie} heeft nog geen \`opnames\`-blok in manifest.json; ` +
        `de ${opnames.length} opnames komen uit een scan van runs/`,
    };
  }

  const streamVersie = manifest.specs?.find((s) => s.artifact === 'run-stream')?.versie;
  const perBestand = new Map(opnames.map((d) => [d.bron, d]));

  for (const aangifte of manifest.opnames) {
    const doel = perBestand.get(aangifte.bestand);
    if (!doel) {
      bevindingen.push({
        soort: 'manifest',
        tekst: `manifest noemt ${aangifte.bestand}, maar dat bestand zit niet in de bundel`,
      });
      continue;
    }
    perBestand.delete(aangifte.bestand);

    const runIds = [...new Set(doel.inhoud.map((b) => b.runId ?? b.run?.runId).filter(Boolean))];
    const stapNummers = new Set(doel.inhoud.map((b) => b.stapNummer).filter((n) => n != null));
    const controles = [
      ['sha256', aangifte.sha256, doel.sha256],
      ['berichten', aangifte.berichten, doel.inhoud.length],
      ['runId', aangifte.runId, runIds.length === 1 ? runIds[0] : runIds.join('+')],
      ['stappen', aangifte.stappen, stapNummers.size || undefined],
    ];
    for (const [veld, aangegeven, gemeten] of controles) {
      if (aangegeven === undefined || gemeten === undefined) continue;
      if (String(aangegeven) !== String(gemeten)) {
        bevindingen.push({
          soort: 'manifest',
          tekst: `${aangifte.bestand}: manifest zegt ${veld} ${aangegeven}, in het bestand staat ${gemeten}`,
        });
      }
    }

    // Het veld waar we het meest aan hebben: een opname die tegen een oudere
    // spec is vastgelegd dan de bundel meelevert, speelt straks tegen regels die
    // hij nooit gezien heeft. Dat hoort te blijken en niet te verrassen.
    if (aangifte.opgenomenTegen && streamVersie && aangifte.opgenomenTegen !== streamVersie) {
      bevindingen.push({
        soort: 'manifest',
        tekst:
          `${aangifte.bestand} is opgenomen tegen run-stream ${aangifte.opgenomenTegen}, ` +
          `maar deze bundel levert ${streamVersie}`,
      });
    }
  }

  for (const bron of perBestand.keys()) {
    bevindingen.push({
      soort: 'manifest',
      tekst: `${bron} zit in de bundel maar staat niet in het \`opnames\`-blok van het manifest`,
    });
  }

  return { bevindingen, opmerking: `manifest declareert ${manifest.opnames.length} opnames` };
}

function gelijk(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function toets() {
  const doelen = verwachtUitBundel();
  const bevindingen = [];

  for (const doel of doelen) {
    const kort = doel.pad.slice(wortel.length + 1).replace(/\\/g, '/');
    if (!existsSync(doel.pad)) {
      bevindingen.push({
        soort: 'ontbreekt',
        tekst: `${kort} ontbreekt, maar de bundel levert ${doel.bron} — afspelen kan niet wat er niet is`,
      });
      continue;
    }
    if (!gelijk(lees(doel.pad), doel.inhoud)) {
      bevindingen.push({
        soort: 'afwijking',
        tekst: `${kort} wijkt af van ${doel.bron} in de bundel — draai \`npm run opnames:schrijf\``,
      });
    }
  }

  // Andersom: spelen wij iets af dat de bundel niet heeft? Dat is de vorm van
  // handwerk die deze gate moet uitsluiten.
  const verwachtePaden = new Set(doelen.map((d) => d.pad));
  for (const naam of readdirSync(opgeslagen).filter((n) => n.endsWith('.json'))) {
    const pad = join(opgeslagen, naam);
    if (!verwachtePaden.has(pad)) {
      bevindingen.push({
        soort: 'zweeft',
        tekst: `client/public/opgeslagen/${naam} komt niet uit de bundel — handwerk, of achtergebleven na een bundelwissel`,
      });
    }
  }

  // En de regel die we squad 1 vragen, ook aan onze kant gemeten: twee opnames
  // met hetzelfde runId laten in de live-modus cli-regels van de vorige run
  // onder de stappen van de volgende staan (aangetoond op 22-08-2026, zie
  // docs/reactie-20260822.md). Dan willen we het hier zien, niet daar.
  const perRunId = new Map();
  for (const doel of doelen) {
    if (!Array.isArray(doel.inhoud)) continue;
    for (const id of new Set(doel.inhoud.map((b) => b.runId ?? b.run?.runId).filter(Boolean))) {
      if (!perRunId.has(id)) perRunId.set(id, []);
      perRunId.get(id).push(doel.bron);
    }
  }
  for (const [id, bronnen] of perRunId) {
    if (bronnen.length > 1) {
      bevindingen.push({
        soort: 'runid',
        tekst: `runId ${id} zit in meer dan één opname (${bronnen.join(', ')}) — uitvoer van de vorige run blijft dan staan`,
      });
    }
  }

  // Een geleverde opname die nergens in de bronkeuze staat, speelt niemand ooit.
  // Dat is de stilte die we bij de handkopie net hebben weggehaald, één laag
  // hoger: het bestand is dan wel afgeleid, maar er komt geen kijker bij.
  const sleutels = new Set(doelen.filter((d) => d.soort === 'opname').map((d) => d.sleutel));
  const varianten = new Set(OPGESLAGEN_VARIANTEN.map((v) => v.key));
  for (const sleutel of sleutels) {
    if (!varianten.has(sleutel)) {
      bevindingen.push({
        soort: 'bronkeuze',
        tekst:
          `de bundel levert opname "${sleutel}" maar de bronkeuze speelt hem niet af — ` +
          `zet hem in client/src/opgeslagenVarianten.js met een label dat zegt wat een kijker ziet`,
      });
    }
  }
  for (const sleutel of varianten) {
    if (!sleutels.has(sleutel)) {
      bevindingen.push({
        soort: 'bronkeuze',
        tekst: `de bronkeuze biedt "${sleutel}" aan, maar de bundel heeft daar geen opname voor`,
      });
    }
  }

  const manifestToets = toetsManifest(doelen);
  bevindingen.push(...manifestToets.bevindingen);

  return { doelen, bevindingen, opmerking: manifestToets.opmerking };
}

// Alleen als CLI uitvoeren, niet bij importeren uit een spec.
if (process.argv[1] && process.argv[1].endsWith('opnames.mjs')) {
  const schrijven = process.argv.includes('--schrijf');
  if (schrijven) {
    for (const doel of verwachtUitBundel()) {
      writeFileSync(doel.pad, doel.tekst);
      console.log(`geschreven: ${doel.pad.slice(wortel.length + 1)}  <- ${doel.bron}`);
    }
    console.log('\nklaar. Controleer met `git diff` wat er veranderde.');
    process.exit(0);
  }

  const { doelen, bevindingen, opmerking } = toets();
  console.log(`${doelen.length} afgeleide bestanden getoetst tegen .stub/bundel/`);
  if (opmerking) console.log(opmerking);
  if (!bevindingen.length) {
    console.log('alles klopt met de bundel');
    process.exit(0);
  }
  console.error('');
  for (const b of bevindingen) console.error(`  ${b.soort.toUpperCase()}: ${b.tekst}`);
  process.exit(1);
}
