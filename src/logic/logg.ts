// Testlogg i localStorage. Anonym (T1, T2 …), ingen navn eller e-post (G8).

export type Hendelse =
  | 'landing'
  | 'bil_bekreftet'
  | 'led_besvart'
  | 'sporsmal_ferdig'
  | 'veileder_hoppet_over'
  | 'pakke_vist'
  | 'hvorfor_apnet'
  | 'ikke_inkludert_apnet'
  | 'fagperson_apnet'
  | 'fagperson_sporsmal'
  | 'lagt_i_kurv'
  | 'bestilt'
  | 'oppgave_ferdig'
  | 'oppgave_gitt_opp'
  | 'tilbakemelding_sendt'

/** Rekkefølgen i funnelen (for #/innsikt) */
export const FUNNEL: Hendelse[] = [
  'landing',
  'bil_bekreftet',
  'sporsmal_ferdig',
  'pakke_vist',
  'hvorfor_apnet',
  'ikke_inkludert_apnet',
  'fagperson_apnet',
  'lagt_i_kurv',
  'bestilt',
]

export interface LoggHendelse {
  navn: Hendelse
  tid: string
  detalj?: string
}

export interface Tilbakemelding {
  trygghet: number | null
  unodvendig: 'ja' | 'nei' | null
  unodvendigHva: string
  hjelpEllerMersalg: number | null
  fritekst: string
}

export interface Okt {
  id: string
  start: string
  test: boolean
  oppgave: 1 | 2 | null
  variant: 'a' | 'b'
  hendelser: LoggHendelse[]
  slutt?: { type: 'ferdig' | 'gitt_opp'; tid: string }
  tilbakemelding?: Tilbakemelding
}

const NOKKEL = 'pmb.logg'
const OKT_NOKKEL = 'pmb.okt'

function les(): Okt[] {
  try {
    return JSON.parse(localStorage.getItem(NOKKEL) ?? '[]') as Okt[]
  } catch {
    return []
  }
}
function skriv(okter: Okt[]) {
  try {
    localStorage.setItem(NOKKEL, JSON.stringify(okter))
  } catch {
    /* localStorage utilgjengelig – logging hoppes over */
  }
}

export const hentOkter = les
export function slettLogg() {
  skriv([])
  try {
    sessionStorage.removeItem(OKT_NOKKEL)
  } catch {
    /* ignorer */
  }
}

export function nesteId(okter: Okt[]): string {
  const maks = okter.reduce((m, o) => Math.max(m, Number(o.id.replace(/\D/g, '')) || 0), 0)
  return `T${maks + 1}`
}

export function aktivOktId(): string | null {
  try {
    return sessionStorage.getItem(OKT_NOKKEL)
  } catch {
    return null
  }
}

/** Henter eller oppretter økten for denne fanen. */
export function sikreOkt(innst: { test: boolean; oppgave: 1 | 2 | null; variant: 'a' | 'b' }): Okt {
  const okter = les()
  const id = aktivOktId()
  const finnes = id ? okter.find((o) => o.id === id) : undefined
  if (finnes) return finnes
  const ny: Okt = { id: nesteId(okter), start: new Date().toISOString(), hendelser: [], ...innst }
  skriv([...okter, ny])
  try {
    sessionStorage.setItem(OKT_NOKKEL, ny.id)
  } catch {
    /* ignorer */
  }
  return ny
}

export function nyOkt() {
  try {
    sessionStorage.removeItem(OKT_NOKKEL)
  } catch {
    /* ignorer */
  }
}

function oppdater(fn: (o: Okt) => Okt) {
  const id = aktivOktId()
  if (!id) return
  skriv(les().map((o) => (o.id === id ? fn(o) : o)))
}

export function logg(navn: Hendelse, detalj?: string) {
  oppdater((o) => ({ ...o, hendelser: [...o.hendelser, { navn, tid: new Date().toISOString(), detalj }] }))
}

/** Logger bare første gang i økten (f.eks. landing, pakke_vist) */
export function loggEnGang(navn: Hendelse, detalj?: string) {
  const id = aktivOktId()
  const o = les().find((x) => x.id === id)
  if (o && !o.hendelser.some((h) => h.navn === navn)) logg(navn, detalj)
}

export function avsluttOppgave(type: 'ferdig' | 'gitt_opp') {
  logg(type === 'ferdig' ? 'oppgave_ferdig' : 'oppgave_gitt_opp')
  oppdater((o) => (o.slutt ? o : { ...o, slutt: { type, tid: new Date().toISOString() } }))
}

export function lagreTilbakemelding(t: Tilbakemelding) {
  oppdater((o) => ({ ...o, tilbakemelding: t }))
  logg('tilbakemelding_sendt')
}

// ---- Avledede mål (brukes i #/testlogg, #/innsikt og CSV) ----

export function sekunderPaOppgave(o: Okt): number | null {
  const forste = o.hendelser[0]?.tid
  const slutt = o.slutt?.tid ?? o.hendelser.find((h) => h.navn === 'bestilt')?.tid
  if (!forste || !slutt) return null
  return Math.round((Date.parse(slutt) - Date.parse(forste)) / 1000)
}

export const hoppetOver = (o: Okt) => o.hendelser.some((h) => h.navn === 'veileder_hoppet_over')
export const har = (o: Okt, h: Hendelse) => o.hendelser.some((x) => x.navn === h)
export const komplettOrdre = (o: Okt) => o.hendelser.some((h) => h.navn === 'bestilt' && h.detalj === 'komplett')

/** Siste steg i funnelen personen nådde */
export function stoppetVed(o: Okt): Hendelse | null {
  const nadd = FUNNEL.filter((f) => har(o, f))
  return nadd.length ? nadd[nadd.length - 1] : null
}

const csvCelle = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v)
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** CSV med semikolon og BOM (åpnes riktig i norsk Excel). Én rad per hendelse. */
export function tilCsv(okter: Okt[]): string {
  const hode = [
    'testperson', 'oppgave', 'variant', 'testmodus', 'hendelse', 'detalj', 'tidspunkt', 'sek_fra_start',
    'veileder_hoppet_over', 'oppgave_slutt', 'sek_pa_oppgave', 'komplett_ordre',
    'trygghet_1_5', 'unodvendig', 'unodvendig_hva', 'hjelp_mersalg_1_5', 'fritekst',
  ]
  const rader = okter.flatMap((o) => {
    const t0 = Date.parse(o.hendelser[0]?.tid ?? o.start)
    const felles = (h?: LoggHendelse) => [
      o.id, o.oppgave ?? '', o.variant, o.test ? 'ja' : 'nei', h?.navn ?? '', h?.detalj ?? '', h?.tid ?? '',
      h ? Math.round((Date.parse(h.tid) - t0) / 1000) : '',
      hoppetOver(o) ? 'ja' : 'nei', o.slutt?.type ?? '', sekunderPaOppgave(o) ?? '', komplettOrdre(o) ? 'ja' : 'nei',
      o.tilbakemelding?.trygghet ?? '', o.tilbakemelding?.unodvendig ?? '', o.tilbakemelding?.unodvendigHva ?? '',
      o.tilbakemelding?.hjelpEllerMersalg ?? '', o.tilbakemelding?.fritekst ?? '',
    ]
    return o.hendelser.length ? o.hendelser.map(felles) : [felles()]
  })
  return '﻿' + [hode, ...rader].map((r) => r.map(csvCelle).join(';')).join('\r\n')
}
