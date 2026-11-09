# Sjekkliste: K1–K9 og akseptansekriterier

Verifisert 9.11.2026 mot `specs/001-passer-min-bil/spec.md`.
Slik ble det verifisert:
- **Auto (V)**: Vitest, `npm test`, 28 tester.
- **Auto (P)**: Playwright-skriptet `scripts/screenshots.mjs`, som ga 62/62 sjekker OK på mobil og desktop.
- **Skjerm**: skjermbilde i `docs/screenshots/` (mobil-/desktop-NN-navn.png), gjennomgått manuelt.
- **Manuell**: engangskjøring i Playwright under utviklingen.

✔ = oppfylt · ◐ = delvis · ✘ = ikke oppfylt

## Krav

| Krav | Prioritet | Status | Kommentar |
| --- | --- | --- | --- |
| K1 Regnr eller merke/modell/år, se bare det som passer | Må | ✔ | Fire fiktive testskilt + modellvelger |
| K2 Pakken har alt som trengs, riktig relé automatisk | Må | ✔ | CAN FD-relé (RAV4), kabelsett (XC70), universalrelé (ukjent + LED) |
| K3 «Hvorfor dette?» og «Ikke inkludert» på hver anbefaling | Må | ✔ | Per del og per pakke, med regel-ID og kilde |
| K4 Fagperson-side med regler: vis, rediger, godkjenn | Må | ✔ | localStorage. Utkast gir ikke Bekreftet. Datakvalitet 5500K/5700K |
| K5 Tre spørsmål med valgknapper | Bør | ✔ | Lamper, feste, kontakt. «Hva betyr dette?». Kan hoppes over |
| K6 Fagperson-chat med kontekst | Bør | ✔ | Bil + kurv øverst, 5 forhåndsskrevne svar, «Ring meg tilbake» |
| K7 Passer-garanti på pakke og i kasse | Bør | ✔ | Vilkår merket «Forslag, avklares med JDD» |
| K8 Kundesenter-oversikt fra testloggen | Kan | ✔ | Funnel, stoppunkter, fagperson-spørsmål, variant A/B |
| K9 Monteringsguide som plassholder | Kan | ✔ | SVG-koblingsskjema (illustrasjon) + «Fungerte det?»-e-post |

## Akseptansekriterier

| AK | Status | Verifisert |
| --- | --- | --- |
| 1.1 Regnr-felt synlig uten scroll på 390 px | ✔ | Auto (P) |
| 1.2 «Toyota RAV4 2022 – stemmer det?», tåler mellomrom og små bokstaver | ✔ | Auto (P), Auto (V) |
| 1.3 Modelltabell med frontlys, Canbus, Bekreftet og kilde | ✔ | Auto (P), skjerm 04 |
| 1.4 Merke/modell/år gir samme resultat | ✔ | Auto (P) (XC70 via modellvelger) |
| 1.5 Regnr uten treff gir vennlig melding + alternativer | ✔ | Manuell |
| 1.6 Bare det som passer (RAV4 uten kabelsett) | ✔ | Auto (P), Auto (V) |
| 1.7 Samtykke ikke forhåndsavkrysset, regnr ikke i localStorage uten samtykke | ✔ | Auto (P) |
| 2.1 RAV4: lys + brakett + CAN FD-relé, ikke kabelsett | ✔ | Auto (V), Auto (P) |
| 2.2 XC70: kabelsett, ikke relé | ✔ | Auto (V), Auto (P) |
| 2.3 Ukjent + «Ja, LED» → universalrelé, Regelutledet + merknad; «Nei» → kabelsett | ✔ | Auto (V), Auto (P) |
| 2.4 «Legg hele pakken i kurven» uten «ofte kjøpt» | ✔ | Auto (P) (kurv, skjerm 12) |
| 2.5 Advarsel når nødvendig del fjernes | ✔ | Auto (P) |
| 2.6 1/2/4 lamper og festemetode styrer pakken | ✔ | Auto (V) |
| 3.1 «Hvorfor dette?» med regel-ID, kilde, godkjent av og dato | ✔ | Auto (V), skjerm 09 |
| 3.2 «Ikke inkludert» per pakke | ✔ | Auto (V), skjerm 09 |
| 3.3 Relé-forklaring nevner LED/Canbus (CAN FD) | ✔ | Auto (V), Auto (P) |
| 3.4 Kan åpnes med tastatur (`button` + `aria-expanded`) | ✔ | Kode + axe |
| 4.1 Regeltabell med alle felt | ✔ | Skjerm 26 |
| 4.2 Redigert/ny regel blir utkast | ✔ | Auto (P) |
| 4.3 Godkjenn med navn og dato | ✔ | Auto (P) |
| 4.4 Utkast gir ikke Bekreftet (begge veier) | ✔ | Auto (V), Auto (P) |
| 4.5 Lagres i localStorage, tilbakestill | ✔ | Auto (P) |
| 4.6 Datakvalitet: 5500K mot 5700K, merk som løst | ✔ | Auto (P), skjerm 28 |
| 4.7 Merket «Intern side – prototype» | ✔ | Skjerm 26 |
| 5.1 Tre spørsmål, ett per skjerm, «1 av 3» | ✔ | Skjerm 05/07 |
| 5.2 Valgknapper, ingen fritekst | ✔ | Kode (native radioknapper) |
| 5.3 «Hva betyr dette?» + fagord forklart | ✔ | Skjerm 06, 08 (Referansetall, Canbus) |
| 5.4 Hopp over → standardsvar vises og kan endres | ✔ | Auto (P), Auto (V) |
| 5.5 Spørsmål merket «forslag» på fagperson-siden | ✔ | Skjerm 26/28 |
| 6.1 «Spør en fagperson» på bil, spørsmål, pakke og kasse | ✔ | Skjermbilder |
| 6.2 Kontekstboks med bil og kurv | ✔ | Auto (P), skjerm 10 |
| 6.3 Fem forhåndsskrevne spørsmål, ingen LLM | ✔ | Skjerm 10 |
| 6.4 «Ring meg tilbake» simulert, uten lagret nummer | ✔ | Skjerm 11 |
| 6.5 Montering-svar + deaktivert «Bestill montering (kommer)» | ✔ | Skjerm 10 |
| 7.1 Garanti på pakke og i kasse | ✔ | Skjerm 08, 14 |
| 7.2 Vilkår merket «Forslag, avklares med JDD» | ✔ | Skjerm 14 |
| 7.3 Ikke vist ved Ukjent | ✔ | Skjerm 19/20 (ingen pakke ved Ukjent) |
| 8.1 Innsikt: funnel, stopp, spørsmål, hopp over, variant | ✔ | Skjerm 18 |
| 8.2 Merket «ikke ekte kunder» | ✔ | Skjerm 18 |
| 9.1 Monteringsguide-plassholder med koblingsskjema | ✔ | Skjerm 15 |
| 9.2 «Fungerte det?»-forhåndsvisning | ✔ | Skjerm 15 |
| NF1 Ingen horisontal scroll på 390 px, to kolonner fra 1024 px | ✔ | Auto (P), skjerm desktop-08 |
| NF2 WCAG 2.1 AA | ◐ | axe: 0 alvorlige/kritiske avvik på 26 skjermer × 2 visninger, og regnr → bekreft bil fungerer med tastatur. **Ikke testet med skjermleser (NVDA/VoiceOver) eller av en person med tastatur gjennom hele flyten.** |
| NF5 Merknad om regler for ekstralys + referansetall per sett | ✔ | Skjerm 08 |
| NF6 Prototype-stripe på hver side, «eksempelpris» | ✔ | Alle skjermbilder |
| NF7 Ingen nettverkskall etter lasting | ✔ | Manuell (0 eksterne kall), ingen `fetch` i koden |
| Testmodus: oppgavestripe, Ferdig/Gi opp | ✔ | Auto (P), Manuell (Gi opp) |
| Variant a/b | ✔ | Auto (P) |
| Logging av alle funnel-hendelser med tidsstempel | ✔ | Auto (P), Auto (V) |
| Testlogg per testperson + CSV | ✔ | Auto (V) (CSV-format), skjerm 17 |
| Tilbakemeldingsside uten navn/e-post | ✔ | Skjerm 16 |
| Kjørende på GitHub Pages | ✘ | Workflow er klar, men Pages må slås på i repoinnstillingene (se README) |

## Antakelser som må avklares med JDD

1. **Kjøretøyoppslag på regnr.** Hvilken kilde (f.eks. Statens vegvesens kjøretøyregister via en leverandør), hva koster det, og hva sier personvernet? Kan oppslaget gi LED/Canbus direkte, eller bare merke/modell/år?
2. **Modelltabell for reléer.** Finnes den hos JDD eller hos produsentene? Hvem eier og oppdaterer den? Kan den bygges fra nøkkelpersonens kunnskap (kunnskapsintervjuer, WBS 1.1) før pensjonering?
3. **Multicase-API.** Kan nettbutikken uttrykke regler, pakker og skillet «trengs / ofte kjøpt», og kan en regelmotor hente produkt- og lagerdata?
4. **Passer-garanti.** Vilkår, varighet, hvem som betaler returfrakten, og kostnad veid mot færre returer og henvendelser.
5. **De tre spørsmålene.** Riktige svaralternativer for antall lamper, festemetode og kontakttype, og hva de faktisk styrer i JDDs sortiment.
6. **Universalrelé ved ukjent bil.** Er det faglig forsvarlig å velge et relé som støtter både CAN og CAN FD når bilen er ukjent, eller skal fagperson alltid inn?
7. **Original ekstralyskontakt.** Prototypen antar at bilen fortsatt trenger Canbus-relé selv med original kontakt, og at plug-and-play-kabel bare gjelder biler uten Canbus.
8. **Regler for ekstralys.** Teksten om E-godkjenning, kobling til fjernlys og grenser for antall og referansetall må sjekkes mot Statens vegvesen.
9. **Partnerverksted for montering** (vist som «kommer»).
10. **Leveringstid og frakt** (2–4 virkedager, frakt inkludert) er eksempler.
