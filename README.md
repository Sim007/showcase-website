# showcase-website

Real-time demonstratiewebsite voor de showcase-cbt-pipelines. De twee uitgewerkte
hoofdstukken (00-start, 01-basis) draaien hier als **gesimuleerde replay**: dezelfde
stapvolgorde, dezelfde CLI-commando's en dezelfde rapportstructuur als de echte
Docker-pipelines, zonder dat de echte showcase-cbt-omgeving nodig is.

De server praat met showcase-CBT via een adapter (`server/src/adapter/`). Vandaag zit
daar een simulator achter die zelf de gates toetst en de stream naspeelt; de rest van
de server en de hele client praten alleen tegen die adapter, niet tegen de simulator
rechtstreeks. Stamdata (structuur, geen uitkomst) staat in `server/src/scenarios/*.json`;
de uitkomst per stap — die pas tijdens een run ontstaat — staat gescheiden in
`server/src/adapter/simulator-scripts/*.json`, en wordt alleen via de live-stream
(WebSocket) naar de client gestuurd. Het aansluiten op een echt showcase-CBT is een
latere stap: die vervangt alleen de adapter's inhoud, niet de rest van de code.

## Starten

```sh
docker compose up --build
```

- Website: http://localhost:5173
- API/websocket: http://localhost:4000

## Draaien vanaf een gepubliceerde image-tag

Voor een showcase zonder lokale build: `docker-compose.release.yml` gebruikt kant-en-klare
images uit GitHub Container Registry (`ghcr.io/sim007/showcase-website/server` en
`.../client`), getagd met de git-tag waaruit ze gebouwd zijn.

```sh
TAG=first-mvp docker compose -f docker-compose.release.yml up
```

Zonder `TAG` wordt `first-mvp` gebruikt. Website en API draaien op dezelfde poorten als
hierboven.

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

## Nieuw hoofdstuk toevoegen

1. Zet stamdata neer in `server/src/scenarios/hoofdstuk-<id>.json` (nr, omgeving,
   deelsysteem, type, stap — geen uitkomst).
2. Zet het bijbehorende simulatiescript neer in
   `server/src/adapter/simulator-scripts/hoofdstuk-<id>.json` (nr, cli, uitkomst,
   bijzonderheden), met dezelfde `nr`'s als de stamdata.
3. Zet `"status": "werkt"` voor dat hoofdstuk in `content/showcases.json`.
4. Introduceert het hoofdstuk een nieuwe deelsysteem-naam (iets anders dan payment/
   order/keten), voeg die dan ook toe aan `client/src/statusMeta.js`
   (`DEELSYSTEEM_LABELS`) en aan `client/src/styles.css` (`--ds-<naam>` en de
   bijbehorende `.ds-pill`/`.swimlane`-regels) — dat is nog niet data-gedreven.

## Testen

- `cd server && npm test` — unit tests voor de simulator (`simulator.js`, inclusief het rode pad: gate niet gehaald → alleen dát deelsysteem stopt, resterende stappen "niet uitgevoerd") en integratietests voor de API-routes (`app.js`, inclusief dat de stamdata-response geen `uitkomst`/`bijzonderheden`/`cli` bevat), met vitest.
- `cd client && npm test` — unit tests (`simpleMarkdown.js`, `deriveDeelsysteemStatus.js`) en componenttests (React Testing Library) voor `ShowcaseTile`, `ReportTable`, `PipelineGraph`.
- `npm run test:e2e` (in de root) — Playwright end-to-end tests tegen de echte server + client. Start beide dev-servers automatisch (poort 4000/5173) als die nog niet draaien.

## Bekende aannames (MVP)

- Eén run tegelijk gedeeld over alle verbonden clients — geen per-gebruiker sessies.
- Geen dark mode, geen authenticatie — voor een lokale demo niet nodig.
- Het aantal en de precieze inhoud van de stappen is een representatieve
  reconstructie op basis van de README's van hoofdstuk 0 en 1, niet een 1-op-1 export
  van een echte pipeline-run.
