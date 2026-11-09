# «Passer min bil» – klikkbar prototype

**IS-219 Digitalisering og tjenestedesign, gruppe 1, UiA høst 2026 · Oppdragsgiver: JDD Utstyr**

🔗 **Prototype:** https://haakonhalvors1.github.io/JDD/
(Publiseres av GitHub Actions ved push til `main`. Krever at *Settings → Pages → Source* er satt til **GitHub Actions**.)

> Dette er en prototype for brukertester og visning for JDD, ikke en nettbutikk. Alle kjøretøy, regler, varenavn og priser er **eksempeldata**. Ingen bestilling, betaling, chat eller e-post er ekte.

## Formål

Kunden klarer ikke å oversette «min bil» til riktig teknisk oppsett. Service safarien (12.10.2026) viste at et «komplett» ekstralyssett ikke er komplett for nyere biler med Canbus/LED-frontlys. Da trengs et Canbus-relé som ikke er med, og kunden må selv vite hva bilen har.

«Passer min bil» (pilot: ekstralys) gir en **bekreftet og komplett pakke i én ordre**, med forklaring, fagperson ved behov og garanti hvis rådet er feil. Kunden trenger ikke selv vite om bilen har Canbus.

Prototypen skal:
1. la testpersoner løse samme oppgave som i service safarien, slik at vi kan sammenligne med dagens nettbutikk,
2. teste formuleringen «Trengs for å fungere» mot «Ofte kjøpt sammen»,
3. vise JDD at fagkunnskapen kan ligge i godkjente regler (fagperson-siden).

## Backend (Supabase)

Prototypen kan bruke en felles database, slik at **testloggen fra alle enheter samles på ett sted** og **fagpersonens regelendringer vises for alle**. Uten oppsett virker alt som før med lagring i nettleseren (bunnteksten viser hvilken lagring som er i bruk).

Backenden lagrer bare anonyme testøkter (T1, T2 …), logghendelser, tilbakemeldinger og regler. Den lagrer **aldri** regnr, navn, e-post eller telefon. Selve anbefalingen regnes fortsatt ut i nettleseren.

**Oppsett (én gang):**
1. Opprett et Supabase-prosjekt (gratis, region EU, f.eks. Stockholm).
2. Åpne *SQL Editor* i prosjektet, lim inn hele [`supabase/migrations/20261109000000_passer_min_bil.sql`](supabase/migrations/20261109000000_passer_min_bil.sql) og trykk *Run*. Da opprettes tabeller, tilgangsregler (RLS) og eksempelregler.
3. Hent **Project URL** og **publishable key** (eller «anon public») under *Project Settings → API*. Bruk **aldri** `service_role`- eller secret-nøkkelen.
4. I GitHub: *Settings → Secrets and variables → Actions → Variables* → legg inn `VITE_SUPABASE_URL` og `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. Kjør workflowen på nytt (*Actions → Deploy til GitHub Pages → Run workflow*).

Lokalt: kopier `.env.example` til `.env.local` og fyll inn de samme verdiene.

**Tilgang:** den publiserbare nøkkelen kan lese, legge til logghendelser og tilbakemeldinger, og lese og endre regler. Den kan ikke slette eller endre logg; det gjøres i Supabase-dashbordet (*Table Editor*). Fagperson-siden har ingen innlogging i prototypen, så alle med lenken kan endre regler. «Tilbakestill eksempeldata» setter dem tilbake.

Kompatibilitet avgjøres **deterministisk** av en regeltabell (`src/data/regler.json`) via den rene funksjonen `src/logic/anbefal.ts`. Prototypen har ingen språkmodell. Hvert resultat er **Bekreftet**, **Regelutledet** eller **Ukjent**.

## Testlenker

Mål: minst to brukertester før visningen for JDD (målet fra WBS 4.2 er fem). Åpne hver testperson i en ny fane, eller bruk knappene på `#/testlogg` for å starte en ren økt.

| Hva | Lenke |
| --- | --- |
| Oppgave 1, variant A («Trengs for å fungere») | https://haakonhalvors1.github.io/JDD/?test=1&oppgave=1&variant=a#/ekstralys/toyota-rav4 |
| Oppgave 1, variant B («Ofte kjøpt sammen») | https://haakonhalvors1.github.io/JDD/?test=1&oppgave=1&variant=b#/ekstralys/toyota-rav4 |
| Oppgave 2, variant A | https://haakonhalvors1.github.io/JDD/?test=1&oppgave=2&variant=a#/ekstralys/toyota-rav4 |
| Oppgave 2, variant B | https://haakonhalvors1.github.io/JDD/?test=1&oppgave=2&variant=b#/ekstralys/toyota-rav4 |
| Testlogg + CSV-eksport | https://haakonhalvors1.github.io/JDD/#/testlogg |
| Kundesenter-innsikt (K8) | https://haakonhalvors1.github.io/JDD/#/innsikt |
| Fagperson: regler og datakvalitet (K4) | https://haakonhalvors1.github.io/JDD/#/fagperson |

**Oppgave 1** (samme som i service safarien): *Kjøp ekstralys med alt som trengs til en Toyota RAV4 2022 (LED-frontlys).*
**Oppgave 2:** *Finn ut hvorfor reléet er med i pakken, og spør en fagperson om du kan montere selv.*

**Fiktive testskilt:** `PM 22022` Toyota RAV4 2022 (LED + CAN FD, Bekreftet) · `PM 12012` Volvo XC70 2012 (halogen, Bekreftet) · `PM 19019` Kia Sportage 2019 (regel i utkast → Ukjent) · `PM 17017` VW Golf 2018 (LED + CAN). Andre skilt gir «ikke funnet».

**Logging:** Hendelsene samles i den felles databasen når backend er satt opp (se over), ellers bare i nettleseren. `landing → bil_bekreftet → sporsmal_ferdig → pakke_vist → hvorfor_apnet → ikke_inkludert_apnet → fagperson_apnet → lagt_i_kurv → bestilt`, med tidsstempel. I tillegg logges `veileder_hoppet_over`, `led_besvart`, `fagperson_sporsmal`, Ferdig/Gi opp, variant, tid per oppgave og tilbakemeldingen. Alt er anonymt (T1, T2 …). **Uten backend** lagres loggen bare i nettleseren, og da må CSV eksporteres fra samme nettleser som testen ble kjørt i. CSV-filen bruker semikolon og UTF-8 og åpnes riktig i norsk Excel.

## Skjermoversikt

| Skjerm | Rute | Krav | Mobil | Desktop |
| --- | --- | --- | --- | --- |
| Forside | `#/` | – | [01](docs/screenshots/mobil-01-forside.png) | [01](docs/screenshots/desktop-01-forside.png) |
| Landingsside RAV4 | `#/ekstralys/toyota-rav4` | K1 | [02](docs/screenshots/mobil-02-landingsside-rav4.png) | [02](docs/screenshots/desktop-02-landingsside-rav4.png) |
| Bekreft bil | `#/passer/bil` | K1 | [03](docs/screenshots/mobil-03-bekreft-bil.png) | [03](docs/screenshots/desktop-03-bekreft-bil.png) |
| Modelltabell (Bekreftet) | `#/passer/bil` | K1 | [04](docs/screenshots/mobil-04-modelltabell.png) | [04](docs/screenshots/desktop-04-modelltabell.png) |
| Tre spørsmål | `#/passer/sporsmal` | K5 | [05](docs/screenshots/mobil-05-sporsmal-1.png) · [06](docs/screenshots/mobil-06-sporsmal-forklaring.png) · [07](docs/screenshots/mobil-07-sporsmal-3.png) | [05](docs/screenshots/desktop-05-sporsmal-1.png) |
| Pakke | `#/passer/pakke` | K2, K3, K7 | [08](docs/screenshots/mobil-08-pakke.png) · [09](docs/screenshots/mobil-09-pakke-hvorfor-ikke-inkludert.png) | [08](docs/screenshots/desktop-08-pakke.png) · [09](docs/screenshots/desktop-09-pakke-hvorfor-ikke-inkludert.png) |
| Fagperson-chat / ring meg | panel | K6 | [10](docs/screenshots/mobil-10-fagperson-chat.png) · [11](docs/screenshots/mobil-11-fagperson-ring-meg.png) | [10](docs/screenshots/desktop-10-fagperson-chat.png) |
| Kurv (+ advarsel) | `#/kurv` | K2 | [12](docs/screenshots/mobil-12-kurv.png) · [13](docs/screenshots/mobil-13-kurv-advarsel.png) | [13](docs/screenshots/desktop-13-kurv-advarsel.png) |
| Kasse | `#/kasse` | K7 | [14](docs/screenshots/mobil-14-kasse.png) | [14](docs/screenshots/desktop-14-kasse.png) |
| Bekreftelse og oppfølging | `#/bekreftelse` | K9 | [15](docs/screenshots/mobil-15-bekreftelse.png) | [15](docs/screenshots/desktop-15-bekreftelse.png) |
| Tilbakemelding | `#/tilbakemelding` | test | [16](docs/screenshots/mobil-16-tilbakemelding.png) | [16](docs/screenshots/desktop-16-tilbakemelding.png) |
| Testlogg | `#/testlogg` | test | [17](docs/screenshots/mobil-17-testlogg.png) | [17](docs/screenshots/desktop-17-testlogg.png) |
| Innsikt | `#/innsikt` | K8 | [18](docs/screenshots/mobil-18-innsikt.png) | [18](docs/screenshots/desktop-18-innsikt.png) |
| Ukjent bil → «Har bilen LED-frontlys?» | `#/passer/bil` | G2, A1 | [19](docs/screenshots/mobil-19-ukjent-led-sporsmal.png) · [20](docs/screenshots/mobil-20-ukjent-vet-ikke.png) · [21](docs/screenshots/mobil-21-regelutledet.png) | [19](docs/screenshots/desktop-19-ukjent-led-sporsmal.png) |
| Pakke, regelutledet + hoppet over | `#/passer/pakke` | A1, A2 | [22](docs/screenshots/mobil-22-pakke-regelutledet-hoppet-over.png) | [22](docs/screenshots/desktop-22-pakke-regelutledet-hoppet-over.png) |
| Modellvelger / XC70 med kabelsett | `#/passer?modell=1` | K1, A4 | [23](docs/screenshots/mobil-23-modellvelger.png) · [24](docs/screenshots/mobil-24-pakke-xc70-kabelsett.png) | [24](docs/screenshots/desktop-24-pakke-xc70-kabelsett.png) |
| Variant B | `#/passer/pakke` | test | [25](docs/screenshots/mobil-25-pakke-variant-b-oppgave-2.png) | [25](docs/screenshots/desktop-25-pakke-variant-b-oppgave-2.png) |
| Fagperson: regler, rediger, datakvalitet | `#/fagperson` | K4 | [26](docs/screenshots/mobil-26-fagperson-regler.png) · [27](docs/screenshots/mobil-27-fagperson-rediger.png) · [28](docs/screenshots/mobil-28-fagperson-datakvalitet.png) | [26](docs/screenshots/desktop-26-fagperson-regler.png) |

Diagrammer (Mermaid): [sitemap](docs/sitemap.mmd) · [brukerflyt](docs/user-flow.mmd) · [sekvens regnr → pakke](docs/sekvens-regnr-til-pakke.mmd)

## Kjøre lokalt

Krever Node 20+ (testet med Node 22).

```bash
npm install
```

```bash
npm run dev
```

Åpne adressen Vite skriver ut, f.eks. http://localhost:5173/JDD/ (husk `/JDD/`).

```bash
npm test
```

Skjermbilder og akseptsjekker (Playwright + axe): bygg, start forhåndsvisning og kjør skriptet i en annen terminal.

```bash
npm run build && npx vite preview --port 4173
```

```bash
npx playwright install chromium
```

```bash
npm run screenshots
```

Skriptet lagrer bildene i `docs/screenshots/` og skriver ✔/✘ per akseptansekriterium (sist kjørt: 62/62 OK, 0 alvorlige axe-avvik).

Backend-koden testes mot en falsk Supabase i nettleseren (to «enheter» som deler database). Start forhåndsvisningen i én terminal:

```bash
VITE_SUPABASE_URL=http://supabase.test VITE_SUPABASE_PUBLISHABLE_KEY=test npx vite build --outDir dist-backendtest && npx vite preview --outDir dist-backendtest --port 4174
```

Kjør testen i en annen terminal:

```bash
node scripts/backend-test.mjs
```

(Sist kjørt: 13/13 OK.)

## Struktur

```
supabase/        SQL-migrasjon: tabeller, RLS og eksempelregler
src/data/        eksempeldata: kjøretøy, regler, produkter, spørsmål, fagperson-svar
src/logic/       anbefal.ts (regelmotor, ren funksjon), backend.ts (Supabase), regnr.ts, logg.ts + Vitest-tester
src/state/       app-tilstand (bil, svar, kurv, regler, testinnstillinger)
src/components/  layout, fagperson-panel, felles komponenter, SVG-illustrasjoner
src/pages/       én fil per skjerm
scripts/         screenshots.mjs (Playwright + axe), backend-test.mjs (falsk Supabase)
docs/            input, context, governance, diagrammer, skjermbilder, sjekkliste
specs/001-…      spec.md, plan.md, tasks.md
```

## Dokumentasjon

- [Spesifikasjon (K1–K9, akseptansekriterier)](specs/001-passer-min-bil/spec.md) · [plan](specs/001-passer-min-bil/plan.md) · [oppgaver](specs/001-passer-min-bil/tasks.md)
- [Grunnlov (G1–G9)](docs/governance/constitution.md) · [CLAUDE.md](CLAUDE.md)
- [Brukere og oppgaver](docs/context/brukere-og-oppgaver.md) · [Ny brukerreise](docs/context/ny-brukerreise.md) · [Domeneregler og avklaringer](docs/context/domeneregler.md)
- [**Sjekkliste K1–K9 og antakelser som må avklares med JDD**](docs/sjekkliste.md)
