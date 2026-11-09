// K1: oppgi regnr eller merke/modell/år
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { arsintervall, kjoretoy, modellvelger } from '../logic/data'
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
          <span aria-hidden="true">🚗</span> Min garasje:{' '}
          <button type="button" className="knapp-lenke min-h-0" onClick={() => sok(garasje.regnr)}>
            Bruk {garasje.merke} {garasje.modell} {garasje.ar} ({visRegnr(garasje.regnr)})
          </button>
        </p>
      )}
    </div>
  )
}

export function ModellVelger() {
  const { settBil } = useApp()
  const nav = useNavigate()
  const [merke, setMerke] = useState('')
  const [modell, setModell] = useState('')
  const [ar, setAr] = useState('')
  const modeller = modellvelger.find((m) => m.merke === merke)?.modeller ?? []
  const ar_ = Array.from({ length: arsintervall.til - arsintervall.fra + 1 }, (_, i) => arsintervall.til - i)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!merke || !modell || !ar) return
        settBil({ merke, modell, ar: Number(ar) })
        nav('/passer/bil')
      }}
      className="grid gap-3 sm:grid-cols-3"
    >
      <div>
        <label htmlFor="merke" className="mb-1 block font-semibold">Merke</label>
        <select id="merke" className="felt" value={merke} onChange={(e) => { setMerke(e.target.value); setModell('') }}>
          <option value="">Velg merke</option>
          {modellvelger.map((m) => <option key={m.merke}>{m.merke}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="modell" className="mb-1 block font-semibold">Modell</label>
        <select id="modell" className="felt" value={modell} disabled={!merke} onChange={(e) => setModell(e.target.value)}>
          <option value="">Velg modell</option>
          {modeller.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="ar" className="mb-1 block font-semibold">Årsmodell</label>
        <select id="ar" className="felt" value={ar} disabled={!modell} onChange={(e) => setAr(e.target.value)}>
          <option value="">Velg år</option>
          {ar_.map((a) => <option key={a}>{a}</option>)}
        </select>
      </div>
      <button type="submit" className="knapp-primar sm:col-span-3 sm:justify-self-start" disabled={!merke || !modell || !ar}>
        Velg denne bilen
      </button>
    </form>
  )
}
