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

De verbindingsindicator kent vier standen: *verbonden met showcase-CBT* (we hangen aan de
stream, bolletje pulseert), *showcase-CBT gereed — nog geen run* (bereikbaar, maar er valt
niets te volgen), *verbinding met showcase-CBT weggevallen* (rood) en de opgeslagen modus.

Twee dingen over die verbinding, allebei met opzet:

- **Er is er één per sessie.** Hij hoort in `client/src/LiveRunProvider.jsx`, boven de paginas,
  niet in de pagina-hook. Anders verbreekt elke stap van plaat naar rapport de stream en begint
  de runstate leeg — een net afgeronde run stond dan op het rapport weer volledig op "wachtend".
- **Er wordt niet automatisch herverbonden.** EventSource doet dat standaard na een seconde of
  drie; dan mis je de berichten uit de tussentijd en krijg je een plaat met gaten die er compleet
  uitziet. Valt de verbinding weg, dan zegt de indicator dat, blijft staan wat er binnenkwam, en
  gaat de knop terug naar start. Opnieuw beginnen is de herstelactie, en die hoort bij de mens.
  Zie `client/src/contract/eventSourceBron.js`.

Dat de stream *tussen* runs dichtgaat is wél tijdelijk: dat vervalt zodra showcase-CBT hem
openhoudt.

**Let op:** zonder bereikbare showcase-CBT laadt de scenariopagina helemaal niet, ook niet in
opgeslagen modus — de stamdata komt namelijk óók van showcase-CBT. Dat wringt met de NFR "altijd
showbaar"; zie "Bekende aannames".

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

Zonder een bereikbare showcase-CBT/stub op die plek laadt de scenariopagina niet — de stamdata
komt daarvandaan. Zie de opmerking bij "Starten" hierboven.

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
- `npm run test:e2e` (in de root) — Playwright end-to-end tests. **Bekend kapot, nog niet
  gerepareerd:**
  - `pipeline-deelsysteem.spec.js` en `pipeline-live-run.spec.js` verwachten nog de oude,
    rijkere scenario-01/00-content (4 omgevingskolommen inclusief "Test", 20+ stappen) —
    die bestaat niet meer zonder de simulator. Moeten herschreven worden tegen de dunnere
    contract-voorbeelddata, of tegen een eigen vastgelegde opgeslagen-stream.
  - De suite draait standaard met meerdere parallelle workers tegen **één gedeelde
    stub-instantie**. De stub geeft per nieuwe verbinding de eerstvolgende run in een vaste
    rotatie van 3 — meerdere gelijktijdige tests laten daardoor los van elkaar rondlopen in
    diezelfde rotatie, wat tot niet-reproduceerbare uitkomsten leidt (geconstateerd: een test
    die keurig een run start, ziet die nooit als "eigen" run omdat een andere, gelijktijdig
    lopende test intussen de rotatie heeft opgeschoven). Vereist serieel draaien tegen de stub,
    of een stub-instantie per test/werker — nog niet ingericht.
  - `playwright.config.js`'s server-gezondheidscheck (`/api/hoofdstukken`) is al gerepareerd
    naar `/api/content/showcases`, anders start de suite nooit.

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
- **De opgeslagen modus is nog niet echt offline.** De opgenomen stream komt uit een bestand,
  maar de stamdata waar die stream aan gekoppeld wordt (`GET /v1/scenarios/:id`) komt nog van
  showcase-CBT. Zonder verbinding laadt de pagina dus niet, terwijl de NFR "altijd showbaar"
  juist vraagt dat dit wél kan. `client/public/opgeslagen/scenario-01.json` ligt er al klaar
  als offline stamdata; hij wordt alleen nog niet gebruikt. Nog te doen.
