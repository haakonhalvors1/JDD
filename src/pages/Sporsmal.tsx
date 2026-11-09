// K5: tre konkrete spørsmål med valgknapper, ingen fritekst. «Hopp over» (A2).
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Brodsmuler, FagpersonKnapp, StatusMerke, Utvid } from '../components/Felles'
import { Brakett, Kabel, Lampe } from '../components/Illustrasjoner'
import { sporsmal } from '../logic/data'
import type { Svar } from '../logic/typer'
import { useApp } from '../state/AppState'

const BILDE = { lamper: Lampe, feste: Brakett, kontakt: Kabel }

export function SporsmalSide() {
  const { bil, bilBekreftet, resultat, svar, settSvar, fullforSporsmal } = useApp()
  const nav = useNavigate()
  const [nr, setNr] = useState(0)
  if (!bil || !bilBekreftet || resultat.status === 'ukjent') return <Navigate to={bil ? '/passer/bil' : '/passer'} replace />

  const s = sporsmal[nr]
  const id = s.id as keyof Svar
  const Bilde = BILDE[id]
  const sist = nr === sporsmal.length - 1

  const hoppOver = () => {
    fullforSporsmal(true)
    nav('/passer/pakke')
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Brodsmuler steg={2} />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-2">
          {bil.merke} {bil.modell} {bil.ar} <StatusMerke status={resultat.status} />
        </span>
        <button type="button" className="knapp-lenke" onClick={hoppOver}>
          Hopp over, jeg vet hva jeg vil ha →
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (sist) {
            fullforSporsmal(false)
            nav('/passer/pakke')
          } else setNr(nr + 1)
        }}
        className="kort"
      >
        <p className="text-sm font-semibold text-dempet" aria-live="polite">
          Spørsmål {nr + 1} av {sporsmal.length}
        </p>
        <div className="my-2 h-2 rounded-full bg-flate" aria-hidden="true">
          <div className="h-2 rounded-full bg-aksent transition-all" style={{ width: `${((nr + 1) / sporsmal.length) * 100}%` }} />
        </div>

        <fieldset>
          <legend className="h2 mb-3">{s.tittel}</legend>
          <div className="grid gap-2">
            {s.valg.map((v) => {
              const valgt = String(svar[id]) === String(v.verdi)
              return (
                <label
                  key={String(v.verdi)}
                  className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border-2 p-3 ${valgt ? 'border-aksent bg-aksent-lys' : 'border-linje hover:border-dempet'}`}
                >
                  <input
                    type="radio"
                    name={s.id}
                    value={String(v.verdi)}
                    checked={valgt}
                    onChange={() => settSvar({ [id]: v.verdi } as Partial<Svar>)}
                    className="size-5 shrink-0 accent-aksent"
                  />
                  <span>
                    <span className="block font-bold">{v.tekst}</span>
                    <span className="block text-sm text-dempet">{v.under}</span>
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <Utvid tittel="Hva betyr dette?" ikon="ⓘ" className="mt-3">
          <div className="flex gap-3 rounded-md bg-info-lys p-3 text-sm">
            <Bilde className="w-24 shrink-0" />
            <p>{s.hjelp}</p>
          </div>
        </Utvid>

        <div className="mt-4 flex gap-2">
          {nr > 0 && (
            <button type="button" className="knapp-sekundar" onClick={() => setNr(nr - 1)}>
              ← Tilbake
            </button>
          )}
          <button type="submit" className="knapp-primar flex-1">
            {sist ? 'Vis pakken min' : 'Neste'}
          </button>
        </div>
      </form>

      <div className="mt-4">
        <FagpersonKnapp fra="sporsmal" variant="lenke" />
      </div>
    </div>
  )
}
