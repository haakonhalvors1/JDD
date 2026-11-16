// K1: Bilvelger (merke → modell → år) og «Populære bilmodeller». Rene funksjoner, testet i bilvelger.test.ts.
import { kjoretoy, modellvelger } from './data'
import type { Bil } from './typer'

export interface Velger {
  merke: string
  modell: string
  ar: string
}

export type VelgerHandling =
  | { type: 'merke'; verdi: string }
  | { type: 'modell'; verdi: string }
  | { type: 'ar'; verdi: string }
  | { type: 'fyll'; merke: string; modell: string; ar: number | string }
  | { type: 'nullstill' }

export const tomVelger: Velger = { merke: '', modell: '', ar: '' }

export const merker = (): string[] => modellvelger.map((m) => m.merke)

/** Modellene for et merke (tom liste uten merke) */
export function modellerFor(merke: string): string[] {
  return modellvelger.find((m) => m.merke === merke)?.modeller.map((m) => m.navn) ?? []
}

/** Årene for en modell, nyeste først (tom liste uten gyldig modell) */
export function arFor(merke: string, modell: string): number[] {
  const m = modellvelger.find((x) => x.merke === merke)?.modeller.find((x) => x.navn === modell)
  if (!m) return []
  return Array.from({ length: m.arTil - m.arFra + 1 }, (_, i) => m.arTil - i)
}

/**
 * Overganger i velgeren. Bytte av merke nullstiller modell og år. Bytte av modell nullstiller år.
 * «fyll» setter alle tre (fra populær modell), men bare med verdier som finnes i listene.
 */
export function velgerReducer(s: Velger, h: VelgerHandling): Velger {
  switch (h.type) {
    case 'merke':
      return h.verdi === s.merke ? s : { merke: h.verdi, modell: '', ar: '' }
    case 'modell':
      return h.verdi === s.modell ? s : { ...s, modell: modellerFor(s.merke).includes(h.verdi) ? h.verdi : '', ar: '' }
    case 'ar':
      return { ...s, ar: arFor(s.merke, s.modell).includes(Number(h.verdi)) ? String(h.verdi) : '' }
    case 'fyll': {
      if (!merker().includes(h.merke)) return tomVelger
      if (!modellerFor(h.merke).includes(h.modell)) return { merke: h.merke, modell: '', ar: '' }
      const ar = arFor(h.merke, h.modell).includes(Number(h.ar)) ? String(h.ar) : ''
      return { merke: h.merke, modell: h.modell, ar }
    }
    case 'nullstill':
      return tomVelger
  }
}

export const erKomplett = (v: Velger) => Boolean(v.merke && v.modell && v.ar)
export const velgerTilBil = (v: Velger): Bil | null => (erKomplett(v) ? { merke: v.merke, modell: v.modell, ar: Number(v.ar) } : null)

export interface PopulaerModell {
  merke: string
  modell: string
  ar: number
  tekst: string
}

/** «Populære bilmodeller» generert fra kjoretoy.json, sortert etter feltet «populaer» (RAV4 2022 først). */
export function populaereModeller(): PopulaerModell[] {
  return kjoretoy
    .filter((k) => typeof k.populaer === 'number')
    .sort((a, b) => (a.populaer ?? 0) - (b.populaer ?? 0))
    .map((k) => ({ merke: k.merke, modell: k.modell, ar: k.ar, tekst: `${k.merke} ${k.modell} ${k.ar}` }))
}
