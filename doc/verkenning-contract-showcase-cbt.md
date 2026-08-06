# Technische verkenning — overgang naar contract met showcase-CBT

> Alleen gelezen, niets gebouwd of gewijzigd. Input voor refinement door PO en stakeholderfeedback
> (zie `way-of-working.md`, stap 5). Gebaseerd op `way-of-working.md`, `domeinkennis.md` en
> `usecases-showcase-website.md`, plus de code in `server/` en `client/`.

## 1. Datastroom

Twee kanalen, elk op één plek geparsed:
- **REST** (`server/src/app.js`): stamdata — `/api/hoofdstukken`, `/api/hoofdstukken/:id` (leest
  `server/src/events/hoofdstuk-<id>.json` via `loadDataset`), plus `/api/content/intro` en
  `/api/content/showcases`.
- **WebSocket**, pad `/ws` (`server/src/index.js`): live berichten `state`, `run-started`, `event`,
  `run-finished`, `reset`. Geparsed op één plek client-side (`client/src/useLiveRun.js`).

Geen versnippering — dat is netjes.

**Achter "verbonden"** zit puur `socket.onopen`/`onclose` van de browser-WebSocket náár de eigen
Node-server (`useLiveRun.js`). Er is nog geen extern showcase-CBT: de Node-server speelt zelf de
provider (`simulator.js`). De indicator meet vandaag de eigen infrastructuur, niet een echte
providerverbinding.

**Onvolkomenheden:**
- `simulator.js` kopieert `uitkomst` 1-op-1 uit het bronbestand door in plaats van iets te
  berekenen. Beide `hoofdstuk-*.json`-bestanden hebben uitsluitend `"uitkomst": "groen"` — er is
  geen "rood"-pad ooit doorlopen.
- De runner doorloopt altijd de volledige `events`-array, ook al zou een stap "rood" zijn — geen
  stopconditie per deelsysteem. Dat is in tegenspraak met de domeinregel "pipeline stopt zodra een
  stap mislukt" (`domeinkennis.md`).
- Eén gedeelde run-state voor alle clients; een tweede start tijdens een lopende run wordt stil
  genegeerd, geen foutmelding.
- De client maakt de socket eenmalig aan (lege dependency-array); bij een korte drop zonder
  page-reload komt er geen automatische reconnect.

## 2. Datamodel

**Expliciet gemodelleerd:** scenario (id/titel/ondertitel), omgeving (`code`/`ci`/`test`/
`acceptatie`, vier vaste keys in `statusMeta.js`), deelsysteem (`payment`/`order`/`keten`), stap
(nr, type, stap, cli, uitkomst, bijzonderheden), staptype actie/gate.

**Alleen impliciet / niet gemodelleerd:** "grens" (geen apart veld of entiteit — open vraag uit
`domeinkennis.md` blijft in de code ook open), testsoort en gereedschap per stap (nodig voor UC3,
maar nergens een veld voor), deelsysteem-status, en een eigen semantiek voor "gate" (een gate heeft
dezelfde `uitkomst`-waarden als een actie — geen apart "doorgaan ja/nee").

**Status van een stap:** puur runtime, in-memory — canoniek in `simulator.js`'s `state.events`,
gespiegeld in de client-map in `useLiveRun.js`. Niet persistent; bij serverherstart alles weg.
`wachtend` is een client-side default (`usePipelineRun.js`) zolang er geen live-event is, geen
serverconcept.

**Deelsysteem-status bestaat niet.** Nergens in server of client wordt "nog niet gestart /
afgerond / gestopt" per deelsysteem afgeleid of bewaard, ondanks dat dit in
`usecases-showcase-website.md` als bevestigd staat. Nog te bouwen.

**CODE als kolom, geen omgeving:** klopt functioneel met de regel uit `domeinkennis.md`, maar de
code maakt het onderscheid niet expliciet — `OMGEVINGEN` behandelt code/ci/test/acceptatie als vier
gelijke kolommen zonder markering dat code technisch geen omgeving is.

## 3. Stamdata vs. rundata

Opvallend: het bronbestand (`hoofdstuk-XX.json`) bevat nu al `uitkomst` en `bijzonderheden` per
stap — dat is eigenlijk rundata (het resultaat van een run), niet stamdata (structuur vóór de run).
Het huidige scenario is een vastgelegd script, geen situatie waarin de uitkomst tijdens de run
ontstaat.

Wat wél tijdens de run ontstaat: alleen `tijd` en de timing/volgorde van broadcasts.

**Gescheiden of door elkaar:** door elkaar — één plat objecttype voor beide. Voor de overgang naar
het contract (A. stamdata zonder uitkomst / B. stream met gebeurtenissen, zoals
`usecases-showcase-website.md` voorschrijft) is dit geen uitbreiding maar een splitsing van het
huidige bestand.

## 4. Besturing

**Startknop** → `Pipeline.jsx: start(id)` → WS `{type:'start', hoofdstuk}` → server laadt het
bestand en start `runner.start()`. Volledig lokaal — er gaat niets naar een extern systeem, want de
eigen Node-server ìs de simulator.
**Resetknop** → WS `{type:'reset'}` → zet gedeelde state terug naar idle. Ook lokaal.

Sectie D uit de usecases-doc (startcommando hoort in het contract) is in de code nog niet aan de
orde — er is nog geen aparte provider om aan te sturen.

## 5. Rapport

Geen apart afgeleid product: `Report.jsx`/`ReportTable.jsx` gebruiken dezelfde `steps`-lijst en
dezelfde hook (`usePipelineRun.js`) als de pipeline-pagina, alleen in tabelvorm. Geen aggregatie,
geen samenvatting per deelsysteem, geen eindstatus.

**Bij verversen:** client haalt stamdata opnieuw op en opent een nieuwe socket; de server stuurt
zijn huidige gedeelde `state` terug. Is er gereset of de server herstart, dan is alles weg — nul
opslag aanwezig, wat bevestigt dat UC5 (run vastleggen) volledig nieuw is.

## 6. Schaalbaarheid naar 10 scenario's

**Generiek:** rendering (`PipelineGraph`, `CliPanel`, `ReportTable`), routing (`/hoofdstuk/:id`),
server-routes en runner zijn puur data-gedreven.

**Specifiek voor 00/01:** `statusMeta.js: DEELSYSTEEM_LABELS` en de CSS-klassen
`ds-payment`/`ds-order`/`ds-keten` zijn hardcoded. Een scenario met nieuwe deelsysteem-namen (bv. 07
SOAP, 08/09 frontend) heeft geen label/kleur totdat dat handmatig wordt toegevoegd.

**Per nieuw hoofdstuk:** in de huidige opzet alleen data (nieuw JSON-bestand + entry in
`content/showcases.json`, zoals `README.md` al beschrijft) — *behalve* wanneer nieuwe
deelsysteem-namen nodig zijn, dan ook een kleine codewijziging. Dus niet 100% zuiver "alleen data".

## 7. Bestaande functionaliteit

**Chips Payment/Order:** dit zijn de `ds-pill`-knoppen in `Pipeline.jsx` — exact UC4, een lokale
tonen/verbergen-toggle per deelsysteem (React state `uitgeschakeld`), zonder koppeling aan
pipeline-status. Alleen op de pipeline-pagina; de rapportpagina heeft geen toggle.

**F11 op 1920×1080:** landingpagina en pipeline-pagina zijn er expliciet op gebouwd
(`styles.css`: `height:100vh; overflow:hidden` met interne scrollpanelen, met code-commentaar dat
dit de bedoelde aanpak is). De rapportpagina gebruikt de generieke `.page`-stijl zonder die
behandeling en scrollt gewoon de hele pagina mee. Niet visueel getest (conform "bouw niets"), maar
op basis van de CSS volgt de rapportpagina niet hetzelfde patroon.

## 8. Oordeel

**Diep zittende keuzes:**
- Uitkomst en bijzonderheden staan al in het stamdata-bestand (zie §3) — fundamenteel anders zodra
  uitkomst uit een echte stream moet komen. Raakt `simulator.js` en beide events-bestanden.
- "Verbonden" = eigen websocket-status, niet providerstatus. Raakt het hele live/opgeslagen-
  onderscheid uit de usecases-doc.
- Geen scheiding stamdata/stream in de code — het opsplitsen is een structuurwijziging, geen
  toevoeging.

**Grootste risico bij de overgang:** de aanname dat de website zelf het rapport opbouwt uit
stap-gebeurtenissen vereist machine-leesbare start/eind-events per stap van de provider. Nu bestaat
dat onderscheid niet — er is precies één eventtype met een `uitkomst`-veld dat zowel "lopend" als
eindresultaat draagt. Als de echte showcase-CBT-stream anders structureert (bv. losse cli-tekst
zonder expliciete stapgrenzen), moet de website gaan parsen — exact het fragiele patroon dat de
usecases-doc wil vermijden. Dat spanningsveld is nu onzichtbaar omdat de simulator zijn eigen input
controleert.

**Vragen aan de PO vóór er gebouwd wordt:**
1. Blijven hoofdstuk 00/01 handgeschreven JSON-bestanden die showcase-CBT nabootsen, of komt er al
   in deze stap een echte adapter (zoals `README.md` aankondigt)? Bepaalt of dit refactor of
   nieuwbouw is.
2. Is "verbonden" een socketstatus náár de website-server, een status van de website-server náár
   showcase-CBT, of beide apart zichtbaar?
3. Hoort de reset-knop bij het contract (commando naar showcase-CBT), of blijft die puur lokaal?
   Nog open in de usecases-doc.
4. Deelsysteem-status is vastgelegd als eis maar nergens gebouwd — scope van déze wijziging, of een
   losse vervolgstap?
5. Als een deelsysteem-pipeline stopt bij een mislukte stap: moeten de resterende, niet-uitgevoerde
   stappen zichtbaar zijn in het rapport als "niet uitgevoerd", of gewoon ontbreken?
