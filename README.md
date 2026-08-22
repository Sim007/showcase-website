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

**Midden in een lopende run verbinden werkt** — dat was een tijdlang niet zo. Tot stubbundel
0.11.0 speelde de stub de opgenómen openingsmomentopname af, dus je kreeg `run: null` terwijl er
een run liep; onze reducer zette `scenarioId` dan op null en het dashboard bleef op "wachtend"
tot het einde. Squad 1 heeft dat in 0.11.1 gerepareerd: de stub leidt de momentopname nu af uit
wat hij werkelijk verstuurd heeft. Nagemeten tegen 0.13.0 op 22-08-2026 — twaalf seconden na de
start gaf een tweede verbinding een momentopname met negen afgeronde stappen en `lopendeStap: 10`.
Dat pad (opnieuw verbinden terwijl de run aan de andere kant doorloopt) is daarmee weer te oefenen
zonder opname.

**Stamdata wordt één keer opgehaald en vastgehouden** (`client/src/scenarioBron.js`), met een
terugval op een meegeleverde kopie in `client/public/opgeslagen/` als showcase-CBT niet bereikbaar
is. Twee dingen die daarmee opgelost zijn: doorlopen naar het rapport ná een weggevallen verbinding
gaf eerst "kon scenario niet laden" in plaats van de bevroren stand, en de opgeslagen modus kon
zonder showcase-CBT helemaal niet starten.

Komt de stamdata uit die kopie, dan zegt de pagina dat, en zegt de indicator *showcase-CBT niet
bereikbaar* in plaats van *gereed* — anders zou dat laatste een bewering zijn waar geen bewijs
meer voor is. Er ligt een kopie voor scenario 00 en 01 — welke dat zijn wordt afgeleid uit de
bundel en staat in `client/src/offlineScenarios.js`, zodat de pagina die opsomming niet uit het
hoofd hoeft te kennen. Voor een scenario zonder kopie faalt de pagina zichtbaar, en dat is de
bedoeling.

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

1. Zet de status van dat scenario in `content/showcases.json` (de tegel op de landingspagina —
   dit is eigen content, geen contractdata). Er zijn drie standen, en het verschil ertussen is
   een belofte waar een test op staat:

   | status | tegel | betekent |
   |---|---|---|
   | `werkt` | klikbaar, `● werkt` | openen **én** starten doen dit scenario |
   | `alleen-opgeslagen` | klikbaar, `◑ alleen opgeslagen` | openen doet dit scenario en er is een opname; live starten kan niet |
   | `binnenkort` | niet klikbaar, `○ binnenkort` | er valt niets te tonen |

   `alleen-opgeslagen` bestaat voor scenario 00: eigen stamdata en een echte opname, maar de
   rotatie van de stub bevat het scenario niet, dus Start zou een run voor 01 opleveren. Op zo'n
   pagina staat de live startknop dicht mét de reden erbij, in plaats van dat je het achteraf
   te horen krijgt. `e2e/landing.spec.js` toetst alle drie de standen; een status die daar niet
   in staat valt op in plaats van stil als `binnenkort` te renderen.
2. Introduceert het scenario een nieuwe deelsysteem-naam (iets anders dan payment/order/
   keten), voeg die dan ook toe aan `client/src/statusMeta.js` (`DEELSYSTEEM_LABELS`) en aan
   `client/src/styles.css` (`--ds-<naam>` en de bijbehorende `.ds-pill`/`.swimlane`-regels) —
   dat is nog niet data-gedreven.
3. Voor de opgeslagen modus hoef je niets neer te zetten: `npm run opnames:schrijf` leidt de
   opname én de stamdatakopie af uit de bundel. Wat je wél doet is de opname een label geven in
   `client/src/opgeslagenVarianten.js`, met het scenario erbij — dat is een redactionele keuze en
   geen contractdata. Vergeet je het, dan zegt `npm run opnames` het.

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

  **Wat wij afspelen komt uit de bundel — en dat wordt getoetst.** De vier bestanden onder
  `client/public/opgeslagen/` en onze kopie van `berichten-ontvangst.json` waren met de hand
  overgenomen uit de bundel. Ze waren inhoudelijk gelijk (nagemeten, bericht voor bericht), maar
  niets hield dat zo — een afspraak op de plek waar een gate hoort. `scripts/opnames.mjs` leidt ze
  nu af: de opnames uit `runs/*.jsonl`, de lokale stamdatakopie uit de route voor
  `GET /v1/scenarios/:id` in `stub-data.json`, het berichtschema uit `schemas/`.
  - Sinds bundel 0.13.0 hoort daar ook `client/src/offlineScenarios.js` bij: een gegenereerde
    lijst van de scenario's waarvoor zowel een stamdatakopie als een opname meekomt. Die stond
    eerst met de hand in een zin op de pagina ("Scenario 01 werkt wel zonder showcase-CBT") en
    liep meteen achter toen 00 erbij kwam.
  - `npm run opnames` toetst en meldt afwijkingen; `npm run opnames:schrijf` leidt ze opnieuw af.
  - De toets loopt mee in `npm run test:e2e` (`e2e/opnames.spec.js`) en als eigen stap in CI, dus
    hij is niet over te slaan.
  - Hij vergelijkt op inhoud, niet op bytes: opmaak en regeleindes zijn geen bewering over de run,
    en git zet ze op Windows toch om.
  - Vier dingen laat hij niet passeren, alle vier op een gebroken boom aangetoond: een gewijzigd
    bericht, een bestand dat wij afspelen maar de bundel niet heeft, een opname uit de bundel
    waarvan wij geen kopie hebben, en **twee opnames met hetzelfde `runId`** — dat laatste laat in
    de live-modus cli-regels van de vorige run onder de stappen van de volgende staan (zie
    `docs/reactie-20260822.md`). Komt er een opname van scenario 00 bij, dan valt deze toets dus
    om met "de bundel heeft een opname die wij niet afspelen", en dat is het signaal dat we willen.

  **Eén werker, niet parallel, en dat is een voorwaarde en geen afweging.** De stub deelt één
  rotatie van drie opnames: elke `POST /v1/runs` schuift hem op (tot 0.10.0 ging dat per nieuwe
  verbinding). Twee specs tegelijk schuiven de rotatie onder elkaar weg.

  In `runs/` liggen sinds bundel 0.13.0 víer bestanden, maar de rotatie loopt over drie:
  `NAMEN = ['voltooid', 'gestopt', 'midden']` staat vast in `stub.js`. De echte opname van
  scenario 00 zit er niet in, dus een live run speelt altijd scenario 01 — ongeacht welk
  `scenarioId` je meestuurt. Nagemeten tegen 0.13.0:
  `POST /v1/runs {"scenarioId":"00"}` geeft 201 met `scenarioId: "01"`.

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
- **De opgeslagen modus draait offline, voor scenario 00 en 01.** Zowel de opgenomen stream als de
  stamdata liggen er als bestand, dus de pagina werkt zonder showcase-CBT. De vier opnames komen
  uit stubbundel 0.13.0 — niet overgenomen maar **afgeleid**, zie "Wat wij afspelen komt uit de
  bundel" hieronder — met elk hun eigen `runId`:

  | bron | scenario | `runId` | wat het is |
  |---|---|---|---|
  | `voltooid` | 01 | `run-7c41a9` | 27 stappen, alles slaagt |
  | `gestopt` | 01 | `run-3b8e02` | valt om op stap 9, de eerste contractgate |
  | `begint bij stap 3` | 01 | `run-9d15f4` | opent met een momentopname van een lopende run |
  | `00 voltooid` | 00 | `run-000000` | **een echte opname**, 19 stappen, 87 seconden |

  Die laatste is de enige manier om scenario 00 te zien: hij zit niet in de rotatie van de stub,
  dus starten levert altijd 01. De drie andere zijn door showcase-CBT afgeleid uit de stamdata van
  01 en niet opgenomen; dat verschil staat in de README van de bundel en niet in het manifest, dus
  wij kunnen het niet lezen — `npm run opnames` waarschuwt daarover.

  **Een simulatie ís een opgeslagen stream** — dat is de eis, en hij geldt onverkort: de
  simulatiemodus moet werken zonder verbinding en zonder showcase-CBT. Gemeten vanaf een verse
  sessie met showcase-CBT uit: scenario 00 en 01 halen dat beide. Bij 00 is dat op 22-08-2026
  helemaal doorlopen — 19 knopen, halverwege 9 groen met één lopend, 19 groen aan het eind, en een
  rapport van 19 rijen met verstreken tijden van +0:00 tot +1:22. De pagina bouwt op de meegeleverde
  stamdatakopie, bevriest niet, de bronkeuze en de deelsysteem-vakjes werken, een opgeslagen run
  speelt volledig af en het rapport houdt hem vast. Voor de scenario's zonder kopie valt er
  niets te tonen — de stream draagt alleen stapnummers, dus zonder stamdata is niet te weten
  welke stap nummer 3 is. Die pagina zegt dat nu, met een weg terug, in plaats van alleen een
  fetch-fout.

  Wat nog wél een besluit vraagt: de landingspagina noemt de simulatiemodus niet. Wie het pad
  niet kent, ziet alleen tegels. De intro is eigen content (`content/intro.md`, beheerd door de
  testconsultant), dus dat is geen codewijziging maar een tekstkeuze. Er is bewust geen `scenario-00.json` aangemaakt: de stub levert
  voor élk id de inhoud van 01, dus zo'n bestand zou scenario 01 zijn met "00" erboven.
