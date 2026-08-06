# Domeinkennis — showcase-CBT & showcase-website

> Begrippen en vaste feiten uit het domein. Losgetrokken van `way-of-working.md`, dat over
> samenwerken gaat en niet over de inhoud.
>
> Dit document groeit door het te doen — voortschrijdend inzicht wordt hier vastgelegd zodra het
> er is, niet vooraf bedacht.
>
> Versie 0.1.0 — eerste versie

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
Die pipeline stopt zodra een stap mislukt of een gate niet gehaald wordt.

## Stappen

Er zijn twee soorten stappen:

- **Actie** — voert iets uit.
- **Gate** — toetst of er verder gegaan mag worden.

Elke stap heeft een uniek nummer, doorlopend over het hele scenario.

## Contract-based testing

De showcase maakt contract-based testing aantoonbaar met **één werkend voorbeeld per grenstype**.
De rolverdeling provider/consumer staat centraal: de provider bepaalt het contract, de consumer
past zich aan.

> Aan te vullen: definitie van "grens" en "grenstype", en of een grens een eigen entiteit is of
> een eigenschap van een stap. Dit staat ook als open punt in `usecases-showcase-website.md`.

## Scenario's

Tien scenario's, genummerd 00 t/m 09. Zoals getoond op de homepage:

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
| 08 | *nog aan te vullen* | |
| 09 | *nog aan te vullen* | |
