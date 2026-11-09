// Felles backend (Supabase) for testlogg og regler.
// Uten VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY kjører appen som før, med bare localStorage.
// G1: Backenden lagrer data. Den tar ingen beslutninger om kompatibilitet; det gjør fortsatt anbefal().
// G8: Ingen regnr eller personopplysninger sendes.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Regel } from './typer'
import type { Hendelse, LoggHendelse, Okt, Tilbakemelding } from './logg'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const nokkel = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const db: SupabaseClient | null =
  url && nokkel ? createClient(url, nokkel, { auth: { persistSession: false, autoRefreshToken: false } }) : null

export const harBackend = db !== null

// ---------- Regler ----------
interface RegelRad {
  id: string
  merke: string
  modell: string
  ar_fra: number
  ar_til: number
  frontlys: Regel['frontlys']
  canbus: Regel['canbus']
  krever: Regel['krever']
  rele_id: string | null
  kilde: string
  status: Regel['status']
  godkjent_av: string | null
  godkjent_dato: string | null
  merknad: string | null
}

export const regelFraRad = (r: RegelRad): Regel => ({
  id: r.id,
  merke: r.merke,
  modell: r.modell,
  arFra: r.ar_fra,
  arTil: r.ar_til,
  frontlys: r.frontlys,
  canbus: r.canbus,
  krever: r.krever,
  releId: r.rele_id ?? undefined,
  kilde: r.kilde,
  status: r.status,
  godkjentAv: r.godkjent_av ?? undefined,
  godkjentDato: r.godkjent_dato ?? undefined,
  merknad: r.merknad ?? undefined,
})

export const regelTilRad = (r: Regel): RegelRad => ({
  id: r.id,
  merke: r.merke,
  modell: r.modell,
  ar_fra: r.arFra,
  ar_til: r.arTil,
  frontlys: r.frontlys,
  canbus: r.canbus,
  krever: r.krever,
  rele_id: r.releId ?? null,
  kilde: r.kilde,
  status: r.status,
  godkjent_av: r.godkjentAv ?? null,
  godkjent_dato: r.godkjentDato ?? null,
  merknad: r.merknad ?? null,
})

export async function hentRegler(): Promise<Regel[] | null> {
  if (!db) return null
  const { data, error } = await db.from('regler').select('*').order('id')
  if (error) throw error
  return (data as RegelRad[]).map(regelFraRad)
}

/** Lagrer hele regelsettet: oppdaterer/legger til, og sletter regler som er fjernet. */
export async function lagreReglerFelles(regler: Regel[]): Promise<void> {
  if (!db) return
  const { error } = await db.from('regler').upsert(regler.map(regelTilRad))
  if (error) throw error
  const ider = regler.map((r) => r.id)
  const { error: e2 } = await db.from('regler').delete().not('id', 'in', `(${ider.map((i) => `"${i}"`).join(',')})`)
  if (e2) throw e2
}

// ---------- Testlogg ----------
export async function registrerOkt(uuid: string, o: Pick<Okt, 'test' | 'oppgave' | 'variant'>): Promise<string | null> {
  if (!db) return null
  const { data, error } = await db.rpc('ny_okt', { p_id: uuid, p_test: o.test, p_oppgave: o.oppgave, p_variant: o.variant })
  if (error) throw error
  return data as string
}

export async function sendHendelse(uuid: string, h: LoggHendelse): Promise<void> {
  if (!db) return
  const { error } = await db.from('hendelser').insert({ okt_id: uuid, navn: h.navn, detalj: h.detalj ?? null, tid: h.tid })
  if (error) throw error
}

export async function sendAvslutning(uuid: string, type: 'ferdig' | 'gitt_opp'): Promise<void> {
  if (!db) return
  const { error } = await db.rpc('avslutt_okt', { p_id: uuid, p_type: type })
  if (error) throw error
}

export async function sendTilbakemelding(uuid: string, t: Tilbakemelding): Promise<void> {
  if (!db) return
  const { error } = await db.from('tilbakemeldinger').insert({
    okt_id: uuid,
    trygghet: t.trygghet,
    unodvendig: t.unodvendig,
    unodvendig_hva: t.unodvendigHva || null,
    hjelp_mersalg: t.hjelpEllerMersalg,
    fritekst: t.fritekst || null,
  })
  if (error) throw error
}

interface OktRad {
  id: string
  testperson: string
  test: boolean
  oppgave: 1 | 2 | null
  variant: 'a' | 'b'
  start: string
  slutt_type: 'ferdig' | 'gitt_opp' | null
  slutt_tid: string | null
}
interface HendelseRad {
  okt_id: string
  navn: Hendelse
  detalj: string | null
  tid: string
}
interface TilbakemeldingRad {
  okt_id: string
  trygghet: number | null
  unodvendig: 'ja' | 'nei' | null
  unodvendig_hva: string | null
  hjelp_mersalg: number | null
  fritekst: string | null
}

/** Setter sammen rader fra de tre tabellene til samme Okt-form som den lokale loggen. */
export function settSammenOkter(okter: OktRad[], hendelser: HendelseRad[], tb: TilbakemeldingRad[]): Okt[] {
  const nr = (s: string) => Number(s.replace(/\D/g, '')) || 0
  return [...okter]
    .sort((a, b) => nr(a.testperson) - nr(b.testperson))
    .map((o) => {
      const t = tb.find((x) => x.okt_id === o.id)
      return {
        uuid: o.id,
        id: o.testperson,
        start: o.start,
        test: o.test,
        oppgave: o.oppgave,
        variant: o.variant,
        hendelser: hendelser
          .filter((h) => h.okt_id === o.id)
          .sort((a, b) => a.tid.localeCompare(b.tid))
          .map((h) => ({ navn: h.navn, tid: h.tid, detalj: h.detalj ?? undefined })),
        slutt: o.slutt_type && o.slutt_tid ? { type: o.slutt_type, tid: o.slutt_tid } : undefined,
        tilbakemelding: t
          ? {
              trygghet: t.trygghet,
              unodvendig: t.unodvendig,
              unodvendigHva: t.unodvendig_hva ?? '',
              hjelpEllerMersalg: t.hjelp_mersalg,
              fritekst: t.fritekst ?? '',
            }
          : undefined,
      }
    })
}

export async function hentFellesOkter(): Promise<Okt[] | null> {
  if (!db) return null
  const [o, h, t] = await Promise.all([
    db.from('okter').select('*'),
    db.from('hendelser').select('okt_id,navn,detalj,tid').order('tid').limit(10000),
    db.from('tilbakemeldinger').select('*'),
  ])
  const feil = o.error ?? h.error ?? t.error
  if (feil) throw feil
  return settSammenOkter(o.data as OktRad[], h.data as HendelseRad[], t.data as TilbakemeldingRad[])
}
