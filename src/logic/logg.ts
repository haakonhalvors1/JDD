// Testlogg i localStorage (bare på denne enheten). Anonym (T1, T2 …), ingen navn eller e-post (G8).
// En «økt» er én testperson (eller én anonym besøkende uten testmodus). Hver testperson har to oppgaver
// med egen tilstand: ikke_startet → pagar → fullfort | avbrutt (se testtilstand.ts).
import {
  erAvsluttet, nyOppgave, overgang, STATUS_TEKST, AVBRUDD_ARSAKER,
  type AvbruddArsak, type OppgaveTilstand, type TestStatus, type Tilbakemelding,
} from './testtilstand'

export type { Tilbakemelding } from './testtilstand'

export type Hendelse =
  | 'landing'
  | 'populaer_modell_valgt'
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
  | 'oppgave_startet'
  | 'oppgave_fullfort'
  | 'oppgave_avbrutt'
  | 'avbrudd_besvart'
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

export type OppgaveNr = 1 | 2

export interface LoggHendelse {
  navn: Hendelse
  tid: string
  detalj?: string
  /** Oppgaven som pågikk da hendelsen skjedde */
  oppgave?: OppgaveNr | null
}

export interface Okt {
  /** Teknisk ID (UUID) */
  uuid: string
  /** Testperson-ID som vises: T1, T2 … */
  id: string
  start: string
  /** true = testperson (startet i testmodus), false = anonym besøkende */
  test: boolean
  variant: 'a' | 'b'
  oppgaver: Record<OppgaveNr, OppgaveTilstand>
  hendelser: LoggHendelse[]
}

const NOKKEL = 'pmb.logg'
/** Aktiv testperson på denne enheten (localStorage, overlever omlasting og nye faner) */
const AKTIV_NOKKEL = 'pmb.aktivTestperson'
/** Anonym økt for besøk uten testmodus (per fane) */
const ANONYM_NOKKEL = 'pmb.okt'

const tom = (): Record<OppgaveNr, OppgaveTilstand> => ({ 1: nyOppgave(), 2: nyOppgave() })
const naa = () => new Date().toISOString()
const nyUuid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`

function les(): Okt[] {
  try {
    const okter = JSON.parse(localStorage.getItem(NOKKEL) ?? '[]') as Partial<Okt>[]
    // Tåler eldre format (før tilstand per oppgave)
    return okter.map((o) => ({ ...(o as Okt), uuid: o.uuid ?? o.id!, oppgaver: o.oppgaver ?? tom(), hendelser: o.hendelser ?? [] }))
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
const lesNokkel = (lager: 'local' | 'session', k: string) => {
  try {
    return (lager === 'local' ? localStorage : sessionStorage).getItem(k)
  } catch {
    return null
  }
}
const settNokkel = (lager: 'local' | 'session', k: string, v: string | null) => {
  try {
    const s = lager === 'local' ? localStorage : sessionStorage
    if (v === null) s.removeItem(k)
    else s.setItem(k, v)
  } catch {
    /* ignorer */
  }
}

export const hentOkter = les

export function slettLogg() {
  skriv([])
  settNokkel('local', AKTIV_NOKKEL, null)
  settNokkel('session', ANONYM_NOKKEL, null)
}

export function nesteId(okter: Okt[]): string {
  const maks = okter.reduce((m, o) => Math.max(m, Number(o.id.replace(/\D/g, '')) || 0), 0)
  return `T${maks + 1}`
}

// ---------- Aktiv økt ----------

/** Aktiv testperson på denne enheten, eller null */
export function aktivTestperson(): Okt | null {
  const id = lesNokkel('local', AKTIV_NOKKEL)
  return (id && les().find((o) => o.uuid === id)) || null
}

/** Økten som hendelser logges til: aktiv testperson, ellers anonym økt for fanen */
function aktivOktUuid(): string | null {
  return lesNokkel('local', AKTIV_NOKKEL) ?? lesNokkel('session', ANONYM_NOKKEL)
}

/** Oppgaven som pågår for en testperson, eller null */
export function pagaendeOppgave(o: Okt | null): OppgaveNr | null {
  if (!o) return null
  return ([1, 2] as const).find((n) => o.oppgaver[n].status === 'pagar') ?? null
}

/** Oppretter neste testperson (T-neste) og gjør den aktiv. Begge oppgavene er ikke_startet. */
export function nyTestperson(variant: 'a' | 'b'): Okt {
  const okter = les()
  const ny: Okt = { uuid: nyUuid(), id: nesteId(okter), start: naa(), test: true, variant, oppgaver: tom(), hendelser: [] }
  skriv([...okter, ny])
  settNokkel('local', AKTIV_NOKKEL, ny.uuid)
  settNokkel('session', ANONYM_NOKKEL, null)
  return ny
}

function oppdaterOkt(uuid: string, fn: (o: Okt) => Okt) {
  skriv(les().map((o) => (o.uuid === uuid ? fn(o) : o)))
}

/** Lager en anonym økt (uten testmodus) ved første hendelse, slik at interne sider ikke gir tomme økter. */
function sikreOkt(): string {
  const id = aktivOktUuid()
  if (id && les().some((o) => o.uuid === id)) return id
  const okter = les()
  const ny: Okt = { uuid: nyUuid(), id: nesteId(okter), start: naa(), test: false, variant: 'a', oppgaver: tom(), hendelser: [] }
  skriv([...okter, ny])
  settNokkel('session', ANONYM_NOKKEL, ny.uuid)
  return ny.uuid
}

export function logg(navn: Hendelse, detalj?: string) {
  const uuid = sikreOkt()
  oppdaterOkt(uuid, (o) => ({ ...o, hendelser: [...o.hendelser, { navn, tid: naa(), detalj, oppgave: pagaendeOppgave(o) }] }))
}

/** Logger bare første gang i økten (f.eks. landing, pakke_vist) */
export function loggEnGang(navn: Hendelse, detalj?: string) {
  const id = aktivOktUuid()
  const o = les().find((x) => x.uuid === id)
  if (!o || !o.hendelser.some((h) => h.navn === navn && h.oppgave === pagaendeOppgave(o))) logg(navn, detalj)
}

// ---------- Oppgaver (tilstandsmaskin) ----------

/** Starter en oppgave for aktiv testperson. Bare fra ikke_startet, og bare når ingen annen oppgave pågår. */
export function startOppgave(n: OppgaveNr): boolean {
  const o = aktivTestperson()
  if (!o || pagaendeOppgave(o) !== null) return false
  const { tilstand, endret } = overgang(o.oppgaver[n], { type: 'start', tid: naa() })
  if (!endret) return false
  oppdaterOkt(o.uuid, (x) => ({ ...x, oppgaver: { ...x.oppgaver, [n]: tilstand } }))
  logg('oppgave_startet', String(n))
  return true
}

function avslutt(type: 'fullfor' | 'avbryt', stoppetVed = ''): OppgaveNr | null {
  const o = aktivTestperson()
  const n = pagaendeOppgave(o)
  if (!o || !n) return null
  const tid = naa()
  const h = type === 'fullfor' ? { type, tid } as const : { type, tid, stoppetVed } as const
  const { tilstand, endret } = overgang(o.oppgaver[n], h)
  if (!endret) return null
  // Hendelsen logges før statusen endres, slik at den knyttes til oppgaven
  logg(type === 'fullfor' ? 'oppgave_fullfort' : 'oppgave_avbrutt', `${tilstand.sekunder ?? 0}s${stoppetVed ? ` · ${stoppetVed}` : ''}`)
  oppdaterOkt(o.uuid, (x) => ({ ...x, oppgaver: { ...x.oppgaver, [n]: tilstand } }))
  return n
}

/** Ferdig: pagar → fullfort */
export const fullforOppgave = () => avslutt('fullfor')

/** Gi opp: pagar → avbrutt, med siste hendelse og side før avbrudd */
export function avbrytOppgave(side: string): OppgaveNr | null {
  const o = aktivTestperson()
  const siste = o?.hendelser.filter((h) => h.oppgave === pagaendeOppgave(o)).at(-1)?.navn ?? 'ingen hendelser'
  return avslutt('avbryt', `${siste} @ ${side}`)
}

export function lagreAvbruddArsak(n: OppgaveNr, arsak: AvbruddArsak, fritekst: string) {
  const o = aktivTestperson()
  if (!o || o.oppgaver[n].status !== 'avbrutt') return
  oppdaterOkt(o.uuid, (x) => ({ ...x, oppgaver: { ...x.oppgaver, [n]: { ...x.oppgaver[n], arsak, arsakFritekst: fritekst } } }))
  logg('avbrudd_besvart', arsak)
}

export function lagreTilbakemelding(n: OppgaveNr | null, t: Tilbakemelding) {
  const o = aktivTestperson()
  if (o && n && erAvsluttet(o.oppgaver[n])) {
    oppdaterOkt(o.uuid, (x) => ({ ...x, oppgaver: { ...x.oppgaver, [n]: { ...x.oppgaver[n], tilbakemelding: t } } }))
  }
  logg('tilbakemelding_sendt', n ? String(n) : undefined)
}

// ---------- Avledede mål (brukes i #/testlogg, #/innsikt og CSV) ----------

export const hoppetOver = (o: Okt) => o.hendelser.some((h) => h.navn === 'veileder_hoppet_over')
export const har = (o: Okt, h: Hendelse) => o.hendelser.some((x) => x.navn === h)
export const komplettOrdre = (o: Okt) => o.hendelser.some((h) => h.navn === 'bestilt' && h.detalj === 'komplett')
export const harAvbrutt = (o: Okt) => o.oppgaver[1].status === 'avbrutt' || o.oppgaver[2].status === 'avbrutt'

/** Siste steg i funnelen personen nådde */
export function stoppetVed(o: Okt): Hendelse | null {
  const nadd = FUNNEL.filter((f) => har(o, f))
  return nadd.length ? nadd[nadd.length - 1] : null
}

export interface OppgaveRad {
  okt: Okt
  testperson: string
  oppgave: OppgaveNr | null
  variant: 'a' | 'b'
  status: TestStatus
  tidSekunder: number | null
  stoppetVed: string
  svar: string
  hendelser: LoggHendelse[]
}

function svarTekst(t: OppgaveTilstand): string {
  const deler: string[] = []
  if (t.arsak) deler.push(`stoppet: ${AVBRUDD_ARSAKER.find((a) => a.verdi === t.arsak)?.tekst ?? t.arsak}${t.arsakFritekst ? ` (${t.arsakFritekst})` : ''}`)
  const tb = t.tilbakemelding
  if (tb) {
    if (tb.trygghet) deler.push(`trygghet ${tb.trygghet}/5`)
    if (tb.unodvendig) deler.push(`unødvendig: ${tb.unodvendig}${tb.unodvendigHva ? ` (${tb.unodvendigHva})` : ''}`)
    if (tb.hjelpEllerMersalg) deler.push(`hjelp vs. mersalg ${tb.hjelpEllerMersalg}/5`)
    if (tb.fritekst) deler.push(`«${tb.fritekst}»`)
  }
  return deler.join(' · ')
}

/** Én rad per testperson og startet oppgave. Anonyme økter med hendelser får én rad uten oppgave. */
export function oppgaveRader(okter: Okt[]): OppgaveRad[] {
  return okter.flatMap((o): OppgaveRad[] => {
    const startet = ([1, 2] as const).filter((n) => o.oppgaver[n].status !== 'ikke_startet')
    if (!startet.length) {
      return o.hendelser.length
        ? [{ okt: o, testperson: o.id, oppgave: null, variant: o.variant, status: 'ikke_startet' as const, tidSekunder: null, stoppetVed: stoppetVed(o) ?? '', svar: '', hendelser: o.hendelser }]
        : []
    }
    return startet.map((n) => {
      const t = o.oppgaver[n]
      const hendelser = o.hendelser.filter((h) => h.oppgave === n)
      const funnel = FUNNEL.filter((f) => hendelser.some((h) => h.navn === f)).at(-1) ?? ''
      return {
        okt: o,
        testperson: o.id,
        oppgave: n,
        variant: o.variant,
        status: t.status,
        tidSekunder: t.sekunder ?? null,
        stoppetVed: t.status === 'avbrutt' ? (t.stoppetVed ?? '') : funnel,
        svar: svarTekst(t),
        hendelser,
      }
    })
  })
}

const csvCelle = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v)
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * CSV med semikolon og BOM (åpnes riktig i norsk Excel). Én rad per testperson og oppgave.
 * Kolonnene: testperson, oppgave, variant, status, tid_sekunder, stoppet_ved, svar + nøkkeltall og hendelsesrekke.
 */
export function tilCsv(okter: Okt[]): string {
  const hode = [
    'testperson', 'oppgave', 'variant', 'status', 'tid_sekunder', 'stoppet_ved', 'svar',
    'veileder_hoppet_over', 'brukte_fagperson', 'komplett_ordre', 'hendelser',
  ]
  const rader = oppgaveRader(okter).map((r) => [
    r.testperson,
    r.oppgave ?? '',
    r.variant,
    STATUS_TEKST[r.status],
    r.tidSekunder ?? '',
    r.stoppetVed,
    r.svar,
    r.hendelser.some((h) => h.navn === 'veileder_hoppet_over') ? 'ja' : 'nei',
    r.hendelser.some((h) => h.navn === 'fagperson_apnet') ? 'ja' : 'nei',
    r.hendelser.some((h) => h.navn === 'bestilt' && h.detalj === 'komplett') ? 'ja' : 'nei',
    r.hendelser.map((h) => h.navn).join(' > '),
  ])
  return '﻿' + [hode, ...rader].map((r) => r.map(csvCelle).join(';')).join('\r\n')
}
