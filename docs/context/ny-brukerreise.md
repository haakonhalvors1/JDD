# Ny brukerreise: Martin kjøper ekstralys med «Passer min bil»

Kilde: fremtidig kundereise og tjenesteplan (Oppgave 4, lysbilde 11), sitemap (lysbilde 13), service safari (Oppgave 3).

## Dagens reise (service safari 12.10.2026, mobilvisning)

1. Finner et «komplett sett» – «Klart for montering», 3 186 kr. Produktsiden nevner ikke Canbus.
2. Kabelsettet er «for XBB». XBB er et eget relé til ca. 2 100 kr som ikke er med i settet.
3. Byggemodulen: «Har bilen LED-lys og Canbus, trengs et relé.» Kunden må selv vite hva bilen har.
4. Chatboten bekrefter Canbus, foreslår tre reléer og sier at bilen «kan hende» bruker CAN FD.
- Opptil åtte relé-alternativer uten liste over bilmodeller. Søk/filter går på kjøretøygruppe, ikke modell.
- Ved feilbestilling betaler kunden returfrakten. «Vi monterer dessverre ikke.»
- Samme produktside oppgir 5700K i beskrivelsen og 5500K i teknisk info.

## Fremtidig reise (det prototypen skal støtte)

| Fase | Kunden gjør | Kontaktpunkt (frontstage) | Bak kulissene | Hendelse i testloggen |
| --- | --- | --- | --- | --- |
| 1 Behov oppstår | Googler «ekstralys RAV4» | Landingsside per bilmodell med regnr-felt øverst (mobil først) | Innhold og søkeord per bilmodell | `landing` |
| 2 Forteller om bilen | Taster regnr, bekrefter bilen, svarer på tre spørsmål: antall lamper, festemetode, kontakttype | «Toyota RAV4 2022 – stemmer det?» Modelltabellen viser LED/Canbus. Ved tvil: «Har bilen LED-frontlys?» med bilde. Fagord forklares. Kan hoppes over | Regnr → modell (kjøretøyoppslag, avklares) → modelltabell for Canbus og lys. Fagpersoner vedlikeholder regler | `bil_bekreftet`, `sporsmal_ferdig` (+ `veileder_hoppet_over`) |
| 3 Velger pakke | Sammenligner basis og anbefalt. Leser hvorfor og hva som ikke er med | «Passer din bil»-merke, samlet pris, Passer-garanti. «Trengs for å fungere» skilt fra «Ofte kjøpt sammen» | Regelmotor for pakker. Produktdata kvalitetssikres (5500K/5700K) | `pakke_vist`, `hvorfor_apnet`, `ikke_inkludert_apnet`, `lagt_i_kurv` |
| 4 Spør og bestiller | Spør om montering, bestiller hele pakken i én ordre | Chat / «Ring meg tilbake» der fagpersonen ser bil og kurv. Leveringstid, ingen skjulte tillegg | Chat/CRM med kontekst, ordresystem. Nye svar blir til regler | `fagperson_apnet`, `bestilt` |
| 5 Monterer og etterpå | Monterer med guiden. Lysene virker, uten ny handletur | Bekreftelse, koblingsskjema/monteringsguide (fase 2, stub), «Fungerte det?» etter en uke | Returårsaker analyseres og retter dataene | (tilbakemeldingsskjema) |

## Sitemap (fra Oppgave 4)

Forside → Passer min bil → Regnr eller modell → Tre spørsmål → Pakke med forklaring → Kasse → Oppfølging

I tillegg (interne/test-sider, ikke en del av kundens rute): `#/fagperson` (K4), `#/innsikt` (K8), `#/testlogg`, tilbakemeldingsside.

## Alternative flyter

- **A1 Ukjent bil:** regnr uten treff → status *Ukjent* → «Har bilen LED-frontlys?» med bilde → ja/nei gir *Regelutledet* · «Vet ikke» → fagperson. Ukjent vises aldri som bekreftet.
- **A2 Hopper over veilederen:** kunden går rett til pakkene for bilen. Bilens oppsett (og dermed relé) gjelder fortsatt, men spørsmålene får standardverdier som vises og kan endres.
- **A3 Går til fagperson:** fra hvilket som helst steg etter at bilen er kjent. Chatten viser bil og kurv øverst.
- **A4 Merke/modell/år i stedet for regnr.**
- **A5 Bilen stemmer ikke:** «Nei, det er ikke min bil» → tilbake til regnr eller modellvelger.
