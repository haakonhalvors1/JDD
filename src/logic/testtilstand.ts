// Tilstand for én testoppgave: ikke_startet → pagar → fullfort | avbrutt. Ren funksjon, testet i testtilstand.test.ts.

export type TestStatus = 'ikke_startet' | 'pagar' | 'fullfort' | 'avbrutt'

export const STATUS_TEKST: Record<TestStatus, string> = {
  ikke_startet: 'ikke startet',
  pagar: 'pågår',
  fullfort: 'fullført',
  avbrutt: 'avbrutt',
}

export type AvbruddArsak = 'fant_ikke_bilen' | 'usikker_pakke' | 'forsto_ikke_tilbehor' | 'pris' | 'annet'

export const AVBRUDD_ARSAKER: { verdi: AvbruddArsak; tekst: string }[] = [
  { verdi: 'fant_ikke_bilen', tekst: 'Fant ikke bilen' },
  { verdi: 'usikker_pakke', tekst: 'Usikker på om pakken passet' },
  { verdi: 'forsto_ikke_tilbehor', tekst: 'Forsto ikke tilbehøret' },
  { verdi: 'pris', tekst: 'Pris' },
  { verdi: 'annet', tekst: 'Annet' },
]

export interface Tilbakemelding {
  trygghet: number | null
  unodvendig: 'ja' | 'nei' | null
  unodvendigHva: string
  hjelpEllerMersalg: number | null
  fritekst: string
}

export interface OppgaveTilstand {
  status: TestStatus
  startet?: string
  avsluttet?: string
  sekunder?: number
  /** Ved avbrudd: siste hendelse og side før avbrudd */
  stoppetVed?: string
  arsak?: AvbruddArsak
  arsakFritekst?: string
  tilbakemelding?: Tilbakemelding
}

export const nyOppgave = (): OppgaveTilstand => ({ status: 'ikke_startet' })

export type TestHandling =
  | { type: 'start'; tid: string }
  | { type: 'fullfor'; tid: string }
  | { type: 'avbryt'; tid: string; stoppetVed: string }

/**
 * Lovlige overganger: ikke_startet → pagar (start), pagar → fullfort (fullfor), pagar → avbrutt (avbryt).
 * Alt annet gir uendret tilstand og endret = false. En avsluttet oppgave kan aldri startes på nytt.
 */
export function overgang(t: OppgaveTilstand, h: TestHandling): { tilstand: OppgaveTilstand; endret: boolean } {
  const uendret = { tilstand: t, endret: false }
  const sekunder = (tid: string) => (t.startet ? Math.max(0, Math.round((Date.parse(tid) - Date.parse(t.startet)) / 1000)) : 0)
  switch (h.type) {
    case 'start':
      return t.status === 'ikke_startet' ? { tilstand: { status: 'pagar', startet: h.tid }, endret: true } : uendret
    case 'fullfor':
      return t.status === 'pagar'
        ? { tilstand: { ...t, status: 'fullfort', avsluttet: h.tid, sekunder: sekunder(h.tid) }, endret: true }
        : uendret
    case 'avbryt':
      return t.status === 'pagar'
        ? { tilstand: { ...t, status: 'avbrutt', avsluttet: h.tid, sekunder: sekunder(h.tid), stoppetVed: h.stoppetVed }, endret: true }
        : uendret
  }
}

export const erAvsluttet = (t: OppgaveTilstand) => t.status === 'fullfort' || t.status === 'avbrutt'
