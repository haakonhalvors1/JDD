// Start: regnr eller merke/modell/år (K1, A4)
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ModellVelger, RegnrSkjema } from '../components/BilSkjema'
import { Brodsmuler } from '../components/Felles'
import { loggEnGang } from '../logic/logg'

export function Passer() {
  const [sp] = useSearchParams()
  const [modus, setModus] = useState<'regnr' | 'modell'>(sp.get('modell') ? 'modell' : 'regnr')
  useEffect(() => loggEnGang('landing', 'passer'), [])

  return (
    <div className="mx-auto max-w-2xl">
      <Brodsmuler steg={1} />
      <h1 className="h1">Hvilken bil har du?</h1>
      <p className="mt-1 mb-4 text-dempet">Vi bruker bilen til å finne ut hva som trengs for at ekstralyset skal fungere.</p>

      <div role="radiogroup" aria-label="Hvordan vil du oppgi bilen?" className="mb-4 grid grid-cols-2 rounded-md border-2 border-tekst p-1">
        {(['regnr', 'modell'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={modus === m}
            onClick={() => setModus(m)}
            className={`min-h-11 rounded font-semibold ${modus === m ? 'bg-tekst text-white' : ''}`}
          >
            {m === 'regnr' ? 'Registreringsnummer' : 'Merke, modell og år'}
          </button>
        ))}
      </div>

      <div className="kort">{modus === 'regnr' ? <RegnrSkjema autofokus /> : <ModellVelger />}</div>
    </div>
  )
}
