// K1: oppgi regnr eller merke/modell/år
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { kjoretoy } from '../logic/data'
import { arFor, merker, modellerFor, populaereModeller, type Velger, type VelgerHandling } from '../logic/bilvelger'
import { logg } from '../logic/logg'
import { erGyldigRegnr, slaOppRegnr, visRegnr } from '../logic/regnr'
import { useApp } from '../state/AppState'
import { FagpersonKnapp } from './Felles'

export function RegnrSkjema({ autofokus, kompakt }: { autofokus?: boolean; kompakt?: boolean }) {
  const { settBil, garasje } = useApp()
  const nav = useNavigate()
  const [regnr, setRegnr] = useState('')
  const [feil, setFeil] = useState<string | null>(null)
  const [ikkeFunnet, setIkkeFunnet] = useState(false)

  const sok = (verdi: string) => {
    setIkkeFunnet(false)
    if (!erGyldigRegnr(verdi)) {
      setFeil('Skriv inn et registreringsnummer, for eksempel PM 22022 (to bokstaver og fire eller fem tall).')
      return
    }
    setFeil(null)
    const bil = slaOppRegnr(verdi, kjoretoy)
    if (!bil) {
      setIkkeFunnet(true)
      return
    }
    settBil(bil)
    nav('/passer/bil')
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          sok(regnr)
        }}
        noValidate
      >
        <label htmlFor="regnr" className={`mb-1 block font-semibold ${kompakt ? 'text-sm' : ''}`}>
          Registreringsnummer
        </label>
        <div className="flex gap-2">
          <div className="flex flex-1 overflow-hidden rounded-md border-2 border-tekst focus-within:outline-3 focus-within:outline-info">
            <span aria-hidden="true" className="flex w-9 flex-col items-center justify-end bg-[#003399] pb-1 text-[10px] font-bold text-white">
              N
            </span>
            <input
              id="regnr"
              value={regnr}
              onChange={(e) => setRegnr(e.target.value)}
              autoFocus={autofokus}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              inputMode="text"
              placeholder="AB 12345"
              aria-invalid={feil ? true : undefined}
              aria-describedby={`regnr-hjelp${feil ? ' regnr-feil' : ''}`}
              className="min-h-12 w-full px-3 text-xl font-bold tracking-widest uppercase outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-dempet"
            />
          </div>
          <button type="submit" className="knapp-primar shrink-0">
            Finn bilen
          </button>
        </div>
        <p id="regnr-hjelp" className="mt-1 text-xs text-dempet">
          Prototype: prøv testskiltene PM 22022, PM 12012 eller PM 19019. Vi lagrer ikke regnr uten at du ber om det.
        </p>
        {feil && (
          <p id="regnr-feil" role="alert" className="mt-2 text-sm font-semibold text-aksent">
            {feil}
          </p>
        )}
      </form>

      {ikkeFunnet && (
        <div role="status" className="mt-3 rounded-lg border-2 border-varsel bg-varsel-lys p-3 text-sm">
          <p className="font-semibold">Vi fant ikke {visRegnr(regnr)} i oppslaget.</p>
          <p className="mt-1">Du kan velge merke, modell og år i stedet, eller spørre en fagperson.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="knapp-sekundar min-h-10 py-2 text-sm" onClick={() => nav('/passer?modell=1')}>
              Velg merke og modell
            </button>
            <FagpersonKnapp fra="regnr_ikke_funnet" variant="lenke" />
          </div>
        </div>
      )}

      {garasje && (
        <p className="mt-3 text-sm">
          Min garasje:{' '}
          <button type="button" className="knapp-lenke min-h-0" onClick={() => sok(garasje.regnr)}>
            Bruk {garasje.merke} {garasje.modell} {garasje.ar} ({visRegnr(garasje.regnr)})
          </button>
        </p>
      )}
    </div>
  )
}

/** K1: Merke → modell → år. Kontrollert av forelderen (useReducer med velgerReducer). */
export function ModellVelger({ velger, endre }: { velger: Velger; endre: (h: VelgerHandling) => void }) {
  const modeller = modellerFor(velger.merke)
  const ar = arFor(velger.merke, velger.modell)
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div>
        <label htmlFor="merke" className="mb-1 block font-semibold">Merke</label>
        <select id="merke" className="felt" value={velger.merke} onChange={(e) => endre({ type: 'merke', verdi: e.target.value })}>
          <option value="">Velg merke</option>
          {merker().map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="modell" className="mb-1 block font-semibold">Modell</label>
        <select id="modell" className="felt" value={velger.modell} disabled={!velger.merke} onChange={(e) => endre({ type: 'modell', verdi: e.target.value })}>
          <option value="">Velg modell</option>
          {modeller.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="ar" className="mb-1 block font-semibold">Årsmodell</label>
        <select id="ar" className="felt" value={velger.ar} disabled={!velger.modell} onChange={(e) => endre({ type: 'ar', verdi: e.target.value })}>
          <option value="">Velg år</option>
          {ar.map((a) => <option key={a}>{a}</option>)}
        </select>
      </div>
    </div>
  )
}

/** «Populære bilmodeller», generert fra kjoretoy.json. Et trykk fyller ut velgeren på #/passer. */
export function PopulaereModeller({ tittelNiva = 'h2' }: { tittelNiva?: 'h2' | 'h3' }) {
  const nav = useNavigate()
  const Tittel = tittelNiva
  return (
    <section aria-labelledby="populaere">
      <Tittel id="populaere" className={tittelNiva === 'h2' ? 'h2 mb-3' : 'h3 mb-2'}>
        Populære bilmodeller
      </Tittel>
      <ul className="flex flex-wrap gap-2">
        {populaereModeller().map((p) => (
          <li key={p.tekst}>
            <button
              type="button"
              className="knapp-sekundar min-h-10 py-2 text-sm"
              onClick={() => {
                logg('populaer_modell_valgt', p.tekst)
                nav(`/passer?${new URLSearchParams({ merke: p.merke, modell: p.modell, ar: String(p.ar) })}`)
              }}
            >
              {p.tekst}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
