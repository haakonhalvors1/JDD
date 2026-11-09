# CLAUDE.md – «Passer min bil» (IS-219, gruppe 1, JDD Utstyr)

Klikkbar, mobil-først frontend-prototype for brukertester og visning for JDD. **Ikke et produksjonssystem.**
Les `docs/governance/constitution.md` før du endrer noe. Den går foran alt annet her.

## Sannhetskilder (i prioritert rekkefølge)
1. `docs/governance/constitution.md` – ufravikelige regler G1–G9.
2. `specs/001-passer-min-bil/spec.md` – brukerhistorier K1–K9 og akseptansekriterier.
3. `docs/context/` – brukere, ny brukerreise, domeneregler og avklaringer.
4. `docs/input/` – Oppgave 3 (PDF) og Oppgave 4 (pptx) fra gruppen.

## Domeneregler (kortversjon, se grunnloven)
- Kompatibilitet avgjøres **deterministisk** av `src/data/regler.json` via den rene funksjonen `src/logic/anbefal.ts`. **Ingen LLM** og ingen nettverkskall.
- Status er alltid én av **Bekreftet** (godkjent regel i modelltabellen), **Regelutledet** (kundens svar) eller **Ukjent**. Ukjent vises aldri som bekreftet, og da tilbys spørsmål med bilde eller fagperson.
- LED-frontlys/Canbus → Canbus-relé i stedet for kabelsett. Halogen uten Canbus → standard kabelsett. Pakken har alltid lys, brakett og (kabelsett ELLER relé).
- Pakken er aldri dyrere enn nødvendig: basis vises alltid, og anbefalt forklarer hva det ekstra er.
- «Trengs for å fungere» og «Ofte kjøpt sammen» blandes aldri visuelt.
- Hver anbefaling viser regel-ID, kilde, «Hvorfor dette?» og «Ikke inkludert».
- Regnr lagres bare med samtykke («Husk bilen min i Min garasje»).
- Alt brukerrettet innhold er på **norsk bokmål**, vennlig og saklig. Data er merket eksempeldata, og priser er merket eksempelpris.

## Teknikk
- Vite + React + TypeScript + Tailwind, `HashRouter` (GitHub Pages). Ingen backend. Tilstand i minnet og localStorage.
- Tester: Vitest (`src/logic/*.test.ts`). Skjermbilder: Playwright (`scripts/screenshots.ts`).
- Deploy: GitHub Actions → GitHub Pages.

## Kommandoer
```bash
npm install
npm run dev        # utviklingsserver
npm test           # Vitest én gang
npm run build      # typesjekk + produksjonsbygg
npm run screenshots
```

## Arbeidsflyt
- Spec → plan → oppgaver (`specs/001-passer-min-bil/`). Vent på godkjenning fra gruppen mellom fasene.
- Én oppgave fra `tasks.md` om gangen. Kjør `npm test` og `npm run build`, se på appen og verifiser mot akseptansekriteriene før neste oppgave.
- Merk kode som oppfyller krav med `// K<n>` eller `// G<n>`.
- Nye uklarheter føres i `docs/context/domeneregler.md` under «Uklart», og gruppen spørres. Ikke gjett stille.
- Commit-meldinger på norsk.
