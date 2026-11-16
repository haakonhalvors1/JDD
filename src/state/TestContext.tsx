// Testmodus: én tydelig tilstand per testperson og oppgave (ikke_startet → pagar → fullfort | avbrutt).
// Testlinjen vises bare når en oppgave pågår. Avsluttede oppgaver kan ikke startes på nytt for samme testperson.
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import * as L from '../logic/logg'
import type { Okt, OppgaveNr } from '../logic/logg'

interface TestCtx {
  testperson: Okt | null
  /** Oppgaven som pågår (testlinjen vises), eller null */
  aktivOppgave: OppgaveNr | null
  /** Sist avsluttede oppgave for aktiv testperson (brukes på tilbakemeldingssiden) */
  sisteAvsluttet: OppgaveNr | null
  variant: 'a' | 'b'
  startOppgave: (n: OppgaveNr) => boolean
  fullfor: () => OppgaveNr | null
  avbryt: (side: string) => OppgaveNr | null
  nyTestperson: (variant: 'a' | 'b') => Okt
  oppdater: () => void
}

const Ctx = createContext<TestCtx | null>(null)

/** Leser parametre både før og etter # (…/?test=1#/ og …/#/?test=1) */
function lesUrl() {
  const fraHash = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : ''
  return new URLSearchParams(window.location.search + '&' + fraHash)
}

/** Fjerner test-parametrene fra adressen (uten omlasting) */
export function fjernTestParametre() {
  const p = lesUrl()
  if (!['test', 'oppgave', 'variant'].some((k) => p.has(k))) return
  const hash = window.location.hash.split('?')[0]
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${hash}`)
}

/**
 * Oppstart fra lenke (?test=1&oppgave=1&variant=a):
 * - uten aktiv testperson: oppretter ny testperson og starter oppgaven,
 * - med aktiv testperson: starter oppgaven bare hvis den ikke er startet før (og ingen annen pågår).
 * En fullført eller avbrutt oppgave startes aldri på nytt, selv om ?test=1 står i adressen.
 */
function startFraUrl() {
  const p = lesUrl()
  const urlVariant = p.get('variant') === 'b' ? 'b' : p.get('variant') === 'a' ? 'a' : null
  if (urlVariant) {
    try {
      sessionStorage.setItem('pmb.variant', urlVariant)
    } catch {
      /* ignorer */
    }
  }
  if (p.get('test') !== '1') return
  const n = p.get('oppgave') === '2' ? 2 : 1
  const aktiv = L.aktivTestperson()
  if (!aktiv) L.nyTestperson(urlVariant ?? 'a')
  L.startOppgave(n)
  if (!L.pagaendeOppgave(L.aktivTestperson())) fjernTestParametre()
}

function sisteAvsluttetFor(o: Okt | null): OppgaveNr | null {
  if (!o) return null
  const avsluttet = ([1, 2] as const).filter((n) => o.oppgaver[n].avsluttet)
  avsluttet.sort((a, b) => (o.oppgaver[b].avsluttet ?? '').localeCompare(o.oppgaver[a].avsluttet ?? ''))
  return avsluttet[0] ?? null
}

export function TestProvider({ children }: { children: ReactNode }) {
  const [testperson, setTestperson] = useState<Okt | null>(() => {
    startFraUrl()
    return L.aktivTestperson()
  })
  const oppdater = useCallback(() => setTestperson(L.aktivTestperson()), [])

  const startOppgave = useCallback(
    (n: OppgaveNr) => {
      const ok = L.startOppgave(n)
      oppdater()
      return ok
    },
    [oppdater],
  )
  const fullfor = useCallback(() => {
    const n = L.fullforOppgave()
    fjernTestParametre()
    oppdater()
    return n
  }, [oppdater])
  const avbryt = useCallback(
    (side: string) => {
      const n = L.avbrytOppgave(side)
      fjernTestParametre()
      oppdater()
      return n
    },
    [oppdater],
  )
  const nyTestperson = useCallback(
    (variant: 'a' | 'b') => {
      const o = L.nyTestperson(variant)
      oppdater()
      return o
    },
    [oppdater],
  )

  let lagretVariant: 'a' | 'b' | null = null
  try {
    const v = sessionStorage.getItem('pmb.variant')
    lagretVariant = v === 'a' || v === 'b' ? v : null
  } catch {
    /* ignorer */
  }

  const verdi: TestCtx = {
    testperson,
    aktivOppgave: L.pagaendeOppgave(testperson),
    sisteAvsluttet: sisteAvsluttetFor(testperson),
    variant: testperson?.variant ?? lagretVariant ?? 'a',
    startOppgave,
    fullfor,
    avbryt,
    nyTestperson,
    oppdater,
  }
  return <Ctx.Provider value={verdi}>{children}</Ctx.Provider>
}

export function useTest(): TestCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useTest må brukes inne i TestProvider')
  return c
}
