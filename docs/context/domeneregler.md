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

1. **De tre spørsmålene – svaralternativer og hva de styrer.** Hvilke valg skal finnes for antall lamper (1/2/4?), festemetode (grill/skiltbrakett, støtfanger, takstativ?) og kontakttype (f.eks. DT/Deutsch, Superseal, «vet ikke»)? Hvordan endrer svarene pakken (ett eller to sett, hvilken brakett, adapterkabel)?
2. **Basis vs. anbefalt.** Hva skiller de to? Mitt forslag: basis er billigste lys som oppfyller kravene, og anbefalt er et kraftigere/bedre lys. Begge har det som trengs for å fungere, og forskjellen forklares. Alternativt: samme lys, men anbefalt inkluderer noe ekstra?
3. **Relévalg og ukjent bil.** Når kunden svarer «Ja, LED-frontlys» på en ukjent bil, vet vi at det trengs et relé, men ikke *hvilket* (CAN FD eller ikke). Skal vi da velge et universalrelé (Regelutledet), eller stoppe og sende til fagperson?
4. **Regler for ekstralys.** Hva skal merknaden si? Mitt utkast: E-godkjent lykt, kobles slik at den bare lyser sammen med fjernlyset, samlet referansetall for fjernlys maks 100, og maks antall fjernlyslykter. Tallene må sjekkes mot Statens vegvesen og JDD før testing.
5. **Godkjenning av regler (K4).** Skal en redigert regel bli «ikke godkjent» til den godkjennes på nytt, og påvirker det kundeflyten med en gang (f.eks. status faller fra Bekreftet til Regelutledet)? Det ville vist sammenhengen godt i demoen.
6. **Montering.** Kundereisen sier «velger å montere selv med guide eller å bestille montering», mens service safarien fant «Vi monterer dessverre ikke». Skal «Book montering» vises (som stub eller via partner), eller holder vi oss til «monter selv + fagperson»?
7. **Antall testpersoner.** Oppgaven sier minst to. WBS 4.2 sier minst fem. Påvirker bare tekst i README og hvordan testloggen presenteres.
8. **GitHub-tilgang og deploy.** Denne økten kan lese `haakonhalvors1/jdd`, men får **ikke** pushe (Claude-appen er ikke installert for repoet/kontoen). For GitHub Pages må noen også slå på Pages → «GitHub Actions» i repoinnstillingene. Se spørsmålet i chatten.
9. **Visuell stil.** Jeg lager en egen stil inspirert av jddutstyr.no (rød aksent, hvit bakgrunn, toppmeny med Privat/Bedrift, søk og kurv) uten logo eller kopierte bilder. Produktbilder blir nøytrale illustrasjoner. OK?
