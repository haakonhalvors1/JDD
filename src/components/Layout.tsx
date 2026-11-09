import { useEffect, useRef, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { avsluttOppgave, aktivTestperson } from '../logic/logg'
import { useApp } from '../state/AppState'
import { FagpersonPanel } from './FagpersonPanel'

export const OPPGAVER: Record<1 | 2, string> = {
  1: 'Kjøp ekstralys med alt som trengs til en Toyota RAV4 2022 (LED-frontlys).',
  2: 'Finn ut hvorfor reléet er med i pakken, og spør en fagperson om du kan montere selv.',
}

function PrototypeStripe() {
  return (
    <div className="bg-proto px-4 py-1.5 text-center text-xs font-semibold text-tekst">
      Prototype · eksempeldata · ingen ekte bestilling
    </div>
  )
}

function TestStripe() {
  const { innst } = useApp()
  const nav = useNavigate()
  const person = aktivTestperson()
  if (!innst.test || !innst.oppgave) return null
  const avslutt = (t: 'ferdig' | 'gitt_opp') => {
    avsluttOppgave(t)
    nav('/tilbakemelding')
  }
  return (
    <section aria-label="Testoppgave" className="border-b-2 border-info bg-info-lys px-4 py-2">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm">
          <span className="font-bold">
            Oppgave {innst.oppgave} ({person ?? '–'}, variant {innst.variant.toUpperCase()}):
          </span>{' '}
          {OPPGAVER[innst.oppgave]}
        </p>
        <div className="flex gap-2">
          <button type="button" className="knapp min-h-9 bg-info py-1.5 text-sm text-white" onClick={() => avslutt('ferdig')}>
            Ferdig
          </button>
          <button type="button" className="knapp min-h-9 border-2 border-info bg-white py-1.5 text-sm text-info" onClick={() => avslutt('gitt_opp')}>
            Gi opp
          </button>
        </div>
      </div>
    </section>
  )
}

function Topp() {
  const { kurv } = useApp()
  const antall = kurv.reduce((s, k) => s + k.antall, 0)
  return (
    <header className="border-b border-linje bg-white">
      <div className="bg-tekst text-white">
        <nav aria-label="Kundetype" className="mx-auto flex max-w-6xl gap-4 px-4 text-sm">
          <span className="border-b-2 border-aksent py-1.5 font-semibold" aria-current="true">
            Privat
          </span>
          <span className="py-1.5 text-gray-300" title="Ikke en del av prototypen">
            Bedrift
          </span>
          <span className="ml-auto hidden py-1.5 text-gray-300 sm:inline">Fri retur ved feil anbefaling*</span>
        </nav>
      </div>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Passer min bil – prototype, til forsiden">
          <span aria-hidden="true" className="grid size-9 place-items-center rounded-md bg-aksent text-lg font-black text-white">
            ✓
          </span>
          <span className="leading-tight">
            <span className="block font-extrabold">Passer min bil</span>
            <span className="block text-xs text-dempet">– prototype</span>
          </span>
        </Link>
        <form role="search" className="ml-2 hidden flex-1 md:block" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="sok" className="sr-only">
            Søk i nettbutikken (ikke aktivt i prototypen)
          </label>
          <input id="sok" type="search" className="felt min-h-10 py-1.5" placeholder="Søk etter produkter (ikke aktivt i prototypen)" />
        </form>
        <Link
          to="/kurv"
          className="relative ml-auto flex min-h-11 items-center gap-2 rounded-md px-2 font-semibold hover:bg-flate"
        >
          <span aria-hidden="true" className="text-2xl">
            🛒
          </span>
          <span className="hidden sm:inline">Handlekurv</span>
          <span className="sr-only">, {antall} varer</span>
          {antall > 0 && (
            <span aria-hidden="true" className="absolute -top-0.5 left-6 grid min-w-5 place-items-center rounded-full bg-aksent px-1 text-xs text-white">
              {antall}
            </span>
          )}
        </Link>
      </div>
      <nav aria-label="Kategorier" className="border-t border-linje">
        <ul className="mx-auto flex max-w-6xl gap-5 overflow-x-auto px-4 text-sm font-semibold whitespace-nowrap">
          <li>
            <Link to="/passer" className="inline-block border-b-2 border-aksent py-2 text-aksent">
              Passer min bil
            </Link>
          </li>
          {['Ekstralys', 'Lysbjelker', 'Bilpleie', 'Tilbehør'].map((k) => (
            <li key={k} className="py-2 text-dempet">
              {k}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}

function Bunn() {
  return (
    <footer className="mt-12 border-t border-linje bg-flate text-sm">
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 sm:grid-cols-2">
        <div>
          <p className="font-bold">Passer min bil – prototype</p>
          <p className="text-dempet">
            IS-219 Digitalisering og tjenestedesign, gruppe 1, UiA høst 2026. Laget for brukertester og visning for JDD Utstyr. Ikke en ekte nettbutikk:
            alle data, varenavn og priser er eksempler.
          </p>
          <p className="mt-2 text-dempet">* Passer-garanti: forslag, avklares med JDD.</p>
          <p className="mt-2 text-xs text-dempet">Lagring: alt lagres bare i denne nettleseren.</p>
        </div>
        <nav aria-label="Interne sider">
          <p className="font-bold">Interne sider (prototype)</p>
          <ul className="mt-1 space-y-1">
            <li><Link className="knapp-lenke min-h-0" to="/fagperson">Fagperson: regler og datakvalitet</Link></li>
            <li><Link className="knapp-lenke min-h-0" to="/innsikt">Kundesenter: innsikt</Link></li>
            <li><Link className="knapp-lenke min-h-0" to="/testlogg">Testlogg</Link></li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const hoved = useRef<HTMLElement>(null)
  // Ved sidebytte: til toppen og fokus på hovedinnholdet (skjermleser)
  useEffect(() => {
    window.scrollTo(0, 0)
    hoved.current?.focus({ preventScroll: true })
  }, [pathname])
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#hoved" onClick={(e) => { e.preventDefault(); hoved.current?.focus() }} className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-2">
        Hopp til innhold
      </a>
      <PrototypeStripe />
      <TestStripe />
      <Topp />
      <main id="hoved" ref={hoved} tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 outline-none">
        {children}
      </main>
      <Bunn />
      <FagpersonPanel />
    </div>
  )
}
