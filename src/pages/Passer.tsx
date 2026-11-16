// Start: regnr eller merke/modell/år (K1, A4). «Populære bilmodeller» fyller ut velgeren og viser bekreftelsen direkte.
import { useEffect, useReducer, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BilBekreftelse } from '../components/BilBekreftelse'
import { ModellVelger, PopulaereModeller, RegnrSkjema } from '../components/BilSkjema'
import { Brodsmuler } from '../components/Felles'
import { tomVelger, velgerReducer, velgerTilBil } from '../logic/bilvelger'
import { loggEnGang } from '../logic/logg'
import { useApp } from '../state/AppState'

export function Passer() {
  const [sp, setSp] = useSearchParams()
  const { bil, settBil } = useApp()
  const fraUrl = { merke: sp.get('merke') ?? '', modell: sp.get('modell') ?? '', ar: sp.get('ar') ?? '' }
  const harUrlBil = Boolean(fraUrl.merke)
  const [modus, setModus] = useState<'regnr' | 'modell'>(sp.get('modell') || harUrlBil ? 'modell' : 'regnr')
  const [velger, endre] = useReducer(velgerReducer, tomVelger, (s) =>
    harUrlBil ? velgerReducer(s, { type: 'fyll', ...fraUrl }) : s,
  )
  useEffect(() => loggEnGang('landing', 'passer'), [])

  // Ny populær modell valgt mens siden er åpen: fyll ut velgeren
  const urlNokkel = `${fraUrl.merke}|${fraUrl.modell}|${fraUrl.ar}`
  const forrigeUrl = useRef(urlNokkel)
  useEffect(() => {
    if (urlNokkel === forrigeUrl.current) return
    forrigeUrl.current = urlNokkel
    if (fraUrl.merke) {
      endre({ type: 'fyll', ...fraUrl })
      setModus('modell')
    }
  }, [urlNokkel]) // eslint-disable-line react-hooks/exhaustive-deps

  // Når alle tre feltene er utfylt: slå opp bilen (status fra modelltabellen) og vis bekreftelsen.
  // Bytter kunden merke eller modell, fjernes bilen igjen.
  const valgtBil = velgerTilBil(velger)
  const bilNokkel = valgtBil ? `${valgtBil.merke}|${valgtBil.modell}|${valgtBil.ar}` : ''
  const forrigeBil = useRef<string | null>(null)
  useEffect(() => {
    if (modus !== 'modell' || bilNokkel === forrigeBil.current) return
    forrigeBil.current = bilNokkel
    if (valgtBil) settBil(valgtBil)
    else if (bil && !bil.regnr) settBil(null)
  }, [bilNokkel, modus]) // eslint-disable-line react-hooks/exhaustive-deps

  const visBekreftelse =
    modus === 'modell' && valgtBil && bil && !bil.regnr && bil.merke === valgtBil.merke && bil.modell === valgtBil.modell && bil.ar === valgtBil.ar

  // Bekreftelsen kan havne under skjermkanten på mobil: rull den inn i bildet når den dukker opp
  useEffect(() => {
    if (visBekreftelse) document.getElementById('bil-bekreft')?.closest('section')?.scrollIntoView({ block: 'nearest' })
  }, [visBekreftelse])

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Brodsmuler steg={1} />
      <div>
        <h1 className="h1">Hvilken bil har du?</h1>
        <p className="mt-1 text-dempet">Vi bruker bilen til å finne ut hva som trengs for at ekstralyset skal fungere.</p>
      </div>

      <PopulaereModeller tittelNiva="h2" />

      <div role="radiogroup" aria-label="Hvordan vil du oppgi bilen?" className="grid grid-cols-2 rounded-md border-2 border-tekst p-1">
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

      <div className="kort">{modus === 'regnr' ? <RegnrSkjema /> : <ModellVelger velger={velger} endre={endre} />}</div>

      {visBekreftelse && (
        <BilBekreftelse
          tittelNiva="h2"
          vedNei={() => {
            endre({ type: 'nullstill' })
            settBil(null)
            forrigeBil.current = ''
            setSp({ modell: '1' }, { replace: true })
          }}
        />
      )}
    </div>
  )
}
