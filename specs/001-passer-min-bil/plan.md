# Plan 001: «Passer min bil»

Godkjent av gruppen 9.11.2026 («Godkjent, bare bygg»). Bygger på `spec.md` og grunnloven (G1–G9).

## Arkitektur

```
src/
  data/                 # eksempeldata (JSON), merket «eksempeldata»
    kjoretoy.json       # testskilt → bil
    regler.json         # modelltabell: kompatibilitetsregler (K4, G1)
    produkter.json      # lys, braketter, kabelsett, reléer, ofte kjøpt
    sporsmal.json       # tre spørsmål (K5)
    fagperson-svar.json # forhåndsskrevne svar (K6)
  logic/
    anbefal.ts          # REN funksjon: (bil, regler, svar, produkter) → resultat (G1–G6)
    anbefal.test.ts     # Vitest: RAV4, XC70, ukjent (+utkast-regel, hopp over)
    regnr.ts            # normalisering og simulert oppslag
    logg.ts             # testlogg i localStorage, CSV
  state/                # React-kontekst: bil, svar, kurv, regler (localStorage), test/variant
  components/           # Layout, PrototypeStripe, TestStripe, StatusMerke, Forklaring, FagpersonPanel …
  pages/                # én fil per rute i spec §3
  assets/               # SVG-illustrasjoner
scripts/screenshots.mjs # Playwright: mobil (390) og desktop (1280) + axe
.github/workflows/deploy.yml
```

## Regelmotoren (`anbefal`)

Input: `bil | null` (merke, modell, år), `regler` (med status godkjent/utkast), `ledSvar` («ja»|«nei»|«vet_ikke»|null), `svar` (lamper, feste, kontakt), `produkter`.

1. Finn regel der merke+modell stemmer og år ∈ [fra, til], og som har status **godkjent** → **Bekreftet**, oppsett fra regelen.
2. Ellers, hvis `ledSvar` = ja → **Regelutledet**, krever universalrelé. `ledSvar` = nei → **Regelutledet**, kabelsett.
3. Ellers → **Ukjent**, ingen pakker, `nesteSteg: 'spor_led' | 'fagperson'`.
4. Bygg pakker (basis og anbefalt): lyssett etter antall lamper (1 → enkeltlampe-varianter, 2 → ett sett, 4 → to sett), brakett etter feste (antall = antall lamper / 2, rundet opp), og enten relé (variant etter regelen, dimensjonert til 4 lamper ved behov) eller kabelsett (2/4 lamper). Kontakt «original ekstralyskontakt» + krever ikke relé → plug-and-play-kabel i stedet for kabelsett.
5. Hver del får `hvorfor` + `regelId` + `kilde`. Pakken får `ikkeInkludert` og `ekstraIAnbefalt` (forklaring og prisforskjell).
6. «Ofte kjøpt sammen» returneres separat og er aldri en del av pakkeprisen (G5).

Testene dekker G2 (Ukjent er aldri Bekreftet), G3 (relé XOR kabelsett, aldri tomt), G4 (basis ≤ anbefalt, basis finnes alltid) og at en regel i utkast ikke gir Bekreftet (AK-4.4).

## Tilstand og personvern
- Bil, svar og kurv holdes i React-tilstand (sessionStorage for å overleve omlasting i en test). Regnr skrives til localStorage **bare** når samtykket er avkrysset (G8).
- Regler: `regler.json` er standard. Endringer fra `#/fagperson` lagres i localStorage og kan tilbakestilles.
- Testlogg: localStorage `pmb.logg` (økter med hendelser). Testmodus og variant leses fra `?test=1&variant=a&oppgave=1` (søkeparametre før `#`) og huskes i sessionStorage.

## Stil
Tailwind 4 med tokens: rød aksent `#C8102E` (kontrast 5,9:1 på hvit), tekst `#1A1A1A`, hvit bakgrunn. Toppmeny: ordmerke, Privat/Bedrift, søk (dekorativ), kurv med antall. Fokusring 3 px. Mobil først.

## Verifisering per steg
`npm test` + `npm run build` + manuell klikk-gjennomgang i Playwright. Til slutt: skjermbilder (mobil og desktop) + axe på hovedskjermene, deretter sjekkliste mot AK-ene.

## Risiko
- GitHub Pages må settes til «GitHub Actions» av repoeieren.
- Basisstien for Vite er `/JDD/` (reponavnet). Settes via `base` i `vite.config.ts`.
