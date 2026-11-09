import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { anbefal } from '../logic/anbefal'
import { produkter, standardRegeldata, standardsvar } from '../logic/data'
import { logg, sikreOkt } from '../logic/logg'
import type { Bil, LedSvar, Regel, Regeldata, Resultat, Svar } from '../logic/typer'

// ---------- Testinnstillinger fra URL (?test=1&variant=b&oppgave=2) ----------
export interface Innstillinger {
  test: boolean
  variant: 'a' | 'b'
  oppgave: 1 | 2 | null
}

function lesInnstillinger(): Innstillinger {
  // Støtter parametre både før og etter # (…/?test=1#/ og …/#/?test=1)
  const fraHash = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : ''
  const p = new URLSearchParams(window.location.search + '&' + fraHash)
  let lagret: Partial<Innstillinger> = {}
  try {
    lagret = JSON.parse(sessionStorage.getItem('pmb.innst') ?? '{}')
  } catch {
    /* ignorer */
  }
  const test = p.has('test') ? p.get('test') === '1' : (lagret.test ?? false)
  const variant = p.get('variant') === 'b' ? 'b' : p.get('variant') === 'a' ? 'a' : (lagret.variant ?? 'a')
  const oppg = p.get('oppgave')
  const oppgave = oppg === '2' ? 2 : oppg === '1' ? 1 : (lagret.oppgave ?? (test ? 1 : null))
  const innst: Innstillinger = { test, variant, oppgave }
  try {
    sessionStorage.setItem('pmb.innst', JSON.stringify(innst))
  } catch {
    /* ignorer */
  }
  return innst
}

// ---------- Kurv ----------
export interface KurvLinje {
  produktId: string
  antall: number
  /** G5: «trengs» (fra pakken) eller «ofte» (valgfritt tilbehør) */
  type: 'trengs' | 'ofte'
}

// ---------- Lagring ----------
const REGLER_NOKKEL = 'pmb.regler'
const GARASJE_NOKKEL = 'pmb.garasje'
const OKT_TILSTAND = 'pmb.tilstand'

function lesRegeldata(): Regeldata {
  try {
    const r = localStorage.getItem(REGLER_NOKKEL)
    if (r) return { ...standardRegeldata, regler: JSON.parse(r) as Regel[] }
  } catch {
    /* ignorer */
  }
  return standardRegeldata
}

interface Tilstand {
  bil: Bil | null
  bilBekreftet: boolean
  ledSvar: LedSvar
  svar: Svar
  harSvart: boolean
  hoppetOver: boolean
  kurv: KurvLinje[]
  valgtPakke: 'basis' | 'anbefalt' | null
}

const tomTilstand: Tilstand = {
  bil: null,
  bilBekreftet: false,
  ledSvar: null,
  svar: standardsvar,
  harSvart: false,
  hoppetOver: false,
  kurv: [],
  valgtPakke: null,
}

function lesTilstand(): Tilstand {
  try {
    const t = sessionStorage.getItem(OKT_TILSTAND)
    if (t) return { ...tomTilstand, ...(JSON.parse(t) as Tilstand) }
  } catch {
    /* ignorer */
  }
  return tomTilstand
}

export interface Garasje {
  regnr: string
  merke: string
  modell: string
  ar: number
}

interface Ctx extends Tilstand {
  innst: Innstillinger
  regeldata: Regeldata
  resultat: Resultat
  garasje: Garasje | null
  fagpersonApen: boolean
  settBil: (bil: Bil | null) => void
  bekreftBil: () => void
  settLedSvar: (s: LedSvar) => void
  settSvar: (s: Partial<Svar>) => void
  fullforSporsmal: (hoppet: boolean) => void
  leggPakkeIKurv: (niva: 'basis' | 'anbefalt') => void
  leggTilOfte: (produktId: string) => void
  fjernFraKurv: (produktId: string) => void
  tomKurv: () => void
  lagreRegler: (regler: Regel[]) => void
  tilbakestillRegler: () => void
  lagreIGarasje: () => void
  glemGarasje: () => void
  apneFagperson: (fra: string) => void
  lukkFagperson: () => void
  nullstill: () => void
}

const AppCtx = createContext<Ctx | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  // Økten opprettes før barna logger (f.eks. «landing»)
  const [innst] = useState(() => {
    const i = lesInnstillinger()
    sikreOkt(i)
    return i
  })
  const [t, setT] = useState<Tilstand>(lesTilstand)
  const [regeldata, setRegeldata] = useState<Regeldata>(lesRegeldata)
  const [fagpersonApen, setFagpersonApen] = useState(false)
  const [garasje, setGarasje] = useState<Garasje | null>(() => {
    try {
      return JSON.parse(localStorage.getItem(GARASJE_NOKKEL) ?? 'null')
    } catch {
      return null
    }
  })

  // G8: Regnr lagres ikke uten samtykke. Øktstilstanden lagres uten regnr.
  useEffect(() => {
    try {
      const { bil, ...resten } = t
      const utenRegnr = bil ? { merke: bil.merke, modell: bil.modell, ar: bil.ar } : null
      sessionStorage.setItem(OKT_TILSTAND, JSON.stringify({ ...resten, bil: utenRegnr }))
    } catch {
      /* ignorer */
    }
  }, [t])

  const resultat = useMemo(
    () => anbefal({ bil: t.bil, ledSvar: t.ledSvar, svar: t.svar, regeldata, produkter }),
    [t.bil, t.ledSvar, t.svar, regeldata],
  )

  const settBil = useCallback((bil: Bil | null) => {
    setT((s) => ({ ...s, bil, bilBekreftet: false, ledSvar: null }))
  }, [])

  const bekreftBil = useCallback(() => {
    setT((s) => ({ ...s, bilBekreftet: true }))
    logg('bil_bekreftet')
  }, [])

  const settLedSvar = useCallback((ledSvar: LedSvar) => {
    setT((s) => ({ ...s, ledSvar }))
    if (ledSvar) logg('led_besvart', ledSvar)
  }, [])

  const settSvar = useCallback((svar: Partial<Svar>) => {
    setT((s) => ({ ...s, svar: { ...s.svar, ...svar } }))
  }, [])

  const fullforSporsmal = useCallback((hoppet: boolean) => {
    if (hoppet) {
      setT((s) => ({ ...s, svar: standardsvar, harSvart: true, hoppetOver: true }))
      logg('veileder_hoppet_over')
    } else {
      setT((s) => ({ ...s, harSvart: true }))
      logg('sporsmal_ferdig')
    }
  }, [])

  const leggPakkeIKurv = useCallback(
    (niva: 'basis' | 'anbefalt') => {
      const pakke = resultat.pakker?.[niva]
      if (!pakke) return
      setT((s) => ({
        ...s,
        valgtPakke: niva,
        // Erstatter tidligere pakke, men beholder valgt tilbehør
        kurv: [
          ...pakke.linjer.map((l) => ({ produktId: l.produkt.id, antall: l.antall, type: 'trengs' as const })),
          ...s.kurv.filter((k) => k.type === 'ofte'),
        ],
      }))
      logg('lagt_i_kurv', niva)
    },
    [resultat],
  )

  const leggTilOfte = useCallback((produktId: string) => {
    setT((s) =>
      s.kurv.some((k) => k.produktId === produktId)
        ? s
        : { ...s, kurv: [...s.kurv, { produktId, antall: 1, type: 'ofte' }] },
    )
    logg('lagt_i_kurv', produktId)
  }, [])

  const fjernFraKurv = useCallback((produktId: string) => {
    setT((s) => ({ ...s, kurv: s.kurv.filter((k) => k.produktId !== produktId) }))
  }, [])

  const tomKurv = useCallback(() => setT((s) => ({ ...s, kurv: [], valgtPakke: null })), [])

  const lagreRegler = useCallback((regler: Regel[]) => {
    setRegeldata((r) => ({ ...r, regler }))
    try {
      localStorage.setItem(REGLER_NOKKEL, JSON.stringify(regler))
    } catch {
      /* ignorer */
    }
  }, [])

  const tilbakestillRegler = useCallback(() => {
    setRegeldata(standardRegeldata)
    try {
      localStorage.removeItem(REGLER_NOKKEL)
    } catch {
      /* ignorer */
    }
  }, [])

  // K1/G8: bare ved eksplisitt samtykke
  const lagreIGarasje = useCallback(() => {
    if (!t.bil?.regnr) return
    const g = { regnr: t.bil.regnr, merke: t.bil.merke, modell: t.bil.modell, ar: t.bil.ar }
    setGarasje(g)
    try {
      localStorage.setItem(GARASJE_NOKKEL, JSON.stringify(g))
    } catch {
      /* ignorer */
    }
  }, [t.bil])

  const glemGarasje = useCallback(() => {
    setGarasje(null)
    try {
      localStorage.removeItem(GARASJE_NOKKEL)
    } catch {
      /* ignorer */
    }
  }, [])

  const apneFagperson = useCallback((fra: string) => {
    setFagpersonApen(true)
    logg('fagperson_apnet', fra)
  }, [])
  const lukkFagperson = useCallback(() => setFagpersonApen(false), [])
  const nullstill = useCallback(() => setT(tomTilstand), [])

  const verdi: Ctx = {
    ...t,
    innst,
    regeldata,
    resultat,
    garasje,
    fagpersonApen,
    settBil,
    bekreftBil,
    settLedSvar,
    settSvar,
    fullforSporsmal,
    leggPakkeIKurv,
    leggTilOfte,
    fjernFraKurv,
    tomKurv,
    lagreRegler,
    tilbakestillRegler,
    lagreIGarasje,
    glemGarasje,
    apneFagperson,
    lukkFagperson,
    nullstill,
  }
  return <AppCtx.Provider value={verdi}>{children}</AppCtx.Provider>
}

export function useApp(): Ctx {
  const c = useContext(AppCtx)
  if (!c) throw new Error('useApp må brukes inne i AppStateProvider')
  return c
}

/** Variant-tekster for brukertesten (?variant=a|b) */
export function overskrifter(variant: 'a' | 'b') {
  return variant === 'a'
    ? { trengs: 'Trengs for å fungere', ofte: 'Ofte kjøpt sammen' }
    : { trengs: 'Ofte kjøpt sammen', ofte: 'Andre kjøpte også' }
}
