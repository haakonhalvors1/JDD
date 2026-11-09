// Testlogg: lokalt i localStorage og, når backend er satt opp, også i Supabase (felles for alle enheter).
// Anonym (T1, T2 …), ingen navn eller e-post (G8).
import { harBackend, registrerOkt, sendAvslutning, sendHendelse, sendTilbakemelding } from './backend'

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
  /** Satt når hendelsen er bekreftet lagret i backend (sendekø) */
  sendt?: boolean
}

export interface Tilbakemelding {
  trygghet: number | null
  unodvendig: 'ja' | 'nei' | null
  unodvendigHva: string
  hjelpEllerMersalg: number | null
  fritekst: string
}

export interface Okt {
  /** Teknisk ID (UUID) – nøkkel lokalt og i backend */
  uuid: string
  /** Testperson-ID som vises: T1, T2 … (tildeles av backend når den finnes) */
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
    const okter = JSON.parse(localStorage.getItem(NOKKEL) ?? '[]') as Okt[]
    return okter.map((o) => ({ ...o, uuid: o.uuid ?? o.id }))
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

/** UUID for økten i denne fanen */
export function aktivOktId(): string | null {
  try {
    return sessionStorage.getItem(OKT_NOKKEL)
  } catch {
    return null
  }
}

/** Testperson-ID (T1 …) for økten i denne fanen */
export function aktivTestperson(): string | null {
  const id = aktivOktId()
  return les().find((o) => o.uuid === id)?.id ?? null
}

// ---------- Synk mot backend ----------
// Alle kall går i kø, slik at økten er registrert før hendelsene sendes.
let ko: Promise<unknown> = Promise.resolve()
let antallFeil = 0
export const synkFeil = () => antallFeil
export const OKT_ENDRET = 'pmb-okt-endret'

function synk(fn: (uuid: string) => Promise<unknown>) {
  const uuid = aktivOktId()
  if (!harBackend || !uuid) return
  ko = ko
    .then(() => fn(uuid))
    .catch((e) => {
      antallFeil++
      console.warn('Kunne ikke sende til felles logg (lagret lokalt):', e)
    })
}
export const ventPaSynk = () => ko

function registrer(o: Okt) {
  synk(async (uuid) => {
    const label = await registrerOkt(uuid, o)
    if (label && label !== o.id) {
      skriv(les().map((x) => (x.uuid === uuid ? { ...x, id: label } : x)))
      window.dispatchEvent(new Event(OKT_ENDRET))
    }
  })
  // Sendekø: hendelser som ikke ble bekreftet sendt (f.eks. siden ble lukket), sendes på nytt
  for (const h of o.hendelser.filter((x) => !x.sendt)) sendOgMerk(h)
}

function sendOgMerk(h: LoggHendelse) {
  synk(async (uuid) => {
    const { sendt: _ignorert, ...rad } = h
    void _ignorert
    await sendHendelse(uuid, rad)
    oppdater((o) => ({ ...o, hendelser: o.hendelser.map((x) => (x.tid === h.tid && x.navn === h.navn ? { ...x, sendt: true } : x)) }))
  })
}

// Innstillingene for økter som opprettes ved første hendelse
let innstForNyOkt: { test: boolean; oppgave: 1 | 2 | null; variant: 'a' | 'b' } = { test: false, oppgave: null, variant: 'a' }

/**
 * Ved oppstart: i testmodus opprettes økten med en gang (testlinjen viser T-nummeret).
 * Ellers opprettes den først ved første hendelse, slik at besøk på interne sider ikke gir tomme økter.
 */
export function startOkt(innst: typeof innstForNyOkt) {
  innstForNyOkt = innst
  if (innst.test || aktivOktId()) sikreOkt(innst)
}

/** Henter eller oppretter økten for denne fanen. */
export function sikreOkt(innst: { test: boolean; oppgave: 1 | 2 | null; variant: 'a' | 'b' }): Okt {
  const okter = les()
  const id = aktivOktId()
  const finnes = id ? okter.find((o) => o.uuid === id) : undefined
  if (finnes) {
    registrer(finnes) // idempotent: sikrer at økten finnes i backend etter omlasting
    return finnes
  }
  const uuid = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
  const ny: Okt = { uuid, id: nesteId(okter), start: new Date().toISOString(), hendelser: [], ...innst }
  skriv([...okter, ny])
  try {
    sessionStorage.setItem(OKT_NOKKEL, uuid)
  } catch {
    /* ignorer */
  }
  registrer(ny)
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
  skriv(les().map((o) => (o.uuid === id ? fn(o) : o)))
}

export function logg(navn: Hendelse, detalj?: string) {
  if (!les().some((o) => o.uuid === aktivOktId())) sikreOkt(innstForNyOkt)
  const h: LoggHendelse = { navn, tid: new Date().toISOString(), detalj }
  oppdater((o) => ({ ...o, hendelser: [...o.hendelser, h] }))
  sendOgMerk(h)
}

/** Logger bare første gang i økten (f.eks. landing, pakke_vist) */
export function loggEnGang(navn: Hendelse, detalj?: string) {
  const id = aktivOktId()
  const o = les().find((x) => x.uuid === id)
  if (!o || !o.hendelser.some((h) => h.navn === navn)) logg(navn, detalj)
}

export function avsluttOppgave(type: 'ferdig' | 'gitt_opp') {
  logg(type === 'ferdig' ? 'oppgave_ferdig' : 'oppgave_gitt_opp')
  oppdater((o) => (o.slutt ? o : { ...o, slutt: { type, tid: new Date().toISOString() } }))
  synk((uuid) => sendAvslutning(uuid, type))
}

export function lagreTilbakemelding(t: Tilbakemelding) {
  oppdater((o) => ({ ...o, tilbakemelding: t }))
  synk((uuid) => sendTilbakemelding(uuid, t))
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
