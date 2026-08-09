# Context — showcase-CBT & showcase-website

> Drie hoofdstukken volgens de 3 P's: **People**, **Product**, **Process**. Samen beschrijven ze
> waar de showcase zich afspeelt: wie er werken, waar het over gaat, en hoe er gewerkt wordt.
>
> **Alles hier is showcase.** Geen bestaande organisatie, geen klant, geen bestaande werkwijze —
> en ook geen verzinsel. Het is een uitgewerkt voorbeeld, gemaakt om getoond te worden.
>
> Wat er gebouwd wordt en waarom staat niet hier, maar in `usecases-showcase-website.md`.
>
> Versie 1.7.0 — toetsen belegd bij showcase-CBT, afleiden bij showcase-website
> Versie 1.6.0 — contractgrens hangt aan het deelsysteem (eigenaarschap kan verhuizen);
> mindset toegevoegd: het triberesultaat telt
> Versie 1.5.0 — kern aangescherpt: het gaat om communicatie tussen squads; een afspraak breekt
> stil, een contract breekt luid
> Versie 1.4.0 — fundament toegevoegd: waarom deze organisatie contract-based testing mogelijk
> maakt
> Versie 1.3.0 — organisatie en product ingevuld; Process herkaderd naar één proces (feature naar
> productie); architectuurprincipe verplaatst naar Product
> Versie 1.2.0 — alles herkaderd als showcase; team vervangen door squad; inleiding vervangen
> Versie 1.0.0 — samenvoeging van `way-of-working.md`, `domeinkennis.md` en `organisatie.md`

## Kernidee

**Showen is beter dan ideeën en documenten.** Showcase-CBT en showcase-website bestaan om
contract-based testing aantoonbaar te maken: één werkend voorbeeld per grenstype, zodat het
mechanisme getóónd wordt in plaats van beschreven. Dat is ook de meetlat voor dit werk — als een
document of discussie niet leidt tot iets dat je kunt laten zien, is het een omweg.

Dit is showcasecode, geen productiecode.

---

## Het fundament

De showcase gaat uit van een organisatie die een aantal dingen al op orde heeft. Niet omdat dat
vanzelfsprekend is, maar omdat contract-based testing zonder die basis niet landt. Het fundament
bestaat uit drie lagen.

**Het deelsysteem is de eenheid.** Eigenaarschap, uitrol en toetsing hangen allemaal aan het
deelsysteem: één feature squad, één deelsysteem, één pipeline. Alle software draait in containers
op een Kubernetes-platform dat door één dedicated delivery platform team wordt geleverd. Squads
bouwen features; het platform levert de rails.

**Software wordt continu voortgebracht.** CI/CD-pipelines zijn de enige weg naar productie. Testen
is geen fase aan het eind maar een doorlopende activiteit — continuous testing, in de pipeline, bij
elke wijziging. Wat niet door de pipeline komt, komt niet in productie.

**Autonomie binnen kaders.** De tribe stelt de standaarden, de squads zijn daarbinnen autonoom.
Standaardisatie is de norm en afwijken mag, mits onderbouwd: comply or explain. Agile werken en
continuous everything zijn daarbij uitgangspunt, geen ambitie.

### Waarom een contract, en geen afspraak

Het gaat om communicatie. **Binnen** een squad regel je afstemming zelf: je deelt context, je
overlegt, en wat je stukmaakt herstel je in dezelfde codebase. **Tussen** squads werkt dat niet —
andere backlog, andere prioriteiten, geen gedeelde context. Daar is iets expliciets nodig.

Een afspraak is daarvoor te zwak. Een afspraak staat in een document, een thread of iemands hoofd.
Hij verwatert, en als hij gebroken wordt merkt niemand dat op het moment zelf — meestal pas
verderop in de keten, bij iemand anders.

Een contract is machinaal toetsbaar. Breekt het, dan valt de pipeline om: bij de squad die het
brak, vóórdat iemand anders er last van heeft. Een afspraak breekt stil, een contract breekt luid.

**De grens ligt bij het deelsysteem, niet bij de squad.** Een squad is eigenaar van een
deelsysteem, maar dat eigenaarschap kan verhuizen. Daarom hangt het contract aan het deelsysteem
en niet aan wie het vandaag beheert. Elke deelsysteemgrens is een contractgrens — ook als twee
deelsystemen nu toevallig bij dezelfde squad liggen.

Bij drie squads kom je nog een eind met afspraken. Bij vijftien niet meer. Autonomie op die schaal
houdt alleen stand als de grens tussen deelsystemen expliciet en toetsbaar is.

### Mindset: het triberesultaat telt

Een gate die een pipeline stopt, houdt een squad op. Dat is alleen houdbaar als niet de squad maar
de **tribe** op resultaat wordt afgerekend. Dan is een geblokkeerde pipeline geen persoonlijke
misser maar het systeem dat doet wat het moet doen: er is schade voorkomen bij iemand anders.

Een squad mag een mindere sprint hebben. Wordt er per squad gescoord, dan verandert comply or
explain in een ontsnappingsroute en gaan mensen om de gate heen werken. Het triberesultaat is wat
de gates cultureel houdbaar maakt — techniek alleen is niet genoeg.

Het fundament levert daarvoor de voorwaarden:

- Het deelsysteem als eenheid maakt duidelijk wáár de grens ligt.
- Uniforme CI/CD-pipelines maken het mogelijk op elke grens dezelfde gate te zetten.
- Continuous testing maakt van die gate een doorlopende toets in plaats van een eindcontrole.
- Comply or explain zorgt dat die gate overal geldt zonder de autonomie te slopen.

Zonder dit fundament is contract-based testing een goed idee dat blijft hangen. Mét dit fundament
is het de logische volgende stap. Dát is wat de showcase laat zien.

---

# 1. People — de organisatie

## Waarom een eigen organisatie

Een showcase-organisatie kan aan iedereen getoond worden: geen NDA, geen klantgegevens, geen
herkenbare interne situatie. Dat is een voorwaarde voor een publieke showcase. Het maakt de
showcase bovendien bespreekbaar: niet "zo doen wij het", maar "zo zou het kunnen werken".

## Structuur

Een enterprise met daarbinnen één multidisciplinaire **tribe**:

- **10 à 20 feature squads.** Elke squad is eigenaar van een of meer deelsystemen.
- **Eén dedicated delivery platform team** — CI/CD en het Kubernetes-platform.

De tribe stelt de kaders; squads zijn daarbinnen autonoom.

## Rollen

Uit de usecases komen deze rollen naar voren: PO, testconsultant, tester, stakeholder,
leidinggevende, tribelid, squadlid.

> Nog aan te vullen: wat elke rol doet en beslist.

---

# 2. Product — het domein

## Wat het product doet

- Ondersteunt een aantal **end-to-end businessprocessen**.
- Bedient een **beperkt aantal doelgroepen**.
- Draait volledig in **containers**.

## Omgevingen

Er zijn drie omgevingen: **CI**, **Test** en **Acceptatie**.

**CODE is geen omgeving.** Het is wél een kolom op de plaat. Unittesten en integratietesten van
een microservice hebben geen omgeving nodig — die draaien op de code zelf.

**Test en Acceptatie zijn volledig geïntegreerde omgevingen**, met deelsystemen die Release
Candidate zijn.

## Testsoorten

Een testsoort is iets anders dan een omgeving. Dezelfde testsoort kan op meerdere omgevingen
draaien.

> **Volgt later.** De tribe heeft een eigen terminologielijst; die is leidend en wordt hier
> overgenomen zodra hij beschikbaar is. Tot die tijd worden testsoorten hier niet gedefinieerd.

## Deelsystemen

Een scenario bestaat uit een of meer deelsystemen. **Elk deelsysteem heeft zijn eigen pipeline.**
Die pipeline stopt zodra een stap mislukt of een gate niet gehaald wordt. Elk deelsysteem heeft
één eigenaar: een feature squad.

**Showcase-website is zelf ook een deelsysteem binnen showcase-CBT.** Het is dus niet alleen het
venster waardoor je kijkt, maar ook een van de dingen waar je naar kijkt.

## Stappen

Er zijn twee soorten stappen:

- **Actie** — voert iets uit.
- **Gate** — toetst of er verder gegaan mag worden.

Elke stap heeft een uniek nummer, doorlopend over het hele scenario.

## Contract-based testing

De showcase maakt contract-based testing aantoonbaar met **één werkend voorbeeld per grenstype**.
De rolverdeling provider/consumer staat centraal: de provider bepaalt het contract, de consumer
past zich aan.

> **Let op de woorden.** Provider en consumer zijn domeinbegrippen: binnen een scenario is
> bijvoorbeeld Payment de provider en Order de consumer. Gebruik die woorden **niet** voor de
> relatie tussen showcase-CBT en showcase-website — dat verwart, juist in een showcase over dit
> onderwerp. Noem showcase-CBT gewoon showcase-CBT.

> Aan te vullen: definitie van "grens" en "grenstype", en of een grens een eigen entiteit is of
> een eigenschap van een stap. Dit staat ook als open punt in `usecases-showcase-website.md`.

## Architectuurprincipe showcase-website

**Showcase-CBT bepaalt het contract; showcase-website past zich aan.** De website schrijft niet
voor hoe het contract eruitziet — hij geeft alleen aan welke data hij nodig heeft en waarom. Het
contract is tweerichtingsverkeer: er komt data binnen (stamdata en stream) en er gaat een
startcommando uit.

**Toetsen ligt bij showcase-CBT, afleiden bij showcase-website.** Showcase-CBT draait de stappen,
toetst de gates en meldt de uitkomsten via de stream. De website toetst niets. Dat is geen
werkverdeling maar een principe: de gate hoort in de pipeline, bij de squad die de wijziging
maakt. Ligt de toets in het venster waardoor je kijkt, dan demonstreert de showcase iets anders
dan hij beweert.

**De rapportlogica ligt bij showcase-website.** Showcase-CBT levert stamdata (scenario,
omgevingen, deelsystemen, stappen) plus een live-stream met gebeurtenissen. De website leidt
daaruit zelf de deelsysteem-status en het rapport af, per scenario en per deelsysteem.

| | Wie |
|---|---|
| Toetsen — is deze gate gehaald? | showcase-CBT |
| Afleiden — wat betekent dat voor het deelsysteem en het rapport? | showcase-website |

## Scenario's

Scenario's 00 t/m 09, met 10 als kandidaat:

| Nr | Titel | Onderwerp |
|---|---|---|
| 00 | Startsituatie | Hoe het gaat zónder contracttesten |
| 01 | Basis (API) | Hoe het gaat mét contracttesten — Order → Payment, REST, spec-first |
| 02 | Wijziging zonder breuk | Additieve wijziging naast de bestaande versie |
| 03 | Breaking wijziging | Twee majors naast elkaar in dezelfde runtime |
| 04 | Acceptatie | De gebruikersflow over de volledige keten |
| 05 | Sunset | Een oude major netjes uit de runtime halen |
| 06 | Async | Payment → Notification, via AsyncAPI |
| 07 | SOAP | Een externe betaalprovider, WSDL/XSD |
| 08 | FE | *nog aan te vullen* |
| 09 | Shell | *nog aan te vullen* |
| 10 | Showcase-website | *Kandidaat.* De website als deelsysteem, met een echte contractgrens en eigen tests. Kan pas bestaan als dat contract en die tests er echt zijn. |

---

# 3. Process — van feature naar productie

Er is **één proces**: hoe een feature in productie komt. Alles hieronder valt daarbinnen.

## Waar de showcase op inzoomt

Showcase-CBT belicht het **testproces** binnen dat ene proces: hoe testen eruitziet mét
contract-based testing. Het vertrekpunt is de situatie **zonder** CBT — dat is scenario 00. Elk
volgend scenario laat zien wat CBT daaraan verandert.

## Rollen

| Rol | Wie | Doet |
|---|---|---|
| **PO** | de consultant | Beslist. Brengt onderwerpen in, bepaalt richting en prioriteit. |
| **Stakeholderfeedback** | Claude (chat) | Daagt uit, zoekt hiaten en tegenstrijdigheden, stelt vragen. Beslist niet. Ziet de codebase bewust niet. Schrijft de prompt voor de squad. |
| **Squad** | Claude Code | Bouwt. Autonoom binnen de kaders van de tribe. |

De squad is autonoom in het *hoe*. De PO bepaalt het *wat* en *waarom*. De squad **moet**
terugpraten: een opdracht die technisch onhandig of onhaalbaar is, wordt ter discussie gesteld
vóórdat er gebouwd wordt. Dat is geen beleefdheid maar een verplichting.

> Bij voorkeur zou de squad rechtstreeks in de chat meepraten. Dat kan technisch nog niet.
> Daarom loopt de terugkoppeling via de PO, die de samenvatting van de squad in de chat plakt.
> Dit is een tijdelijke omweg, geen gewenste situatie.

## Flow

1. PO brengt een onderwerp of besluit in.
2. Stakeholderfeedback: hiaten, tegenstrijdigheden, vragen — verbreden.
3. PO beslist.
4. Besluit landt in `usecases-showcase-website.md`.
5. Waar nodig: de squad doet eerst een **technische verkenning** (alleen lezen, niet bouwen) en
   levert een samenvatting die PO en stakeholderfeedback kunnen lezen zonder de code te zien.
6. Refinement op basis van die samenvatting — hier sneuvelen aannames.
7. Stakeholderfeedback schrijft de bouwprompt → squad bouwt → **technische samenvatting terug**
   (wat gebouwd, welke bestanden geraakt, welke keuzes gemaakt). De PO plakt die samenvatting
   terug in de chat.

Stap 5 is niet elke keer nodig; alleen als een vraag technisch gewicht heeft.

Stap 7 is niet optioneel. Zonder die terugkoppeling werken PO en stakeholderfeedback op een
verbeelde codebase — dat is eerder misgegaan.

## Kaders

De niet-functionele eisen en de scope (10 scenario's, MVP-indeling) staan in
`usecases-showcase-website.md`. Dat is de enige plek waar ze onderhouden worden — hier staan ze
bewust niet, om te voorkomen dat twee lijsten uit elkaar lopen.

## Documenten

Deze documenten staan in de repo van showcase-CBT, samen met de code. Die repo is **publiek op
GitHub**. Zodra ze daar staan is dát de bron: wijzigingen landen in de repo, niet in een chat.

- `context.md` — dit document: People, Product, Process.
- `usecases-showcase-website.md` — de enige plek waar besluiten landen: usecases, benodigde data,
  NFR's, MVP-indeling, open punten. Bij twijfel gaat dit document voor op wat in een chat is
  gezegd.
