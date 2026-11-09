# Brukere og oppgaver

Kilder: Oppgave 3 (`docs/input/Oppgave_3_undersokelse_og_analyse.pdf`) og Oppgave 4 (`docs/input/IS-219_oppgave_4.pptx`).
Funnene er foreløpige (ett intervju 7.10.2026, én service safari 12.10.2026, intervjunotat fra oppdragsgiver 15.6.2026, e-post fra JDD okt. 2026).

## Målgrupper

| Rolle | Hvem | Kilde |
| --- | --- | --- |
| Primær | Private og semiprofesjonelle kjøpere med lite fagkunnskap som gjør sjeldne eller komplekse kjøp av bil-, maskin- og verkstedutstyr | Oppg. 3, kundesegment |
| Sekundær | Kundesenteret og ansatte som i dag matcher produkter og tilbehør manuelt | Oppg. 3, interessenter |
| Fagperson | Erfarne ansatte / nøkkelperson (går av med pensjon), JDD Maskin som fagkilde | Intervjunotat 15.6. |
| Bør undersøkes | Gjenkjøpskunder og profesjonelle kunder | Oppg. 3 |

## Persona: Martin, bilinteressert student

- Gjør enkelt vedlikehold selv og overlater det kompliserte til andre. Kjøper sjelden (mest rens, vask og olje). Siste store kjøp var en poleringsmaskin.
- Slik handler han: googler hva jobben krever → sjekker kampanjer og hva familien har → sammenligner bilder, størrelse og pris i flere butikker → velger det billigste når alternativene er omtrent like → oppdager i etterkant at noe mangler og må ut på en ny tur.
- Sitat: «Ville nok ikke kjøpt før jeg var ganske sikker på at det vil gå.»

**Trenger:** bekreftelse på at det passer det han har · forslag på tilbehør som *ikke* er inkludert · info om levering og montering · returgaranti hvis rådet er feil.

**Frustrasjoner:** vet ikke om han trenger varen til 1 500 eller 5 000 kr · har kjøpt for korte kabler og feil lader · ingen å spørre på nett, slik som i butikk.

**Vil ha hjelp, men på egne premisser:** snakker med en person ved nisjekjøp · klarer seg selv når han kjenner produktet · filtre eller konkrete spørsmål, ikke fritekst · «Ikke dra det som typiske chatbotter».

**Empatikart (kort):** tenker «trenger jeg virkelig den dyre?» · ser mange like produkter med stor prisforskjell · hører råd fra venner, Google og AI · googler og sammenligner pris.
Pains: vet ikke hva som trengs, glemt tilbehør gir to turer, feil kabel eller lader. Gains: sparer penger på å gjøre jobben selv, riktig produkt første gang, trygg retur.

> Merk (fra Oppg. 3): respondenten hadde ikke kjøpt produkter som avhenger av kjøretøyet. JDDs kjernebehov, kjøretøykompatibilitet, er derfor **ikke testet med brukere ennå**. Prototypetestene er første gang dette testes.

## Kundejobber (verdiforslagskartet)

- Vedlikeholde og fikse bil og utstyr selv
- Finne og kjøpe alt jobben krever
- Forklare hva jeg har, få vite hva jeg trenger

## Oppgaver prototypen skal la brukeren løse

| # | Oppgave | Hvem | Brukes i test |
| --- | --- | --- | --- |
| O1 | Kjøp ekstralys med alt som trengs til en Toyota RAV4 2022 (LED-frontlys) | Kunde | Standardoppgave (samme som i service safarien, gir sammenligning med dagens nettbutikk) |
| O2 | Finn ut hvorfor reléet er med i pakken, og spør en fagperson om du kan montere selv | Kunde | Ekstraoppgave |
| O3 | Hopp over veilederen og velg selv (kunden kjenner produktet) | Kunde | Alternativ flyt |
| O4 | Finn riktig pakke for en bil som ikke er i modelltabellen | Kunde | Alternativ flyt (Ukjent) |
| O5 | Se, rediger og godkjenn en kompatibilitetsregel. Se datakvalitetsavvik | Fagperson | Demo for JDD (K4) |
| O6 | Se hva testerne spurte om og hvor de stoppet | Kundesenter | Demo for JDD (K8) |

## Interessekonflikter prototypen må ta hensyn til

- **JDD ↔ kunden:** JDD ønsker større handlekurv, men kunden er skeptisk hvis guiden «foreslår dyrere enn nødvendig». Pakketilbud må oppleves som hjelp. Derfor vises basis alltid, og «trengs» skilles fra «ofte kjøpt».
- **Ledelse ↔ ansatte:** automatisering kan oppleves som en trussel for kundesenteret. Fagperson-siden viser at de ansattes kunnskap er grunnmuren.
- **JDD ↔ produsentene:** guiden er avhengig av kompatibilitetsdata som produsentene eier.
