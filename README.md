# showcase-website

Real-time demonstratiewebsite voor de showcase-cbt-pipelines. De client praat rechtstreeks
met showcase-CBT (of diens stub) — geen proxy ertussen: scenario-stamdata via
`GET /v1/scenarios(/:id)`, de live run via Server-Sent Events op `/v1/runs/stream`, starten
via `POST /v1/runs`. Onze eigen server levert alleen nog content die niet uit het contract
komt (`content/intro.md`, `content/showcases.json`) — geen simulator, geen WebSocket meer.

De vertaallaag tussen het contract en de UI zit in `client/src/contract/`: schemavalidatie
tegen het gegenereerde ontvangstschema (ongewijzigd, geen eigen `additionalProperties`/`enum`
erbovenop), de vertaling naar interne velden (`geslaagd/mislukt` → `groen/rood`, afwezig
`deelsysteem`/`omgeving` → `keten`/`code`), en een pure reducer over de zes berichtsoorten.
Diezelfde reducer bedient twee bronnen achter dezelfde consument (`useLiveRun.js`): een echte
`EventSource` (live), of het terugspelen van een eerder vastgelegde stream uit een bestand
(opgeslagen — de dropdown op de pipeline-pagina), met de originele tijdsafstanden tussen
berichten.

## Starten

```sh
docker compose up --build
```

- Website: http://localhost:5173
- Content-server (intro/showcases, geen contractdata): http://localhost:4000

**Dit start geen showcase-CBT.** Draai de showcase-cbt stubbundel apart op poort 8090 (zie
diens `README.md`: `node stub.js`), of zet `CBT_BASE` naar een andere plek vóór het starten.

De verbindingsindicator kent vijf standen: *verbonden met showcase-CBT* (we hangen aan de
stream, bolletje pulseert — sinds de stream de hele sessie openblijft is dit de normale stand,
niet het teken dat er iets loopt), *showcase-CBT gereed — nog geen run* (verbonden maar de
eerste momentopname is nog onderweg), *verbinding met showcase-CBT weggevallen* (rood),
*showcase-CBT niet bereikbaar* (de verbinding kwam nooit tot stand, of de stamdata kwam uit de
meegeleverde kopie) en de opgeslagen modus.

Drie dingen over die verbinding, alle drie met opzet:

- **Er is er één per sessie.** Hij hoort in `client/src/LiveRunProvider.jsx`, boven de paginas,
  niet in de pagina-hook. Anders verbreekt elke stap van dashboard naar rapport de stream en begint
  de runstate leeg — een net afgeronde run stond dan op het rapport weer volledig op "wachtend".
- **Hij gaat open bij sessiestart, niet bij de startknop.** De stream blijft tussen runs open
  (run-stream 0.11.0) en de opname roteert op `POST /v1/runs`. Wie pas bij Start verbindt, ziet een
  run die iemand anders startte helemaal niet; wie meteen verbindt, krijgt bij het openen een
  momentopname die vertelt of er iets loopt (`run: null` als er niets loopt).
- **Er wordt niet automatisch herverbonden.** EventSource doet dat standaard na een seconde of
  drie; dan mis je de berichten uit de tussentijd en krijg je een dashboard met gaten dat er
  compleet uitziet. Valt de verbinding weg, dan **bevriest het dashboard**: het vergrijst, er komt
  een regel boven met "laatste bekende stand", en de knop gaat terug naar start. Opnieuw beginnen
  is de herstelactie, en die hoort bij de mens. Zie `client/src/contract/eventSourceBron.js`.

  Bevriezen in plaats van losse statussen herinterpreteren is een bewuste keuze: een stap op
  `lopend` is geen ontbrekend gegeven maar een actieve bewering dat er iets draait, en de wachtende
  stappen beweren dat ze nog aan de beurt komen. Beide worden onwaar op hetzelfde moment. Door het
  hele beeld te bevriezen hoeft geen enkele status van betekenis te veranderen: dit was de stand,
  en verder weten we het niet.

Dat de stream *tussen* runs dichtging was tijdelijk, en die vervaldatum is bereikt: vanaf
stubbundel 0.11.0 houdt showcase-CBT hem open, dus wij koppelen niet meer zelf los bij
`run-afgerond`.

**Eén ding dat de stub niet kan, en waar wij dus tegenaan lopen.** Verbind je midden in een
lopende run, dan stelt de stub geen momentopname van dat moment samen maar speelt hij de
opgenómen openingsmomentopname af — en die zegt `run: null`. Gemeten: een tweede verbinding die
opengaat terwijl `voltooid` op stap 5 staat, krijgt "er loopt niets" en daarna de losse berichten
van stap 5 en 6. Onze reducer zet dan `scenarioId` op null, waarna `usePipelineRun` die berichten
niet meer aan het scenario kan koppelen: het dashboard blijft op "wachtend" terwijl de run
afloopt. Dat raakt precies één pad — opnieuw starten ná een weggevallen verbinding terwijl de
run aan de andere kant doorliep. Het is een tekort van de stub, niet van de spec (de
momentopname kán een lopende run dragen), dus er valt aan onze kant niets te repareren zonder
gedrag te verzinnen: de losse stapberichten dragen geen `scenarioId`, dus we kúnnen niet weten
bij welk scenario ze horen.

**Stamdata wordt één keer opgehaald en vastgehouden** (`client/src/scenarioBron.js`), met een
terugval op een meegeleverde kopie in `client/public/opgeslagen/` als showcase-CBT niet bereikbaar
is. Twee dingen die daarmee opgelost zijn: doorlopen naar het rapport ná een weggevallen verbinding
gaf eerst "kon scenario niet laden" in plaats van de bevroren stand, en de opgeslagen modus kon
zonder showcase-CBT helemaal niet starten.

Komt de stamdata uit die kopie, dan zegt de pagina dat, en zegt de indicator *showcase-CBT niet
bereikbaar* in plaats van *gereed* — anders zou dat laatste een bewering zijn waar geen bewijs
meer voor is. Er ligt alleen een kopie voor scenario 01; voor een scenario zonder kopie faalt de
pagina zichtbaar, en dat is de bedoeling.

## Draaien vanaf een gepubliceerde image-tag

Voor een showcase zonder lokale build: `docker-compose.release.yml` gebruikt kant-en-klare
images uit GitHub Container Registry (`ghcr.io/sim007/showcase-website/server` en
`.../client`), getagd met de git-tag waaruit ze gebouwd zijn.

```sh
TAG=first-mvp docker compose -f docker-compose.release.yml up
```

Dat gaat uit van een lokale clone van deze repo. Zonder clone: haal het bestand op van
GitHub en draai het lokaal. Let op: `docker-compose.release.yml` is generieke tooling die de
tag als parameter krijgt — het bestand zelf staat alleen op `master`, niet op elke
applicatie-tag, dus haal het van `master` en geef de gewenste imagetag apart mee via `TAG`.

```sh
curl -L -o docker-compose.release.yml \
  https://raw.githubusercontent.com/Sim007/showcase-website/master/docker-compose.release.yml
TAG=first-mvp docker compose -f docker-compose.release.yml up
```

PowerShell:

```powershell
Invoke-WebRequest https://raw.githubusercontent.com/Sim007/showcase-website/master/docker-compose.release.yml -OutFile docker-compose.release.yml
$env:TAG = "first-mvp"
docker compose -f docker-compose.release.yml up
```

Nieuwere versies van Docker Compose kunnen het bestand ook rechtstreeks uit een git-URL
laden (`-f "https://github.com/<repo>.git#<tag>:<pad>"`, zonder eerst te downloaden), maar
dat vereist een recente Compose-versie — werkt die niet, dan geeft Compose "file not found"
omdat hij de hele URL als een letterlijke bestandsnaam behandelt. De download-aanpak hierboven
werkt op elke versie.

Deze route draait de content die in de image gebakken is (`content/intro.md`,
`content/showcases.json`) — geen volume-mount naar een lokale `content`-map, want die is er
zonder clone niet. Wil je content bewerken zonder rebuilden, gebruik dan de lokale-build
route ("Starten" hierboven) met een volledige clone.

Zonder `TAG` wordt `first-mvp` gebruikt (bevestigd werkende tag). Website en API draaien op
dezelfde poorten als hierboven.

**Let op: dit start geen showcase-CBT.** De client praat sinds de EventSource-herschrijving
rechtstreeks met showcase-CBT (of de stub), niet meer via onze eigen server. Draai de
showcase-cbt stubbundel apart op poort 8090 (zie diens `README.md`: `node stub.js`), of wijs de
client naar een andere plek met `CBT_BASE`:

```sh
CBT_BASE=http://showcase-cbt.lokaal:8090 TAG=first-mvp docker compose -f docker-compose.release.yml up
```

Zonder een bereikbare showcase-CBT/stub op die plek valt de scenariopagina terug op de
meegeleverde stamdata-kopie (alleen scenario 01) en meldt dat. Zie "Starten" hierboven.

## Nieuwe imagetag publiceren

Via GitHub Actions → **Publish Docker images** → *Run workflow*, met de gewenste git-tag als
input (bv. `first-mvp`). De workflow checkt die tag uit en bouwt en publiceert de server- en
client-image met exact diezelfde tag — de sources en de images horen dus altijd bij elkaar.
De tag moet al bestaan in de repo (`git tag`).

## Bewerken zonder rebuilden

- `content/intro.md` — de tekst op de landingspagina
- `content/showcases.json` — titel/beschrijving/status per tegel

Beide worden gemount als volume in de servercontainer; een paginaherlaad is genoeg,
geen rebuild nodig.

## Nieuw scenario toevoegen

Scenario's komen niet meer uit lokale JSON-bestanden — die stamdata levert showcase-CBT (of
de stub) via `GET /v1/scenarios/:id`. Aan onze kant:

1. Zet `"status": "werkt"` voor dat scenario in `content/showcases.json` (de tegel op de
   landingspagina — dit is eigen content, geen contractdata).
2. Introduceert het scenario een nieuwe deelsysteem-naam (iets anders dan payment/order/
   keten), voeg die dan ook toe aan `client/src/statusMeta.js` (`DEELSYSTEEM_LABELS`) en aan
   `client/src/styles.css` (`--ds-<naam>` en de bijbehorende `.ds-pill`/`.swimlane`-regels) —
   dat is nog niet data-gedreven.
3. Voor de opgeslagen-modus: leg een vastgelegde stream + de bijbehorende
   `GET /v1/scenarios/:id`-respons vast als JSON onder `client/public/opgeslagen/` (zie de
   bestaande `voltooid.json`/`gestopt.json`/`midden.json`/`scenario-01.json` voor de vorm).

**Let op, nog niet opgelost:** de scenario-content komt vandaag van showcase-CBT's/de stub's
eigen voorbeelddata (het generieke 6-stappen-voorbeeld uit de `scenario-api`-spec) — niet meer
de eerder handgeschreven, realistischere 29-staps content voor scenario 01. Dat is een
inhoudelijke stap terug ten opzichte van vóór de EventSource-herschrijving, nog niet
gerepareerd.

## Testen

- `cd server && npm test` — integratietests voor de contentroutes (`app.js`: `/api/content/*`), met vitest. De simulator-tests zijn vervallen samen met de simulator zelf.
- `cd client && npm test` — unit tests (`simpleMarkdown.js`, `deriveDeelsysteemStatus.js`, en de contractlaag: `schema.js`, `vertaal.js`, `berichtReducer.js`) en componenttests (React Testing Library) voor `ShowcaseTile`, `ReportTable`, `PipelineGraph`.
- `npm run test:e2e` (in de root) — Playwright end-to-end tests. **De suite start alles zelf:**
  de stubbundel op 8090, de contentserver op 4000 en de client op 5173. Draait er al iets op die
  poorten, dan wordt dat hergebruikt (lokaal handig); in CI altijd verse processen.

  `npm run stub:haal` haalt de stubbundel op in `.stub/` (niet in git) en toetst hem tegen een
  **in de repo vastgepinde versie én checksum** (`scripts/haal-stubbundel.mjs`). Alleen tegen het
  meegeleverde `.sha256` toetsen zou niets bewijzen over wélke bundel je hebt — dat bestand komt
  uit dezelfde release. Wie de bundel bumpt verandert dus twee regels, en daarmee staat
  "waartegen is dit getoetst" in de repo in plaats van in iemands geheugen. Het script is
  idempotent, dus het mag vóór elke run.

  **Eén werker, niet parallel, en dat is een voorwaarde en geen afweging.** De stub deelt één
  rotatie van drie opnames: elke `POST /v1/runs` schuift hem op (tot 0.10.0 ging dat per nieuwe
  verbinding). Twee specs tegelijk schuiven de rotatie onder elkaar weg.

  **Hoe de specs inhoudsvast zijn gemaakt.** De suite stond maanden rood omdat hij 20 stappen
  verwachtte en de inhoud er 6 werd. Het aantal stappen was nooit het gedrag dat we wilden
  vastleggen. Verwachtingen worden nu afgeleid uit de stamdata die de pagina zélf krijgt
  (`e2e/stamdata.js`): kolommen zijn de omgevingen uit `GET /v1/scenarios/:id`, swimlanes zijn de
  deelsystemen in volgorde van eerste voorkomen. Verder:
  - **Live specs zijn opname-blind.** `pipeline-live-run.spec.js` legt vast wat voor élke opname
    geldt — een run gaat van wachtend naar een eindtoestand, laat niets op "lopend" staan, en de
    verbinding blijft erna open. Niet welke stap groen wordt, want dat hangt af van waar de
    rotatie staat.
  - **Uitkomsten staan in `pipeline-opgeslagen.spec.js`**, want daar kiezen wíj de opname. Die
    zijn daarmee vastgepind op een contractartefact uit de bundel en niet op handgeschreven
    inhoud.
  - Aangetoond in plaats van beweerd: met de stamdata van de stub verbouwd naar 8 stappen, 4
    omgevingskolommen en 3 deelsystemen bleven 5 van de 7 structuurspecs groen zonder één
    wijziging. De twee die omvielen, vielen om op een echte bevinding — zie hieronder.

  **Wat de suite daarmee blootlegde, en wat daarop gerepareerd is:** de deelsysteemnamen stonden
  hardcoded in `statusMeta.js`, terwijl de stamdata `deelsystemen: [{id, naam}]` al meelevert —
  een nieuw deelsysteem toonde daardoor zijn id als label. Ze komen nu uit de stamdata
  (`client/src/deelsysteemLabels.js`), net als de stappen zelf. De keten heeft in het contract
  geen eigen entry, dus dat label wordt samengesteld uit de deelsystemen die het scenario heeft;
  voor scenario 01 leest dat als "Payment + Order" in plaats van het vroegere, vaste
  "Order + Payment". Alleen de kleuren (`--ds-<id>` in `styles.css`) blijven een codewijziging —
  een kleur kiezen is geen data.

  **Wachttijden zijn afgeleid, niet gekozen.** Live zendt de stub op een vast tempo (`TEMPO_MS`,
  400 ms per bericht), maar een *opgeslagen* opname speelt af op de tijdstempels die erin staan —
  `opgeslagenBron.js` gebruikt de onderlinge afstanden van de opname. De speelduur is dus de
  tijdspanne van de vastgelegde run: vandaag 11 tot 20 seconden. `pipeline-opgeslagen.spec.js`
  leest die spanne uit het fixturebestand in plaats van een rond getal aan te houden, want een
  vast getal zou omvallen op het moment dat de opnames langer worden.

## Openstaand, met de reden

- **`client/package-lock.json` wijst naar `registry.npmmirror.com`.** Elke resolved URL erin komt
  van de Centric-mirror, dus iedereen die deze publieke repo kloont haalt zijn pakketten daar op.
  Dat hoort hier niet. Regenereren vanaf een Centric-werkplek schrijft het er weer in — direct
  naar `registry.npmjs.org` breekt op de TLS-interceptie van het bedrijfsnetwerk — dus dit vraagt
  een schone omgeving. Dezelfde lock mist bovendien het `esbuild`-pakket onder `vitest` terwijl de
  53 platformpakketten er wel staan; npm 11 accepteert dat, npm 10 niet (zie de node-versie in
  `tests.yml`). Eén schone `npm install` lost beide op.
- **Het dashboard past niet meer op één scherm zodra veel stappen van één deelsysteem in dezelfde
  omgevingskolom vallen.** Gemeten met een ingevoerd scenario van 27 stappen: gelijkmatig
  verdeeld over de kolommen past het (509px rooster, alles binnen 1080px), maar met 11
  payment-stappen in de CI-kolom groeit het rooster naar 970px in een venster van 509px. Het
  scrollt dan intern — niets breekt, maar je ziet één deelsysteem en een strook van het tweede,
  en de showcase is expliciet gebouwd voor F11 op 1920×1080. De stapomschrijvingen kappen
  daarbij af op ongeveer 30 tekens ("Contractverificatie van de c..."). Squad 1 levert 19 en 27
  stappen voor 00 en 01; dit is de vorm waarin dat ons raakt.

**Dependency-scanning loopt via GitHub, niet lokaal.** `npm audit` werkt op een Centric-werkplek
niet: de ingestelde mirror (`registry.npmmirror.com`) implementeert het audit-endpoint niet, en
rechtstreeks naar `registry.npmjs.org` breekt op de TLS-interceptie van het bedrijfsnetwerk.
Dependabot op de repo is dus de plek waar de NFR "geen bekende kwetsbaarheden" bewaakt wordt —
lokaal een schone `npm audit` verwachten heeft geen zin.

## Bekende aannames (MVP)

- Eén run tegelijk — afgedwongen door showcase-CBT/de stub (409 bij een tweede poging), geen
  eigen sessielaag aan onze kant.
- Geen dark mode, geen authenticatie — voor een lokale demo niet nodig.
- Scenario-inhoud komt van showcase-CBT/de stub, niet van onszelf — zie "Nieuw scenario
  toevoegen" hierboven voor de huidige beperking daarvan.
- **De opgeslagen modus draait offline, maar alleen voor scenario 01.** Zowel de opgenomen stream
  als de stamdata liggen er als bestand, dus de pagina werkt zonder showcase-CBT. De drie opnames
  zijn letterlijk de fixtures uit stubbundel 0.11.0, met elk hun eigen `runId`
  (`voltooid` = `run-7c41a9`, `gestopt` = `run-3b8e02`, `begint bij stap 3` = `run-9d15f4`). Die
  laatste opent met een momentopname van een run die al loopt en zonder `run-gestart` — dat is de
  enige plek waar dat geval nog te zien is, want tegen de bundel is *instappen* tijdens een
  lopende run niet meer na te bootsen. Voor de andere scenario's is er geen kopie.

  **Een simulatie ís een opgeslagen stream** — dat is de eis, en hij geldt onverkort: de
  simulatiemodus moet werken zonder verbinding en zonder showcase-CBT. Gemeten vanaf een verse
  sessie met showcase-CBT uit: scenario 01 haalt dat. De pagina bouwt op de meegeleverde
  stamdatakopie, bevriest niet, de bronkeuze en de deelsysteem-vakjes werken, een opgeslagen run
  speelt volledig af en het rapport houdt hem vast. Voor de scenario's zonder kopie valt er
  niets te tonen — de stream draagt alleen stapnummers, dus zonder stamdata is niet te weten
  welke stap nummer 3 is. Die pagina zegt dat nu, met een weg terug, in plaats van alleen een
  fetch-fout.

  Wat nog wél een besluit vraagt: de landingspagina noemt de simulatiemodus niet. Wie het pad
  niet kent, ziet alleen tegels. De intro is eigen content (`content/intro.md`, beheerd door de
  testconsultant), dus dat is geen codewijziging maar een tekstkeuze. Er is bewust geen `scenario-00.json` aangemaakt: de stub levert
  voor élk id de inhoud van 01, dus zo'n bestand zou scenario 01 zijn met "00" erboven.
