// Felles typer for «Passer min bil». Alle data er eksempeldata.

export type Status = 'bekreftet' | 'regelutledet' | 'ukjent' // G2

export interface Bil {
  merke: string
  modell: string
  ar: number
  regnr?: string
}

export type Frontlys = 'LED' | 'halogen'
export type Canbus = 'nei' | 'CAN' | 'CAN FD'
export type Krever = 'rele' | 'kabelsett'

/** Kompatibilitetsregel på modellnivå (K4). Bare godkjente regler gir status Bekreftet. */
export interface Regel {
  id: string
  merke: string
  modell: string
  arFra: number
  arTil: number
  frontlys: Frontlys
  canbus: Canbus
  krever: Krever
  /** Produkt-ID for reléet når krever = rele */
  releId?: string
  kilde: string
  status: 'godkjent' | 'utkast'
  godkjentAv?: string
  godkjentDato?: string
  merknad?: string
}

/** Regel som utleder oppsett fra kundens svar på «Har bilen LED-frontlys?» */
export interface Utledningsregel {
  id: string
  ledSvar: 'ja' | 'nei'
  krever: Krever
  releId?: string
  beskrivelse: string
  kilde: string
}

export interface Regeldata {
  regler: Regel[]
  utledning: Utledningsregel[]
}

export type Kategori = 'lys' | 'brakett' | 'kabelsett' | 'plugplay' | 'rele' | 'forgrening' | 'ofte'

export interface Produkt {
  id: string
  navn: string
  kategori: Kategori
  pris: number
  kort: string
  /** Lys: basis eller anbefalt nivå */
  niva?: 'basis' | 'anbefalt'
  /** Lys: antall lamper per enhet (1 = enkeltlampe, 2 = sett) */
  lamperPerEnhet?: number
  referansetall?: number
  rekkeviddeM?: number
  fargetempBeskrivelse?: string
  fargetempTeknisk?: string
  /** Brakett: hvilken festemetode */
  feste?: Feste
  /** Kabelsett: antall lamper det er dimensjonert for */
  forLamper?: number
  /** Relé: hvilke Canbus-typer det støtter */
  stotter?: Canbus[]
}

export type AntallLamper = 1 | 2 | 4
export type Feste = 'grill' | 'stotfanger' | 'tak'
export type Kontakt = 'original' | 'ingen' | 'vet_ikke'

export interface Svar {
  lamper: AntallLamper
  feste: Feste
  kontakt: Kontakt
}

export type LedSvar = 'ja' | 'nei' | 'vet_ikke' | null

export interface Linje {
  produkt: Produkt
  antall: number
  rolle: 'lys' | 'brakett' | 'tilkobling' | 'forgrening'
  hvorfor: string
  regelId: string
  kilde: string
}

export interface IkkeInkludert {
  tekst: string
  trengs: 'ja' | 'nei' | 'kanskje'
  forklaring: string
}

export interface Pakke {
  niva: 'basis' | 'anbefalt'
  tittel: string
  linjer: Linje[]
  sum: number
  ikkeInkludert: IkkeInkludert[]
  /** Bare anbefalt: hva man får ekstra og hva det koster mer (G4) */
  ekstra?: { tekst: string; merpris: number }
}

export interface Resultat {
  status: Status
  regel?: Regel
  utledning?: Utledningsregel
  oppsett?: { frontlys?: Frontlys; canbus?: Canbus; krever: Krever; releId?: string }
  begrunnelse: string
  kilde: string
  /** Hva kunden bør gjøre når status er Ukjent */
  nesteSteg?: 'spor_led' | 'fagperson'
  pakker: { basis: Pakke; anbefalt: Pakke } | null
  ofteKjopt: Produkt[]
  merknader: string[]
}
