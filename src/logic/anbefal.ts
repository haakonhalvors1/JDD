// Regelmotoren for «Passer min bil».
// G1: Ren, deterministisk funksjon. Ingen språkmodell, ingen tilfeldighet og ingen nettverkskall.
// Samme input gir alltid samme output.

import type {
  Bil, Krever, LedSvar, Linje, Pakke, Produkt, Regel, Regeldata, Resultat, Svar, Utledningsregel, IkkeInkludert,
} from './typer'

export const LOVMERKNAD =
  'Lyktene er E-godkjent og kobles slik at de bare lyser sammen med fjernlyset. Det finnes grenser for antall lykter og samlet lysstyrke (referansetall). Vi sjekker pakken mot dette. Se Statens vegvesen.'

const lik = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

/** Finn regler for bilen: godkjent regel (gir Bekreftet) og evt. regel i utkast. */
export function finnRegel(bil: Bil | null, regler: Regel[]): { godkjent?: Regel; utkast?: Regel } {
  if (!bil) return {}
  const treff = regler.filter(
    (r) => lik(r.merke, bil.merke) && lik(r.modell, bil.modell) && bil.ar >= r.arFra && bil.ar <= r.arTil,
  )
  return {
    godkjent: treff.find((r) => r.status === 'godkjent'), // K4/AK-4.4: bare godkjente regler bekrefter
    utkast: treff.find((r) => r.status === 'utkast'),
  }
}

export interface AnbefalInput {
  bil: Bil | null
  ledSvar: LedSvar
  svar: Svar
  regeldata: Regeldata
  produkter: Produkt[]
}

interface Oppsett {
  krever: Krever
  releId?: string
  regelId: string
  kilde: string
  /** Kort forklaring av hvorfor tilkoblingen er valgt (brukes i «Hvorfor dette?») */
  tilkoblingHvorfor: string
}

export const kr = (n: number) => `${n.toLocaleString('nb-NO')} kr`

function hent(produkter: Produkt[], id: string): Produkt {
  const p = produkter.find((x) => x.id === id)
  if (!p) throw new Error(`Ukjent produkt: ${id}`)
  return p
}

function byggPakke(niva: 'basis' | 'anbefalt', o: Oppsett, svar: Svar, produkter: Produkt[]): Pakke {
  const linjer: Linje[] = []
  const perEnhet = svar.lamper === 1 ? 1 : 2
  const lys = produkter.find((p) => p.kategori === 'lys' && p.niva === niva && p.lamperPerEnhet === perEnhet)
  if (!lys) throw new Error(`Mangler lys for ${niva}/${perEnhet}`)
  const antallLys = svar.lamper === 4 ? 2 : 1

  linjer.push({
    produkt: lys,
    antall: antallLys,
    rolle: 'lys',
    hvorfor:
      niva === 'basis'
        ? `Det rimeligste E-godkjente lyset som passer det du har valgt (${svar.lamper} ${svar.lamper === 1 ? 'lampe' : 'lamper'}).`
        : `Et kraftigere lys med lengre rekkevidde (${lys.rekkeviddeM} m) for deg som kjører mye i mørket. Ellers er alt likt basis.`,
    regelId: 'P-LYS',
    kilde: 'Ditt svar: antall lamper',
  })

  const brakett = produkter.find((p) => p.kategori === 'brakett' && p.feste === svar.feste)
  if (!brakett) throw new Error(`Mangler brakett for ${svar.feste}`)
  linjer.push({
    produkt: brakett,
    antall: Math.ceil(svar.lamper / 2),
    rolle: 'brakett',
    hvorfor: 'Lampene må festes til bilen. Braketten passer festemetoden du valgte, og hver brakett holder to lamper.',
    regelId: 'P-FESTE',
    kilde: 'Ditt svar: festemetode',
  })

  // G3: alltid enten relé eller kabelsett/plug-and-play, aldri begge og aldri ingen.
  if (o.krever === 'rele') {
    linjer.push({
      produkt: hent(produkter, o.releId ?? 'REL-UNI'),
      antall: 1,
      rolle: 'tilkobling',
      hvorfor: o.tilkoblingHvorfor,
      regelId: o.regelId,
      kilde: o.kilde,
    })
    if (svar.lamper === 4) {
      linjer.push({
        produkt: hent(produkter, 'FGR-4'),
        antall: 1,
        rolle: 'forgrening',
        hvorfor: 'Reléet har uttak for to lamper. Forgreningskabelen gjør at fire lamper kan kobles til samme relé.',
        regelId: 'P-FGR',
        kilde: 'Ditt svar: 4 lamper',
      })
    }
  } else if (svar.kontakt === 'original') {
    linjer.push({
      produkt: hent(produkter, 'PNP-ORIG'),
      antall: 1,
      rolle: 'tilkobling',
      hvorfor: `${o.tilkoblingHvorfor} Du har svart at bilen har original ekstralyskontakt, så en plug-and-play-kabel holder. Den er rimeligere enn et kabelsett.`,
      regelId: o.regelId,
      kilde: `${o.kilde} + ditt svar: kontakttype`,
    })
  } else {
    linjer.push({
      produkt: hent(produkter, svar.lamper === 4 ? 'KAB-4' : 'KAB-2'),
      antall: 1,
      rolle: 'tilkobling',
      hvorfor:
        o.tilkoblingHvorfor +
        (svar.kontakt === 'vet_ikke'
          ? ' Du var usikker på kontakten, så vi har valgt kabelsettet. Det fungerer uansett.'
          : ''),
      regelId: o.regelId,
      kilde: o.kilde,
    })
  }

  const sum = linjer.reduce((s, l) => s + l.produkt.pris * l.antall, 0)

  const ikkeInkludert: IkkeInkludert[] = [
    {
      tekst: 'Verktøy',
      trengs: 'ja',
      forklaring: 'Skrutrekker, 10 mm pipe og avbiter. De fleste har dette hjemme, så det er ikke lagt i pakken.',
    },
    o.krever === 'rele'
      ? {
          tekst: 'Vanlig kabelsett',
          trengs: 'nei',
          forklaring: 'Canbus-reléet erstatter kabelsettet på din bil. Du skal ikke kjøpe begge.',
        }
      : {
          tekst: 'Canbus-relé',
          trengs: 'nei',
          forklaring: 'Bilen trenger ikke Canbus-relé. Det ville vært en unødvendig utgift.',
        },
    {
      tekst: 'Bryter på dashbordet',
      trengs: 'nei',
      forklaring: 'Lysene følger fjernlyset automatisk. En egen bryter er valgfri (se «Ofte kjøpt sammen»).',
    },
    {
      tekst: 'Montering',
      trengs: 'kanskje',
      forklaring: 'Du monterer selv med guiden du får etter kjøpet. Spør en fagperson hvis du er usikker.',
    },
  ]
  if (svar.feste === 'tak') {
    ikkeInkludert.unshift({
      tekst: 'Takstativ eller takgrind',
      trengs: 'ja',
      forklaring: 'Takstativfestet krever at bilen allerede har takstativ eller takgrind.',
    })
  }

  return {
    niva,
    tittel: niva === 'basis' ? 'Basis' : 'Anbefalt',
    linjer,
    sum,
    ikkeInkludert,
  }
}

/**
 * Hovedfunksjonen: fra bil + svar til status og pakker.
 * K1, K2, K3 · G1–G6
 */
export function anbefal(input: AnbefalInput): Resultat {
  const { bil, ledSvar, svar, regeldata, produkter } = input
  const ofteKjopt = produkter.filter((p) => p.kategori === 'ofte') // G5: holdes separat, aldri i pakken
  const merknader = [LOVMERKNAD]
  const { godkjent, utkast } = finnRegel(bil, regeldata.regler)

  let status: Resultat['status']
  let oppsett: Oppsett
  let regel: Regel | undefined
  let utledning: Utledningsregel | undefined
  let begrunnelse: string
  let kilde: string

  if (godkjent) {
    // Bekreftet: fra godkjent regel i modelltabellen
    status = 'bekreftet'
    regel = godkjent
    kilde = godkjent.kilde
    begrunnelse =
      godkjent.krever === 'rele'
        ? `${bil!.merke} ${bil!.modell} ${bil!.ar} har ${godkjent.frontlys}-frontlys og Canbus (${godkjent.canbus}). Et vanlig kabelsett fungerer ikke, så pakken har et Canbus-relé for ${godkjent.canbus}.`
        : `${bil!.merke} ${bil!.modell} ${bil!.ar} har ${godkjent.frontlys}-frontlys uten Canbus. Et standard kabelsett holder, så du trenger ikke et dyrere relé.`
    oppsett = {
      krever: godkjent.krever,
      releId: godkjent.releId,
      regelId: godkjent.id,
      kilde: godkjent.kilde,
      tilkoblingHvorfor: begrunnelse,
    }
  } else if (ledSvar === 'ja' || ledSvar === 'nei') {
    // Regelutledet: fra kundens svar på «Har bilen LED-frontlys?»
    const u = regeldata.utledning.find((x) => x.ledSvar === ledSvar)
    if (!u) throw new Error(`Mangler utledningsregel for ${ledSvar}`)
    status = 'regelutledet'
    utledning = u
    kilde = u.kilde
    begrunnelse = u.beskrivelse
    oppsett = { krever: u.krever, releId: u.releId, regelId: u.id, kilde: u.kilde, tilkoblingHvorfor: u.beskrivelse }
    if (u.releId === 'REL-UNI') merknader.push('Fagperson kan bekrefte et rimeligere relé for din bil.')
  } else {
    // Ukjent: aldri vist som bekreftet (G2). Ingen pakke.
    return {
      status: 'ukjent',
      regel: utkast,
      begrunnelse: utkast
        ? 'Vi har en regel for denne bilen, men den er ikke godkjent av en fagperson ennå. Derfor kan vi ikke bekrefte oppsettet.'
        : bil
          ? `Vi har ikke bekreftet oppsettet for ${bil.merke} ${bil.modell} ${bil.ar} ennå.`
          : 'Vi vet ikke hvilken bil det gjelder ennå.',
      kilde: utkast ? `${utkast.id} (utkast, ikke godkjent)` : 'Ingen regel i modelltabellen',
      nesteSteg: ledSvar === 'vet_ikke' ? 'fagperson' : 'spor_led',
      pakker: null,
      ofteKjopt,
      merknader,
    }
  }

  const basis = byggPakke('basis', oppsett, svar, produkter)
  const anbefalt = byggPakke('anbefalt', oppsett, svar, produkter)
  const lysB = basis.linjer[0].produkt
  const lysA = anbefalt.linjer[0].produkt
  anbefalt.ekstra = {
    tekst: `Kraftigere lys: ca. ${lysA.rekkeviddeM?.toLocaleString('nb-NO')} m rekkevidde mot ${lysB.rekkeviddeM?.toLocaleString('nb-NO')} m, og bredere lysbilde. Relé/kabelsett og brakett er de samme som i basis.`,
    merpris: anbefalt.sum - basis.sum,
  }

  return {
    status,
    regel,
    utledning,
    oppsett: {
      frontlys: regel?.frontlys ?? (ledSvar === 'ja' ? 'LED' : ledSvar === 'nei' ? 'halogen' : undefined),
      canbus: regel?.canbus,
      krever: oppsett.krever,
      releId: oppsett.releId,
    },
    begrunnelse,
    kilde,
    pakker: { basis, anbefalt },
    ofteKjopt,
    merknader,
  }
}

