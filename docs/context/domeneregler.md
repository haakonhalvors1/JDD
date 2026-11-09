# Domeneregler

Kilder: oppdragsbeskrivelsen for prototypen, service safari (Oppg. 3), konsept og krav (Oppg. 4), e-post fra JDD (okt. 2026).
Regler merket **(antakelse)** er ikke bekreftet av JDD.

## Kompatibilitet

- **D1** Kompatibilitet avgjøres deterministisk av en regeltabell (`src/data/regler.json`), aldri av en språkmodell. Prototypen har ingen LLM.
- **D2** Hvert resultat har én av tre statuser:
  - **Bekreftet**: bilens oppsett finnes i modelltabellen.
  - **Regelutledet**: oppsettet er utledet fra kundens svar (f.eks. «Har bilen LED-frontlys? Ja»).
  - **Ukjent**: verken modelltabell eller svar. Vises aldri som bekreftet. Da tilbys spørsmål med bilde eller fagperson.
- **D3** Bil med LED-frontlys og/eller Canbus trenger et Canbus-relé i stedet for standard kabelsett (service safari: «Har bilen LED-lys og Canbus, trengs et relé»; ifølge byggemodulen trengs da *ikke* kabelsettet).
- **D4** Bil med halogenfrontlys uten Canbus klarer seg med standard kabelsett.
- **D5** Hvilket relé som passer avhenger av bilmodellen (f.eks. CAN FD). Det står i modelltabellen for reléer **(antakelse: JDD har eller kan lage denne tabellen)**.
- **D6** Hver anbefaling viser regelen og kilden den bygger på (regel-ID, kilde, hvem som godkjente den og dato).

## Pakken

- **D7** Pakken har alt som trengs for å fungere: lys + braketter + (kabelsett ELLER Canbus-relé). Riktig relé legges inn automatisk.
- **D8** «Trengs for å fungere» og «Ofte kjøpt sammen» blandes aldri visuelt.
- **D9** Pakken skal aldri være dyrere enn nødvendig. Basis vises alltid, og «anbefalt» forklarer hva man får ekstra.
- **D10** Hver anbefaling har «Hvorfor dette?» og «Ikke inkludert».
- **D11** De tre spørsmålene (JDDs ønske): antall lamper, festemetode, kontakttype. Valgknapper, ikke fritekst. Fagord forklares.

## Trygghet

- **D12** Passer-garanti: fri retur hvis veilederen anbefalte feil. Vilkårstekst merkes «forslag, avklares med JDD».
- **D13** Fagperson-chat viser bil og handlekurv øverst. Svarene er forhåndsskrevne.
- **D14** Leveringstid vises, uten skjulte tillegg.

## Lov og personvern

- **D15** Anbefalingene følger reglene for ekstralys (Statens vegvesen). Det vises en kort merknad om dette. **(Innholdet må verifiseres; se uklarheter.)**
- **D16** Regnr lagres bare med eksplisitt samtykke («Husk bilen min i Min garasje»). Uten samtykke holdes regnr bare i minnet for økten.
- **D17** Testloggen og tilbakemeldingene er anonyme (T1, T2 …). Ingen navn eller e-post.

## Grunnmur (fagperson)

- **D18** Fagpersoner legger inn, redigerer og godkjenner regler. Bare godkjente regler gir status *Bekreftet*. **(Antakelse; se uklarheter.)**
- **D19** Motstridende spesifikasjoner flagges under «Datakvalitet» (eksempel: 5500K mot 5700K på samme produkt).

## Språk

- **D20** Alt brukerrettet innhold er på norsk bokmål, i en vennlig og saklig tone. Det skal være tydelig at dette er en prototype med eksempeldata og eksempelpriser.

---

# Uklart: må avklares før eller under spesifiseringen

Jeg spør om disse ett tema om gangen.

1. ✔ **Avklart 9.11.2026: De tre spørsmålene.** Antall lamper: 1 / 2 / 4. Styrer antall lys og et kabelsett/relé dimensjonert for det. Festemetode: frontgrill/skiltbrakett / støtfanger / takstativ. Styrer braketten. Kontakttype: bilens originale ekstralyskontakt / ingen kontakt, kobles fra fjernlyset / vet ikke. Styrer plug-and-play-kabel eller relé/kabelsett. Hvert spørsmål har «Hva betyr dette?» og bilde. Merkes «forslag, avklares med JDD».
2. ✔ **Avklart 9.11.2026: Basis og anbefalt.** Basis er det billigste godkjente lyssettet. Anbefalt er et kraftigere sett (lengre rekkevidde, høyere referansetall). Relé og brakett er like i begge. En linje forklarer hva du får ekstra og hva det koster mer. «Ofte kjøpt sammen» ligger utenfor begge pakkene.
3. ✔ **Avklart 9.11.2026: Ukjent bil med «Ja, LED-frontlys».** Status Regelutledet. Pakken får et universalrelé som støtter både CAN og CAN FD, med merknaden «Fagperson kan bekrefte et rimeligere relé for din bil» og en knapp til fagperson. Passer-garantien gjelder. Dette er det billigste *sikre* valget med det vi vet, og «Hvorfor dette?» forklarer det, slik at D9 (aldri dyrere enn nødvendig) holder.
4. ✔ **Avklart 9.11.2026: Regler for ekstralys.** En generell merknad uten tall: «Lyktene er E-godkjent og kobles slik at de bare lyser sammen med fjernlyset. Det finnes grenser for antall lykter og samlet lysstyrke (referansetall). Vi sjekker pakken mot dette. Se Statens vegvesen.» Merkes «forslag, avklares med JDD». Hvert sett viser referansetallet sitt. Regelmotoren håndhever ingen tallgrenser i prototypen.
5. ✔ **Avklart 9.11.2026: Godkjenning av regler.** En redigert regel blir «Utkast – ikke godkjent». Bare godkjente regler gir status Bekreftet. En bil med regel i utkast faller til Ukjent/Regelutledet til regelen er godkjent. Lagres i localStorage, og det finnes en knapp for å tilbakestille eksempeldataene.
6. ✔ **Avklart 9.11.2026: Montering.** Hovedvalget er å montere selv med guide (K9-plassholder) og hjelp fra fagperson. En deaktivert knapp, «Bestill montering hos partnerverksted (kommer)», merkes «idé, avklares med JDD».
7. ✔ **Avklart 9.11.2026: Antall testpersoner.** Minst to brukertester før visningen for JDD. Målet fra WBS 4.2 er fem.
8. ⏳ **Avklart 9.11.2026, venter på gruppen: GitHub-tilgang og deploy.** Gruppen gir Claude-appen skrivetilgang til `haakonhalvors1/jdd` og setter Settings → Pages → Source = «GitHub Actions». Til da committes alt lokalt, og det pushes til `main` når tilgangen er på plass.
9. ✔ **Avklart 9.11.2026: Visuell stil.** Egen stil inspirert av jddutstyr.no: rød aksent, mørk tekst, hvit bakgrunn og toppmeny med Privat/Bedrift, søk og kurv. Ordmerket er «Passer min bil – prototype», og en stripe sier «Prototype · eksempeldata · ingen ekte bestilling». Ingen JDD-logo, ingen kopierte bilder, ingen ekte varenavn eller -numre. Bildene er SVG-illustrasjoner.
10. ✔ **Avklart 9.11.2026: Lagring.** All data lagres bare lokalt i nettleseren (localStorage). Ingen backend. Testene kjøres på én enhet, og CSV eksporteres etter hver test. Backend-koden (Supabase) finnes i git-historikken hvis det blir aktuelt senere.
