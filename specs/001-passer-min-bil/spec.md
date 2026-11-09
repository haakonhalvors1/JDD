# Spec 001: «Passer min bil» – klikkbar prototype (pilot: ekstralys)

| | |
| --- | --- |
| Status | **Godkjent 9.11.2026** («Godkjent, bare bygg») |
| Dato | 2026-11-09 |
| Kilder | Oppg. 3 (service safari, persona, fiskebein), Oppg. 4 (konsept, verdiforslag, tjenesteplan, K1–K9, WBS, sitemap), `docs/context/` |
| Styres av | `docs/governance/constitution.md` (G1–G9) |

## 1. Formål og verdiforslag

> For kunder med lite fagkunnskap som gjør sjeldne eller komplekse kjøp, gir «Passer min bil» en bekreftet og komplett pakke i én ordre, med forklaring, fagperson ved behov og garanti hvis rådet er feil. Kunden trenger ikke selv vite om bilen har Canbus.

Prototypen skal (1) la minst to testpersoner løse samme oppgave som i service safarien, slik at vi kan sammenligne med dagens nettbutikk, (2) teste formuleringen «Trengs for å fungere» mot «Ofte kjøpt sammen», og (3) vise JDD at fagkunnskapen kan ligge i godkjente regler.

## 2. Aktører

- **Kunde (Martin):** bilinteressert student, kjøper sjelden, vil være sikker, skeptisk til mersalg, foretrekker valg fremfor fritekst og vil kunne hoppe over veiledningen.
- **Fagperson (JDD):** legger inn og godkjenner kompatibilitetsregler og svarer i chat.
- **Kundesenter (JDD):** ser hva kundene spør om og hvor de stopper.
- **Testleder (gruppen):** setter opp testen, leser loggen og eksporterer CSV.

## 3. Sitemap og ruter

Forside → Passer min bil → Regnr eller modell → Tre spørsmål → Pakke med forklaring → Kasse → Oppfølging

| Rute | Skjerm | Krav |
| --- | --- | --- |
| `#/` | Forside (nettbutikk-ramme, inngang til «Passer min bil») | – |
| `#/ekstralys/toyota-rav4` | Landingsside per bilmodell med regnr-felt øverst (dit Google-søket leder) | K1 |
| `#/passer` | Start: regnr eller merke/modell/år | K1 |
| `#/passer/bil` | Bekreft bil, status og modelltabell. Ved Ukjent: «Har bilen LED-frontlys?» med bilde | K1, G2 |
| `#/passer/sporsmal` | Tre spørsmål med valgknapper, «Hva betyr dette?» og «Hopp over» | K5 |
| `#/passer/pakke` | Basis og anbefalt, «Trengs for å fungere», «Ofte kjøpt sammen», «Hvorfor dette?», «Ikke inkludert», garanti | K2, K3, K7 |
| `#/kurv` | Handlekurv | K2 |
| `#/kasse` | Kasse (simulert), leveringstid, garanti, samtykke til Min garasje | K7 |
| `#/bekreftelse` | Ordre, monteringsguide (stub), forhåndsvisning av «Fungerte det?»-e-post | K9 |
| (panel) | Fagperson-chat / «Ring meg tilbake», tilgjengelig fra bil-steget og utover | K6 |
| `#/fagperson` | Regler: vis, rediger, godkjenn. Datakvalitet | K4 |
| `#/innsikt` | Kundesenter-oversikt fra testloggen | K8 |
| `#/testlogg` | Logg per testperson, CSV-eksport | Test |
| `#/tilbakemelding` | Anonymt tilbakemeldingsskjema | Test |

## 4. Brukerhistorier og akseptansekriterier

Formatet er *Gitt / Når / Så*. ID-ene (AK-x.y) brukes i sjekklisten til slutt.

### K1 (Må) – Oppgi regnr eller bilmodell og se bare det som passer
*Som kunde vil jeg oppgi regnr eller bilmodell, slik at jeg bare ser det som passer bilen min.*

- **AK-1.1** Gitt landingssiden for Toyota RAV4, når siden lastes på 390 px, så er regnr-feltet synlig uten å scrolle.
- **AK-1.2** Når jeg taster testskiltet for RAV4 (se §7) med eller uten mellomrom, små eller store bokstaver, så vises «Toyota RAV4 2022 – stemmer det?» med «Ja» og «Nei, velg en annen bil».
- **AK-1.3** Når bilen er bekreftet og har en godkjent regel, så viser modelltabellen frontlys (LED/halogen) og Canbus (ja/nei/CAN FD) med status **Bekreftet** og kilden.
- **AK-1.4** Jeg kan i stedet velge merke → modell → år (nedtrekkslister med labels) og får samme resultat som med regnr for samme bil.
- **AK-1.5** Et regnr uten treff gir en vennlig melding og tilbyr merke/modell/år eller fagperson. Ingen feilside.
- **AK-1.6** Pakkesiden viser bare produkter som passer bilen. For RAV4 vises aldri standard kabelsett som en del av pakken.
- **AK-1.7** «Husk bilen min i Min garasje» er ikke forhåndsavkrysset. Uten avkrysning skrives ikke regnr til localStorage (kan verifiseres i DevTools).

### K2 (Må) – Pakken har alt som trengs for å fungere
*Som kunde vil jeg at pakken har alt som trengs for å fungere, slik at jeg slipper en ny tur.*

- **AK-2.1** For RAV4 2022 (LED + CAN FD) inneholder både basis og anbefalt: lys, brakett og **Canbus-relé for CAN FD**, og ikke kabelsett.
- **AK-2.2** For Volvo XC70 2012 (halogen, uten Canbus) inneholder pakken lys, brakett og **standard kabelsett**, og ikke relé.
- **AK-2.3** For en ukjent bil der kunden svarer «Ja, LED-frontlys» inneholder pakken **universalrelé (CAN/CAN FD)** med status Regelutledet og merknaden «Fagperson kan bekrefte et rimeligere relé for din bil». Svarer kunden «Nei, halogen», får pakken kabelsett med status Regelutledet.
- **AK-2.4** «Legg hele pakken i kurven» legger alle delene fra «Trengs for å fungere» i kurven med ett klikk. Ingenting fra «Ofte kjøpt sammen» legges til.
- **AK-2.5** Hvis kunden fjerner en nødvendig del fra kurven, vises en advarsel: «Uten [del] vil lysene ikke fungere på din bil.»
- **AK-2.6** Antall lamper (1/2/4) gir riktig antall lys, og reléet/kabelsettet er dimensjonert for det. Festemetoden gir riktig brakett.

### K3 (Må) – «Hvorfor dette?» og «Ikke inkludert»
*Som kunde vil jeg se hvorfor noe anbefales og hva som ikke er med, slik at jeg stoler på rådet.*

- **AK-3.1** Hver pakke og hver del i «Trengs for å fungere» har en «Hvorfor dette?»-knapp som åpner en forklaring i klartekst, regel-ID, kilde, godkjent av og dato.
- **AK-3.2** Hver pakke har «Ikke inkludert» som lister det som ikke er med (f.eks. verktøy, montering, ekstra bryter) og om det trengs eller ikke.
- **AK-3.3** For RAV4 forklarer «Hvorfor dette?» for reléet at bilen har LED-frontlys og Canbus (CAN FD), og at et vanlig kabelsett derfor ikke fungerer.
- **AK-3.4** Begge seksjonene kan åpnes og lukkes med tastatur (`button` + `aria-expanded`).

### K4 (Må) – Fagperson legger inn og godkjenner regler
*Som fagperson vil jeg legge inn og godkjenne kompatibilitetsregler, slik at kunnskapen blir i JDD.*

- **AK-4.1** `#/fagperson` viser alle regler i en tabell: ID, bil (merke/modell/årsintervall), frontlys, Canbus, påkrevd del, kilde, status (Godkjent/Utkast), godkjent av og dato.
- **AK-4.2** Jeg kan redigere en regel og legge til en ny. En redigert eller ny regel får status **Utkast – ikke godkjent**.
- **AK-4.3** «Godkjenn» setter status Godkjent med navn (fritt felt, f.eks. «Fagperson A») og dagens dato.
- **AK-4.4** En bil hvis regel er i utkast får **ikke** status Bekreftet i kundeflyten. Den behandles som Ukjent (med spørsmål eller fagperson) til regelen er godkjent.
- **AK-4.5** Endringer lagres i localStorage og overlever omlasting. «Tilbakestill eksempeldata» gjenoppretter `regler.json`.
- **AK-4.6** Seksjonen «Datakvalitet» flagger avviket 5500K (teknisk info) mot 5700K (beskrivelse) på samme lysprodukt, og kan merkes «løst».
- **AK-4.7** Siden er tydelig merket «Intern side – prototype».

### K5 (Bør) – Tre konkrete spørsmål i stedet for fritekst
*Som kunde vil jeg svare på noen få konkrete spørsmål i stedet for å skrive fritekst.*

- **AK-5.1** Tre spørsmål, ett per skjerm på mobil, med fremdrift «1 av 3»: **antall lamper** (1 / 2 / 4), **festemetode** (frontgrill/skiltbrakett / støtfanger / takstativ), **kontakttype** (bilens originale ekstralyskontakt / ingen kontakt, kobles fra fjernlyset / vet ikke).
- **AK-5.2** Svarene gis med valgknapper (radiogruppe med tastaturstøtte). Det finnes ingen fritekstfelt.
- **AK-5.3** Hvert spørsmål har «Hva betyr dette?» med en kort forklaring og illustrasjon. Fagord (Canbus, relé, referansetall) har en forklaring der de brukes.
- **AK-5.4** «Hopp over veiledningen» går rett til pakken med standardsvar (2 lamper, frontgrill, vet ikke). Standardsvarene vises på pakkesiden og kan endres. Bilens oppsett (relé/kabelsett) gjelder fortsatt.
- **AK-5.5** Spørsmålene er merket «forslag, avklares med JDD» i fagperson-visningen (ikke for kunden).

### K6 (Bør) – Fagperson som ser bilen og handlekurven
*Som kunde vil jeg nå en fagperson som ser bilen og handlekurven min.*

- **AK-6.1** «Spør en fagperson» er synlig på bil-, spørsmåls-, pakke- og kassesteget.
- **AK-6.2** Chatpanelet viser øverst en kontekstboks: bil (merke/modell/år, status) og kurv (varer og sum).
- **AK-6.3** Kunden velger blant 5 forhåndsskrevne spørsmål (montering, relé, garanti, levering, lovlighet) og får forhåndsskrevne svar fra «Fagperson (eksempel)». Det er ingen LLM og ingen fritekst.
- **AK-6.4** «Ring meg tilbake» viser et simulert skjema med et tidsvindu. Ingen telefonnummer lagres (feltet er deaktivert eller merket «simulert»).
- **AK-6.5** Svaret om montering sier hva som trengs for å montere selv og viser en deaktivert knapp «Bestill montering hos partnerverksted (kommer)» merket «idé, avklares med JDD».

### K7 (Bør*) – Passer-garanti
*Som kunde vil jeg ha fri retur hvis veilederen anbefalte feil.*

- **AK-7.1** Merket «Passer-garanti» vises på pakken og i kassen.
- **AK-7.2** En kort vilkårstekst kan åpnes og er merket «Forslag, avklares med JDD».
- **AK-7.3** Garantien gjelder både Bekreftet og Regelutledet. Ved Ukjent (ingen pakke anbefalt) vises den ikke.

\* Avklares med JDD: kostnaden ved en garanti må veies mot færre returer og henvendelser.

### K8 (Kan) – Kundesenter-oversikt
*Som kundesenter vil jeg se hvilke spørsmål og returårsaker som går igjen.*

- **AK-8.1** `#/innsikt` viser, fra testloggen: antall testpersoner, funnel (antall som nådde hvert steg), hvor de stoppet (siste hendelse før «Gi opp»/avslutning), hvilke fagperson-spørsmål som ble valgt (antall), andel som hoppet over veilederen og fordeling per variant.
- **AK-8.2** Siden er merket «Intern side – data fra brukertester, ikke ekte kunder».

### K9 (Kan) – Monteringsguide etter kjøpet
*Som kunde vil jeg få monteringsguide for bilen min etter kjøpet.*

- **AK-9.1** Bekreftelsessiden har en plassholder «Monteringsguide og koblingsskjema for Toyota RAV4 2022 (kommer i fase 2)» med et skjematisk SVG-koblingsskjema merket «illustrasjon».
- **AK-9.2** Bekreftelsessiden viser en forhåndsvisning av e-posten «Fungerte det?» som sendes etter en uke (simulert).

## 5. Ikke-funksjonelle krav

| ID | Krav | Akseptansekriterium |
| --- | --- | --- |
| NF1 | Mobil først (390 px) og responsiv | AK-NF1: ingen horisontal scroll på 390 px. Layout med to kolonner (basis/anbefalt side om side) fra ≥ 1024 px. |
| NF2 | WCAG 2.1 AA | AK-NF2: axe (Playwright) gir 0 alvorlige/kritiske avvik på hovedskjermene. Alt kan nås med tastatur og har synlig fokus. Status vises med tekst og ikon, ikke bare farge. |
| NF3 | Regnr kun med samtykke | = AK-1.7 |
| NF4 | Sporbarhet: regel og kilde vises | = AK-3.1 |
| NF5 | Regler for ekstralys | AK-NF5: pakkesiden har en kort merknad (avklart tekst, se `docs/context/domeneregler.md` pkt. 4) merket «forslag, avklares med JDD», og hvert lyssett viser referansetallet sitt. |
| NF6 | Tydelig prototype | AK-NF6: en stripe på hver side: «Prototype · eksempeldata · ingen ekte bestilling». Priser merket «eksempelpris». |
| NF7 | Ingen backend, ingen LLM | AK-NF7: ingen nettverkskall etter at appen er lastet (bortsett fra statiske filer). |

## 6. Hovedflyt og alternative flyter

### Hovedflyt (O1: «Kjøp ekstralys med alt som trengs til en Toyota RAV4 2022 (LED-frontlys)»)
1. Landingsside «Ekstralys til Toyota RAV4» (`landing`).
2. Taster regnr → «Toyota RAV4 2022 – stemmer det?» → Ja (`bil_bekreftet`). Modelltabellen: LED-frontlys, Canbus (CAN FD), **Bekreftet**.
3. Tre spørsmål: 2 lamper → frontgrill → vet ikke (`sporsmal_ferdig`).
4. Pakke: basis og anbefalt side om side (`pakke_vist`). «Passer din bil», samlet pris, Passer-garanti. «Trengs for å fungere»: lys, brakett, CAN FD-relé. «Ofte kjøpt sammen» for seg.
5. Åpner «Hvorfor dette?» (`hvorfor_apnet`) og «Ikke inkludert» (`ikke_inkludert_apnet`).
6. Legger hele pakken i kurven (`lagt_i_kurv`) → kasse (leveringstid, garanti, ingen skjulte tillegg) → «Bestill» (`bestilt`).
7. Bekreftelse: ordre, monteringsguide (stub), «Fungerte det?»-e-post (forhåndsvisning).
8. I testmodus: «Ferdig» → tilbakemeldingsskjema.

### A1 – Ukjent bil
Regnr gir en bil uten (godkjent) regel → status **Ukjent**, merket med «Vi har ikke bekreftet oppsettet for denne bilen ennå» → spørsmål «Har bilen LED-frontlys?» med to illustrasjoner (LED / halogen) og «Vet ikke».
- Ja → Regelutledet, universalrelé (AK-2.3) → spørsmål → pakke.
- Nei → Regelutledet, kabelsett → spørsmål → pakke.
- Vet ikke → ingen pakke. Tilbyr fagperson (chat/ring meg) og «Send bilde av frontlyset (kommer)». Status forblir Ukjent.

### A2 – Hopper over veilederen
Fra spørsmålssteget: «Hopp over, jeg vet hva jeg vil ha» → pakke med standardsvar (AK-5.4). Hendelsen `veileder_hoppet_over` logges.

### A3 – Går til fagperson
Fra hvilket som helst steg etter bil-steget: «Spør en fagperson» → panel med kontekst (AK-6.2) → velger spørsmål → svar. Lukkes og fortsetter der kunden var (`fagperson_apnet`, `fagperson_sporsmal`).

### A4 – Merke/modell/år i stedet for regnr
`#/passer` → «Jeg vet ikke regnr / vil velge modell» → nedtrekkslister → samme som trinn 2.

### A5 – Bilen stemmer ikke
«Nei, velg en annen bil» → tilbake til regnr/modell med regnr-feltet tømt.

## 7. Testdata (alt merket «eksempeldata»)

**Fiktive testskilt** (simulert oppslag, ingen ekte kjøretøydata):

| Regnr | Bil | Frontlys | Canbus | Regel | Forventet |
| --- | --- | --- | --- | --- | --- |
| PM 22022 | Toyota RAV4 2022 | LED | CAN FD | R-001 Godkjent | Bekreftet → CAN FD-relé |
| PM 12012 | Volvo XC70 2012 | Halogen | Nei | R-002 Godkjent | Bekreftet → kabelsett |
| PM 19019 | Kia Sportage 2019 | (LED) | (CAN) | R-004 **Utkast** | Ukjent → «Har bilen LED-frontlys?». Blir Bekreftet når fagperson godkjenner R-004 (demo av K4) |
| PM 17017 | Volkswagen Golf 2018 | LED | CAN | R-003 Godkjent | Bekreftet → CAN-relé |
| (annet) | – | – | – | – | Ikke funnet → modellvelger/fagperson |

**Produkter** (fiktive navn, eksempelpriser):
- Lyssett (par): *Nordlys 9″ LED* (basis, ca. 3 190 kr), *Nordlys 9″ LED Pro* (anbefalt, ca. 4 290 kr, lengre rekkevidde) og en enkeltlampe for «1 lampe». Ett produkt har 5500K/5700K-avviket.
- Braketter: frontgrill/skiltbrakett, støtfanger, takstativ.
- Kabelsett: standard kabelsett for 2 lamper og for 4 lamper.
- Canbus-reléer: *Relé CAN* (ca. 1 590 kr), *Relé CAN FD* (ca. 2 090 kr), *Universalrelé CAN/CAN FD* (ca. 2 590 kr).
- Ofte kjøpt sammen: bryterpanel, beskyttelsesdeksel, kabelstrips/koblingsboks.

**Forhåndsskrevne fagperson-svar:** montering, relé, garanti, levering og lovlighet.

## 8. Støtte for brukertester

- **Testmodus** `?test=1`: en stripe øverst viser oppgaven, «Ferdig» og «Gi opp», og en anonym ID (T1, T2 …) tildeles. Oppgaver: O1 (standard) og O2 «Finn ut hvorfor reléet er med i pakken, og spør en fagperson om du kan montere selv.» Velges med `?oppgave=1|2`.
- **Variant** `?variant=a|b`: overskriften over *samme* tilbehør er a = «Trengs for å fungere», b = «Ofte kjøpt sammen». (I variant b heter den egentlige «ofte kjøpt»-seksjonen «Andre kjøpte også». G5 holder fordi seksjonene fortsatt er visuelt adskilte.)
- **Logging** i localStorage med tidsstempel: `landing`, `bil_bekreftet`, `sporsmal_ferdig`, `veileder_hoppet_over`, `pakke_vist`, `hvorfor_apnet`, `ikke_inkludert_apnet`, `fagperson_apnet`, `fagperson_sporsmal`, `lagt_i_kurv`, `bestilt`, `oppgave_ferdig`, `oppgave_gitt_opp`. Per økt: testperson-ID, oppgave, variant, tid per oppgave og om veilederen ble hoppet over.
- **`#/testlogg`**: tabell per testperson, CSV-eksport (UTF-8 med BOM, semikolon som skilletegn for norsk Excel) og «Slett logg» med bekreftelse.
- **`#/tilbakemelding`**: trygghet på at pakken passet (1–5), noe unødvendig (ja/nei + hva), hjelp eller mersalg (1–5) og ett fritekstfelt. Ingen navn eller e-post. Lagres i loggen sammen med testperson-ID.
- Hendelsene speiler funnelen for gevinstmåling: konvertering (`pakke_vist` → `bestilt`), andel komplette ordrer (bestilt med alle «trengs»-deler) og bruk av fagperson.

## 9. Utenfor scope

- Ekte kjøretøyoppslag på regnr, ekte modelltabell, Multicase-API og ekte produktdata, priser og lager.
- Ekte betaling, ordre, e-post, chat eller telefon. Innlogging og brukerkontoer (Min garasje er bare localStorage).
- LLM eller fri chat. Opplasting av bilde av frontlyset (vises som «kommer»).
- Andre kategorier enn ekstralys (tilhenger, traktor, landbruk) og Bedrift-flyten (menyvalget finnes, men er ikke klikkbart).
- Monteringsguide/video og bestilling av montering (fase 2, kun stub).
- Håndheving av tallgrenser i regelverket for ekstralys.
- Flerspråklighet.

## 10. Antakelser som må avklares med JDD

1. Kjøretøyoppslag på regnr (kilde, kostnad, personvern) og om LED/Canbus kan hentes fra bildata.
2. Modelltabell for reléer: finnes den, hvem eier den (JDD eller produsent), og kan den bygges fra nøkkelpersonens kunnskap?
3. Multicase-API: kan pakker, regler og «trengs/ofte kjøpt» uttrykkes i nettbutikken?
4. Passer-garanti: vilkår, kostnad og hvem som betaler returen.
5. Svaralternativene i de tre spørsmålene og hva de styrer.
6. Teksten om regler for ekstralys (Statens vegvesen).
7. Partnerverksted for montering.

## 11. Kravsporing

| Krav | Implementert i | Automatisk test |
| --- | --- | --- |
| K1 | `components/BilSkjema.tsx` (regnr, modellvelger), `pages/Landing.tsx`, `pages/Bil.tsx`, `logic/regnr.ts`, `logic/anbefal.ts` (`finnRegel`) | `anbefal.test.ts` (oppslag, årsintervall), `scripts/screenshots.mjs` (AK-1.1–1.7) |
| K2 | `logic/anbefal.ts` (`byggPakke`), `pages/Pakke.tsx`, `pages/Kasse.tsx` (`KurvSide`, advarsel) | `anbefal.test.ts` (alle tre scenarioer, G3 for 54 kombinasjoner), AK-2.1–2.5 i skriptet |
| K3 | `logic/anbefal.ts` (`hvorfor`, `ikkeInkludert`), `pages/Pakke.tsx` (`Utvid`) | `anbefal.test.ts` (K3), AK-3.3 i skriptet |
| K4 | `pages/FagpersonAdmin.tsx`, `state/AppState.tsx` (`lagreRegler`), `data/regler.json` | `anbefal.test.ts` (AK-4.4 begge veier), AK-4.2–4.6 i skriptet |
| K5 | `pages/Sporsmal.tsx`, `data/sporsmal.json`, `components/Felles.tsx` (`Fagord`) | AK-5.4 i skriptet, «hopp over» i `anbefal.test.ts` |
| K6 | `components/FagpersonPanel.tsx`, `data/fagperson-svar.json` | AK-6.2 i skriptet |
| K7 | `components/Felles.tsx` (`Garantimerke`, `Garantivilkar`), `pages/Pakke.tsx`, `pages/Kasse.tsx` | Skjermbilder 08, 14 |
| K8 | `pages/Testsider.tsx` (`Innsikt`), `logic/logg.ts` | `logg.test.ts`, skjermbilde 18 |
| K9 | `pages/Kasse.tsx` (`BekreftelseSide`), `components/Illustrasjoner.tsx` (`Koblingsskjema`) | Skjermbilde 15 |
| Test | `components/Layout.tsx` (`TestStripe`), `state/AppState.tsx` (variant), `logic/logg.ts`, `pages/Testsider.tsx` | `logg.test.ts`, logg-sjekker i skriptet |

Sjekklisten med ✔/✘ per akseptansekriterium ligger i `docs/sjekkliste.md`.
