// Simulert regnr-oppslag (eksempeldata). I en ekte løsning: kjøretøyoppslag, som må avklares med JDD.
import type { Bil } from './typer'

/** «pm 22 022» → «PM22022» */
export function normaliserRegnr(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase()
}

/** «PM22022» → «PM 22022» for visning */
export function visRegnr(regnr: string): string {
  const n = normaliserRegnr(regnr)
  return n.length > 2 ? `${n.slice(0, 2)} ${n.slice(2)}` : n
}

export function erGyldigRegnr(input: string): boolean {
  return /^[A-Z]{2}\d{4,5}$/.test(normaliserRegnr(input))
}

export function slaOppRegnr(input: string, kjoretoy: (Bil & { regnr: string })[]): Bil | null {
  const n = normaliserRegnr(input)
  const k = kjoretoy.find((x) => x.regnr === n)
  return k ? { merke: k.merke, modell: k.modell, ar: k.ar, regnr: k.regnr } : null
}
