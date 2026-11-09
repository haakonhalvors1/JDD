# Grunnlov: «Passer min bil» (prototype)

Gjelder all spesifisering, kode og innhold i dette repoet. Ved konflikt vinner denne filen over spec, plan og oppgaver.
Endringer skal godkjennes av gruppen og føres i endringsloggen nederst.

## 1. Formål

En klikkbar, mobil-først prototype av «Passer min bil» (pilot: ekstralys) for JDD Utstyr, til brukertester (minst to, mål fem) og visning for JDD.
Prototypen er **ikke** et produksjonssystem: ingen ekte bestilling, ingen ekte kjøretøyoppslag og ingen persondata ut av nettleseren. En enkel felles backend (Supabase) lagrer bare anonym testlogg og kompatibilitetsregler (se G10).

## 2. Sannhetskilder

1. `docs/input/` – Oppgave 3 (undersøkelse og analyse) og Oppgave 4 (idé, konsept, krav K1–K9, WBS, sitemap).
2. `docs/context/` – avklaringer gjort med gruppen (datert).
3. `specs/001-passer-min-bil/spec.md` – godkjent spesifikasjon.

Hvis kode og kilder er uenige, er det koden som er feil. Uklarheter avgjøres ikke stille: de føres i `docs/context/domeneregler.md` og avklares med gruppen.

## 3. Ufravikelige domeneregler

| # | Regel |
| --- | --- |
| G1 | **Deterministisk kompatibilitet.** Kompatibilitet avgjøres av regeltabellen (`src/data/regler.json`, eller tabellen `regler` i backend når den er satt opp) via den rene funksjonen `src/logic/anbefal.ts`. Ingen språkmodell og ingen tilfeldighet. Funksjonen gjør ingen nettverkskall. Samme input gir alltid samme output. |
| G2 | **Tre statuser.** Hvert resultat er **Bekreftet** (godkjent regel i modelltabellen), **Regelutledet** (fra kundens svar) eller **Ukjent**. Ukjent vises aldri som bekreftet. Da tilbys spørsmål med bilde eller fagperson. Bare *godkjente* regler kan gi Bekreftet. |
| G3 | **Komplett pakke.** En anbefalt pakke har alltid alt som trengs for å fungere: lys, brakett og enten kabelsett eller Canbus-relé (aldri begge, aldri ingen). Reléet legges inn automatisk. |
| G4 | **Aldri dyrere enn nødvendig.** Basis vises alltid. «Anbefalt» forklarer hva man får ekstra og hva det koster mer. Ved ukjent relé brukes det billigste *sikre* valget, og det forklares. |
| G5 | **«Trengs for å fungere» og «Ofte kjøpt sammen» blandes aldri visuelt.** De ligger i separate seksjoner med ulik stil, og «ofte kjøpt» er aldri forhåndsvalgt eller med i pakkeprisen. |
| G6 | **Sporbarhet.** Hver anbefaling viser regelen (ID), kilden, hvem som godkjente den og når, samt «Hvorfor dette?» og «Ikke inkludert». |
| G7 | **Regler for ekstralys.** Det vises en kort merknad om reglene (Statens vegvesen), merket «forslag, avklares med JDD». |
| G8 | **Personvern.** Regnr lagres bare med eksplisitt samtykke («Husk bilen min i Min garasje», ikke forhåndsavkrysset). Testlogg og tilbakemeldinger er anonyme (T1, T2 …). Ingen navn eller e-post samles inn. |
| G9 | **Ærlig prototype.** Det skal alltid være synlig at dette er en prototype. Data merkes «eksempeldata» og priser «eksempelpris». Fiktive varenavn, ingen JDD-logo og ingen ekte JDD-varenumre. Garantivilkår merkes «forslag, avklares med JDD». |
| G10 | **Backend bare for lagring.** Supabase lagrer anonyme testøkter, logghendelser, tilbakemeldinger og regler. Backenden tar ingen beslutninger om kompatibilitet (G1 gjelder fortsatt i nettleseren), og den lagrer aldri regnr, navn, e-post eller telefon. Uten backend-konfigurasjon faller appen tilbake til localStorage. Tilgangen styres med RLS: den publiserbare nøkkelen kan lese, legge til logg og endre regler, men ikke slette eller endre logg. |

## 4. Kvalitetsprinsipper

- **Mobil først:** designet tas fra 390 px bredde og er responsivt til desktop.
- **WCAG 2.1 AA:** semantisk HTML, synlig fokus, kontrast ≥ 4,5:1, alt fungerer med tastatur, skjemaer har labels, status vises aldri bare med farge, og `lang="nb"`.
- **Norsk bokmål** i alt brukerrettet innhold, vennlig og saklig tone. Fagord forklares der de brukes.
- **Krav kan spores:** hver komponent eller funksjon som oppfyller et krav har en kommentar `// K<n>` eller `// G<n>`, og spec-en lister hvor hvert krav er implementert.
- **Testet regelmotor:** `anbefal.ts` har Vitest-tester for de tre bilscenarioene (positive, negative og ukjente tilfeller). Testene skal være grønne før hver commit.
- **Små steg:** én oppgave fra `tasks.md` om gangen, verifisert mot akseptansekriteriene før neste.

## 5. Brukertestene

Testmodus, varianter og logging tjener funnelen som senere foreslås som gevinstmåling (konvertering, andel komplette ordrer, bruk av fagperson). Logghendelsene endrer ikke navn uten at spec-en oppdateres.

## Endringslogg

| Dato | Endring |
| --- | --- |
| 2026-11-09 | Første versjon. |
| 2026-11-09 | Gruppen ba om backend: G10 lagt til, formålet oppdatert. Testlogg og regler deles via Supabase. |
