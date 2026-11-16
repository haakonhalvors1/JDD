// K1/G2/A1: «Toyota RAV4 2022 – stemmer det?» med status (Bekreftet/Regelutledet/Ukjent) før kunden svarer.
// Ved Ukjent stilles «Har bilen LED-frontlys?» med en gang: svaret bekrefter bilen og gir Regelutledet.
import { useNavigate } from 'react-router-dom'
import { visRegnr } from '../logic/regnr'
import type { LedSvar } from '../logic/typer'
import { useApp } from '../state/AppState'
import { StatusMerke } from './Felles'
import { Frontlys } from './Illustrasjoner'

/** «Har bilen LED-frontlys?» med bilde (brukes ved status Ukjent) */
export function LedSporsmal({ vedSvar, tittelNiva = 'h2' }: { vedSvar: (s: Exclude<LedSvar, null>) => void; tittelNiva?: 'h2' | 'h3' }) {
  return (
    <fieldset>
      <legend className={`${tittelNiva === 'h2' ? 'h2' : 'h3'} mb-3`}>Har bilen LED-frontlys?</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ['ja', 'Ja, LED', 'Smale lysstriper eller flere små, hvite lysflater', 'LED'],
            ['nei', 'Nei, halogen', 'Én stor, rund reflektor med gulaktig pære', 'halogen'],
          ] as const
        ).map(([v, t, b, type]) => (
          <button key={v} type="button" onClick={() => vedSvar(v)} className="kort text-left hover:border-aksent focus-visible:border-aksent">
            <Frontlys type={type} className="mb-2 w-full" tittel={`Illustrasjon av ${type === 'LED' ? 'LED-frontlys' : 'halogen-frontlys'}`} />
            <span className="block font-bold">{t}</span>
            <span className="block text-sm text-dempet">{b}</span>
          </button>
        ))}
      </div>
      <button type="button" className="knapp-sekundar mt-3 w-full" onClick={() => vedSvar('vet_ikke')}>
        Vet ikke
      </button>
    </fieldset>
  )
}

export function BilBekreftelse({ tittelNiva = 'h1', vedNei }: { tittelNiva?: 'h1' | 'h2'; vedNei: () => void }) {
  const { bil, resultat, bekreftBil, settLedSvar } = useApp()
  const nav = useNavigate()
  if (!bil) return null
  const Tittel = tittelNiva
  const bilnavn = `${bil.merke} ${bil.modell} ${bil.ar}`
  const ukjent = resultat.status === 'ukjent'

  const nei = (
    <button type="button" className="knapp-sekundar" onClick={vedNei}>
      Nei, velg en annen bil
    </button>
  )

  return (
    <section aria-labelledby="bil-bekreft" aria-live="polite" className={`kort ${ukjent ? 'border-2 border-varsel' : 'border-2 border-tekst'}`}>
      {bil.regnr && <p className="text-sm text-dempet">Registreringsnummer {visRegnr(bil.regnr)}</p>}
      <Tittel id="bil-bekreft" className={`${tittelNiva === 'h1' ? 'h1' : 'h2'} mt-1`}>
        {bilnavn} – stemmer det?
      </Tittel>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <StatusMerke status={resultat.status} />
        <span>
          {resultat.status === 'bekreftet'
            ? 'Vi kjenner oppsettet for denne bilen fra modelltabellen.'
            : resultat.begrunnelse}
        </span>
      </p>

      {ukjent ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm">Stemmer bilen? Svar på ett spørsmål, så finner vi ut hva som trengs.</p>
          <LedSporsmal
            tittelNiva={tittelNiva === 'h1' ? 'h2' : 'h3'}
            vedSvar={(s) => {
              bekreftBil()
              settLedSvar(s)
              nav('/passer/bil')
            }}
          />
          {nei}
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="knapp-primar"
            onClick={() => {
              bekreftBil()
              nav('/passer/bil')
            }}
          >
            Ja, det er bilen min
          </button>
          {nei}
        </div>
      )}
    </section>
  )
}
