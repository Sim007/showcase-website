# Usecases — showcase-website

Scope: scenario 00 t/m 09 (**10 scenario's**). Pagina's per scenario: homepage (keuze), plaat + logregels
(live), rapport, uitleg, detail.

Wijzigingslog (nieuwste bovenaan):
- 0.7.0 — vastgelegd dat de stream de uitkomst van een gate bepaalt, niet de website;
  `uitkomst` hoort niet in de stamdata
- 0.6.0 — besluiten uit de technische verkenning vastgelegd; terminologie provider/consumer
  vervangen door showcase-CBT / showcase-website; NFR "getest" toegevoegd
- 0.5.0 — besturing toegevoegd (sectie D: startcommando hoort ook in het contract); twee modi
  vastgelegd (live / opgeslagen); UC5 toegevoegd (run vastleggen); open punt over bewaren beslist
- 0.4.0 — rapportlogica belegd bij de website (consumer); benodigde data herstructureerd naar
  A. stamdata / B. live-stream / C. wat de website zelf afleidt
- 0.3.1 — live log en rapport uit elkaar getrokken als twee aparte dataproducten (stroom vs.
  eindproduct); open punt toegevoegd over wie het rapport samenstelt
- 0.3.0 — sectie "Benodigde data van showcase-CBT (consumer-behoefte)" toegevoegd, per veld
  herleid naar UC1 t/m UC4; drie open punten benoemd
- 0.2.4 — pipeline-statusonderscheid bevestigd: zichtbaar op deelsysteem-niveau (nog niet
  gestart / succesvol afgerond / gestopt); losstaand van UC4-toggle
- 0.2.3 — security-NFR bevestigd van toepassing op zowel website als showcase-CBT
- 0.2.2 — MVP-nummering laatste drie losgelaten (volgorde maakt niet uit, nummer nog te bepalen);
  UC4 expliciet losgekoppeld van pipeline-status; security-NFR toegevoegd
- 0.2.1 — NFR platform bevestigd: Windows 11 native (WSL vervallen)
- 0.2.0 — rollen bevestigd (content-beheer en operator liggen bij de testconsultant), UC4 toegevoegd
  (deelsysteem in-/uitklikken), foutscenario/pipeline-gedrag vastgelegd, NFR's toegevoegd, scope bevestigd
  op 10 scenario's, MVP-indeling toegevoegd, acceptatiecriteria nog open
- 0.1.0 — eerste versie, drie usecases

---

## Rollen

- **Testconsultant** — draait de showcase live, kiest scenario en omgeving, en beheert de content
  (intro, tegels). Dit zijn geen aparte rollen: alle drie liggen bij dezelfde persoon. → UC1, UC4, UC5.
- **Stakeholder** → UC2.
- **Tester** → UC3.

---

## UC1 — Testconsultant

**Als** testconsultant
**wil ik** tijdens een showcase op de plaat+logregels-pagina live tonen welke stap loopt en
welke grens of welk deelsysteem hij raakt, en na afloop op de rapportpagina het volledige
verloop,
**zodat ik** hetzelfde beeld kan hergebruiken voor wisselend publiek — leidinggevenden,
tribeleden, squadleden, testers, belangstellenden — over scenario 00 t/m 09.

**Na het zien:** kiest hij op de homepage het volgende scenario, of blijft hij op het
rapport staan terwijl hij toelicht.

*(De keuze van omgeving/scenario en het beheer van de content vallen onder deze zelfde rol —
zie ook UC4.)*

---

## UC2 — Stakeholder

**Als** stakeholder
**wil ik** op de uitlegpagina het waarom en wat lezen — zonder cijfers, versies of
tijdstempels — en op de rapportpagina een representatief voorbeeld zien met een expliciete
showcase-vermelding,
**zodat ik** overzicht heb bij het nemen van een beslissing.

**Na het zien:** vormt hij een oordeel, of vraagt door bij de testconsultant.

---

## UC3 — Tester

**Als** tester
**wil ik** op de detailpagina per stap de volgorde, testsoort, gereedschap en grens of
deelsysteem zien, gerenderd en niet als ruwe contractdump,
**zodat ik** het scenario kan nabouwen.

**Na het zien:** bouwt hij het na, en gebruikt het stap-id om zijn eigen uitkomst te
koppelen aan de rapportregels.

---

## UC4 — Testconsultant (deelsysteem filteren)

**Als** testconsultant
**wil ik** tijdens de live showcase een deelsysteem kunnen in- en uitklikken (tonen/verbergen),
**zodat ik** de aandacht van het publiek kan richten op het deelsysteem dat relevant is voor het
verhaal, zonder de andere deelsystemen definitief uit beeld te halen.

**Na het zien:** klikt hij het deelsysteem weer aan om het volledige beeld te herstellen.

> Bevestigd: dit in-/uitklikken is puur een zichtbaarheid-toggle (tonen/verbergen in de
> weergave) en staat los van de pipeline-status van dat deelsysteem — geen koppeling met
> "gestopt/nog niet gestart/afgerond" hieronder.

---

## UC5 — Testconsultant (run vastleggen)

**Als** testconsultant
**wil ik** een live run van een scenario kunnen opslaan in de website,
**zodat ik** dat scenario ook kan tonen wanneer showcase-CBT niet bereikbaar is — bij een klant,
zonder netwerk, of wanneer de omgeving niet draait.

**Na het opslaan:** kan hij het scenario in opgeslagen modus afspelen; de opgeslagen stream
vervangt de vorige voor dat scenario.

---

## Foutscenario / pipeline-gedrag

Expliciete afspraak: **fouten in een scenario mogen** — dit is een showcase, geen
productieomgeving. Wat wél vastligt: per deelsysteem is er een eigen pipeline. Deze pipeline
**stopt** zodra een stap niet lukt of een gate niet gehaald wordt. Dat stoppen is normaal,
verwacht gedrag — geen bug, maar onderdeel van wat getoond wordt.

**Bevestigd:** ja, de website moet dit onderscheid tonen, en wel **op deelsysteem-niveau** — elk
deelsysteem heeft zijn eigen zichtbare status:
1. Nog niet gestart
2. Succesvol afgerond
3. Gestopt (fout of gate niet gehaald)

Dit staat los van UC4 (in-/uitklikken): die toggle is puur tonen/verbergen, niet de status zelf.

---

## Benodigde data van showcase-CBT

Showcase-CBT bepaalt het contract; showcase-website past zich aan. Onderstaande lijst is dus géén
contractvoorstel, maar de behoefte van de website: wat er nodig is om UC1 t/m UC5 te kunnen tonen.
Elk veld is herleid naar de usecase die het vereist. Namen zijn beschrijvend, niet voorgeschreven —
showcase-CBT kiest de uiteindelijke naamgeving en vorm.

*(De woorden "provider" en "consumer" worden hier bewust vermeden: die zijn in dit domein al bezet
voor de rollen binnen een scenario. Zie `context.md`, hoofdstuk 2.)*

**Bevestigd: de rapportlogica ligt bij showcase-website, niet bij showcase-CBT.** Showcase-CBT
levert
dus twee dingen — *stamdata* (A) en de *live-stream* (B) — en de website bouwt daaruit zelf het
rapport op, per scenario én per deelsysteem (C).

### A. Stamdata — statisch, vooraf bekend

De structuur van het scenario, los van een concrete run. Nodig om de plaat te tekenen vóórdat er
iets gedraaid is, en om de detailpagina (UC3) te vullen.

**Scenario**

| Wat | Waarom (UC / bron) |
|---|---|
| Scenario-id (00 t/m 09) | UC1 — keuze op homepage, koppeling tussen pagina's |
| Scenario-naam | UC1 — tegel op homepage, kop op de plaat-pagina |

**Omgevingen**

| Wat | Waarom (UC / bron) |
|---|---|
| Lijst van omgevingen in het scenario, inclusief de keten-omgeving | UC1 — omgeving wordt getoond als verticale swimlane; keten-omgeving ontbrak eerder expliciet |
| Volgorde van de omgevingen | UC1 — bepaalt de volgorde van de swimlanes |

**Deelsystemen**

| Wat | Waarom (UC / bron) |
|---|---|
| Deelsysteem-id | UC4 — nodig om een specifiek deelsysteem te kunnen in-/uitklikken |
| Deelsysteem-naam | UC1, UC3 — naam moet zichtbaar zijn op de plaat (was eerder een gemis) |
| Volgorde/positie op de plaat | UC1 — bepaalt de opbouw van de pipeline-weergave |

*Let op: status staat hier bewust **niet** bij — die leidt de website zelf af, zie C.*

**Stappen**

| Wat | Waarom (UC / bron) |
|---|---|
| Stap-id (uniek) | UC3 — tester koppelt zijn eigen uitkomst aan de rapportregels via dit id |
| Volgordenummer | UC1, UC3 — volgorde van de stappen in plaat, rapport en detailpagina |
| Staptype: actie of gate | UC1 — twee soorten stappen moeten visueel onderscheiden worden |
| Naam / omschrijving van de stap | UC1, UC3 |
| Testsoort | UC3 — detailpagina |
| Gereedschap | UC3 — detailpagina |
| Geraakte grens of deelsysteem | UC1, UC3 — kern van wat er getoond wordt |
| Bijbehorend deelsysteem-id | UC4 — nodig om stappen mee te verbergen bij het uitklikken |
| Omgeving waarin de stap draait | UC1 — plaatsing in de juiste swimlane |

### B. Live-stream — tijdens het draaien

Wat real-time binnenkomt. Dit voedt de live-weergave én is de basis waaruit de website het
rapport opbouwt.

> **Wie bepaalt de uitkomst van een gate? De stream.** Showcase-CBT draait de stap, toetst de gate
> en meldt het resultaat. Showcase-website toetst niets; die leidt af. Toetsen hoort in de
> pipeline, bij de squad die de wijziging maakt — dat is de stelling van de showcase zelf. Zou de
> website bepalen of een gate gehaald is, dan verhuist de toets naar het venster waardoor je
> kijkt.
>
> Consequentie: `uitkomst` hoort **niet** in de stamdata. Dat is nu wel zo (zie
> `verkenning-contract-showcase-cbt.md`, §3) en moet worden rechtgezet.

| Wat | Waarom (UC / bron) |
|---|---|
| Cli-regel(s) zoals ze binnenkomen, in volgorde | UC1 — cli-output naast de plaat, live meelopen |
| Koppeling van elke regel aan een stap-id | UC1 — regel moet bij de juiste stap horen; UC4 — meeverbergen met het deelsysteem |
| Gebeurtenis "stap gestart" | UC1 — live tonen welke stap loopt |
| Gebeurtenis "stap beëindigd" met uitkomst (gehaald / niet gehaald) | C — hieruit leidt de website de deelsysteem-status en het rapport af |
| Signaal dat een deelsysteem-pipeline is gestopt | Foutscenario — bewust stoppen bij een niet-gehaalde gate |
| Signaal dat de run beëindigd is | C — bepaalt wanneer het rapport definitief is |

> **Belangrijk voor het gesprek met showcase-CBT:** omdat de rapportlogica bij de website ligt,
> moet de stream **machine-leesbare gebeurtenissen** bevatten en niet alleen vrije tekstregels.
> Als de website de uitkomst van een stap uit tekst moet parsen, is dat exact de fragiele situatie
> die je met het contract wilt vervangen. De cli-regels zijn er om te *tonen*; de gebeurtenissen
> zijn er om op te *redeneren*. Dat zijn twee verschillende dingen in dezelfde stroom.

### C. Wat de website zelf afleidt (niet uit het contract)

De volgende zaken zijn een verantwoordelijkheid van de website, opgebouwd uit A + B:

| Wat | Hoe |
|---|---|
| Status per deelsysteem: nog niet gestart / succesvol afgerond / gestopt | Afgeleid uit de stapuitkomsten en het stop-signaal in de stream |
| Rapport per deelsysteem | Verloop van de eigen stappen, met uitkomst en eindstatus |
| Rapport per scenario | Samenvoeging van de deelsysteemrapporten tot één beeld |
| Leesbare samenvatting voor de stakeholder (UC2) | Opmaak- en samenvattingslogica in de website |

### D. Besturing — van de website naar showcase-CBT

De website is niet alleen ontvanger. De startknop op de scenariopagina moet het scenario
daadwerkelijk starten. Dat commando hoort dus **ook in het contract**.

| Wat | Waarom (UC / bron) |
|---|---|
| Commando "start scenario X" | UC1 — de testconsultant start het scenario tijdens de showcase |
| Bevestiging dat het scenario gestart is (of een foutmelding) | UC1 — de knop moet terugkoppelen of het gelukt is |

> **Beslist: reset heeft geen eigen commando nodig.** Reset is "plaat schonen" plus "opnieuw
> starten". Schonen is lokaal. Opnieuw starten is in live-modus het startcommando hierboven, en in
> demo-modus het opnieuw afspelen van de opgeslagen stream.

### Twee modi: live en opgeslagen

De NFR "altijd showbaar" wordt ingevuld met twee modi, af te lezen aan de verbindingsindicator:

| Modus | Wanneer | Bron |
|---|---|---|
| **Live** | showcase-CBT is bereikbaar (status: verbonden) | Live-stream van showcase-CBT (B), gestart via het startcommando (D) |
| **Opgeslagen** | geen verbinding | Een eerder opgeslagen stream in de website zelf |

De opgeslagen stream wordt **afgespeeld als een run**, niet als een kant-en-klaar eindresultaat —
de plaat loopt door en de logregels verschijnen zoals ze destijds binnenkwamen. Zo is het beeld
in beide modi hetzelfde.

Er is geen historie: per scenario is één opgeslagen stream genoeg. Zie UC5 voor het vastleggen
ervan.

### Niet uit het contract (content, beheerd door de testconsultant)

Deze zaken komen **niet** uit showcase-CBT en horen dus niet in het contract:

- Bewerkbare intro op de homepage
- Teksten op de uitlegpagina (het waarom en wat — UC2, expliciet zonder cijfers, versies of
  tijdstempels)
- De expliciete showcase-vermelding op de rapportpagina (UC2) — *aanname: dit is een vaste
  websitetekst, geen data uit het contract. Graag bevestigen.*

### Open punten in deze behoeftelijst

1. **Stapstatus versus deelsysteemstatus.** Je hebt bevestigd dat status op *deelsysteem*-niveau
   wordt getoond. Maar UC1 vraagt óók om live te tonen welke *stap* loopt, en het rapport toont
   het volledige verloop per stap. De website houdt dus feitelijk ook per stap een toestand bij.
   Te bepalen: tonen we die stapstatus ook visueel, of blijft die intern?
2. **Grens versus deelsysteem.** In UC1 en UC3 staat "grens of deelsysteem". Te bepalen: is een
   grens een eigen entiteit met eigen id/naam, of een eigenschap van een stap?
3. **Tijdstempels.** UC2 sluit ze expliciet uit op de uitlegpagina. Onduidelijk is of het rapport
   of de live-weergave ze wél nodig heeft. Te bepalen.
4. **Bewaren van runs.** *Beslist:* geen historie. Wel één opgeslagen stream per scenario, voor de
   opgeslagen modus. Zie UC5 en "Twee modi".

---

## Besluiten naar aanleiding van de technische verkenning

Zie `verkenning-contract-showcase-cbt.md` voor de bevindingen van de squad.

1. **Adapter nu bouwen, nog niet aansluiten.** Stamdata en rundata worden nu gesplitst en er komt
   een adapter, maar nog geen koppeling met een extern showcase-CBT. Doel: het aan onszelf kunnen
   showcasen.
2. **Deelsysteem-status is in scope** van deze wijziging. Hoe precies is nog nader te bepalen.
3. **Niet-uitgevoerde stappen worden getoond** als "niet uitgevoerd" — juist dát de pipeline daar
   stopte, is het verhaal.
4. **Reset heeft geen eigen commando nodig** — zie sectie D.

**Nog open uit de verkenning:** *beantwoord* — "verbonden" betekent **verbonden met
showcase-CBT**, niet de verbinding van de browser naar de eigen server. Zolang showcase-CBT niet
aangesloten is, meet de indicator het verkeerde ding en staat hij ten onrechte altijd op
verbonden. Dat raakt direct het onderscheid tussen live en opgeslagen modus.

**Bevindingen die de squad signaleerde en die hier vastliggen:**
- Het rode pad is nooit gelopen: `uitkomst` staat in het stamdatabestand, alles is groen, en de
  runner heeft geen stopconditie per deelsysteem. Dit blokkeert scenario 03 (Breaking wijziging).
- UC4 bestaat al op de pipelinepagina (de chips), maar niet op de rapportpagina.
- UC3 kan nog niet: testsoort en gereedschap hebben geen veld. Wacht toch al op de
  terminologielijst van de tribe.

---

## Niet-functionele eisen (NFR's)

Deze lijst is de enige plek waar de NFR's staan. `context.md` verwijst hiernaar.

- **Altijd showbaar** — op elk moment demonstreerbaar, zonder opstarttijd of instabiele staat.
  Twee modi: **live** wanneer showcase-CBT bereikbaar is, en **opgeslagen** wanneer er geen
  verbinding is. Zie "Twee modi".
- **Geen historie** — runs en rapporten worden niet bewaard om terug te kijken. Dit is een
  showcase, geen registratiesysteem. Eén opgeslagen stream per scenario is genoeg.
- **Draagbaar** — draait in een container, of lokaal op Mac, Ubuntu of **Windows 11 (native)**.
  Niet WSL; eerdere vermelding daarvan (sessie 1, 17:26) is vervallen. Check of bestaande scripts
  die van WSL uitgaan aangepast moeten worden.
- **Eén pagina** — alles past op één scherm bij F11 op 1920 × 1080 px, zonder paginascroll.
- **Secure code en libraries** — geen bekende kwetsbaarheden, dependency-scanning van toepassing.
- **Getest** — showcase-website moet zelf getest zijn. Een showcase over testen die niet getest
  is, ondermijnt zijn eigen boodschap. *Nog te bepalen: welke testsoorten en welk niveau; wacht op
  de terminologielijst van de tribe.*

Deze eisen gelden voor showcase-website én voor showcase-CBT.

> Kansrijk gegeven het onderwerp: showcase-website is straks een deelsysteem met een echte
> contractgrens. Een consumer-driven contracttest op die grens is dan niet alleen nuttig, maar ook
> een voorbeeld van wat de showcase zelf uitlegt. Zie ook scenario 10 in `context.md`, hoofdstuk 2.

---

## Scope en telling

Bevestigd: **10 scenario's**, genummerd 00 t/m 09.

---

## MVP-indeling

| MVP | Scenario's |
|------|-----------|
| MVP1 | 00 + 01 |
| MVP2 | 02 + 03 |
| MVP3 | 04 + 05 |
| MVP (nummer nog te bepalen) | 06 |
| MVP (nummer nog te bepalen) | 07 |
| MVP (nummer nog te bepalen) | 08 + 09 |

- Elke volgende MVP bevat ook de verbeteringen uit de voorgaande MVP's.
- Vanaf MVP3 maakt de onderlinge volgorde niet meer uit — het nummer van de laatste drie MVP's
  (06 / 07 / 08+09) ligt daarom nog niet vast en wordt later bepaald.
- Er is nog geen planning/datum aan de MVP's gekoppeld.

---

## Acceptatiecriteria per usecase

**Nog te bepalen.** Open actie: per UC vastleggen wanneer deze geslaagd is (bijv. UC3: hoe wordt
getoetst dat de tester het scenario succesvol heeft nagebouwd?).
