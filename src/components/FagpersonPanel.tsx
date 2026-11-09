// K6: Fagperson-chat med kontekst (bil + kurv øverst). Forhåndsskrevne svar, ingen LLM (G1).
import { useEffect, useRef, useState } from 'react'
import { kr } from '../logic/anbefal'
import { fagpersonSvar, produkter } from '../logic/data'
import { logg } from '../logic/logg'
import { visRegnr } from '../logic/regnr'
import { useApp } from '../state/AppState'
import { StatusMerke } from './Felles'

type Melding = { fra: 'kunde' | 'fagperson'; tekst: string; id: string }

export function FagpersonPanel() {
  const { fagpersonApen, lukkFagperson, bil, bilBekreftet, resultat, kurv } = useApp()
  const [fane, setFane] = useState<'chat' | 'ring'>('chat')
  const [meldinger, setMeldinger] = useState<Melding[]>([])
  const [ringBestilt, setRingBestilt] = useState(false)
  const [tidsvindu, setTidsvindu] = useState('snarest')
  const dialog = useRef<HTMLDialogElement>(null)
  const slutt = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (fagpersonApen && !d.open) d.showModal()
    if (!fagpersonApen && d.open) d.close()
  }, [fagpersonApen])

  useEffect(() => {
    slutt.current?.scrollIntoView({ block: 'end' })
  }, [meldinger])

  const kurvLinjer = kurv.map((k) => ({ ...k, p: produkter.find((p) => p.id === k.produktId)! }))
  const sum = kurvLinjer.reduce((s, k) => s + k.p.pris * k.antall, 0)

  const spor = (id: string) => {
    const s = fagpersonSvar.sporsmal.find((x) => x.id === id)!
    logg('fagperson_sporsmal', id)
    setMeldinger((m) => [
      ...m,
      { fra: 'kunde', tekst: s.sporsmal, id: `${id}-k-${m.length}` },
      { fra: 'fagperson', tekst: s.svar, id: `${id}-f-${m.length}` },
    ])
  }

  return (
    <dialog
      ref={dialog}
      onClose={lukkFagperson}
      aria-labelledby="fagperson-tittel"
      className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-md bg-white p-0 shadow-2xl backdrop:bg-black/40 sm:m-auto sm:mr-0"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-linje bg-tekst px-4 py-3 text-white">
          <h2 id="fagperson-tittel" className="text-lg font-bold">
            Spør en fagperson
          </h2>
          <button type="button" onClick={lukkFagperson} className="knapp min-h-10 px-3 py-1 text-white hover:bg-white/10" aria-label="Lukk">
            ✕
          </button>
        </div>

        {/* AK-6.2: Kontekst – fagpersonen ser bil og kurv */}
        <section aria-label="Det fagpersonen ser" className="border-b border-linje bg-flate px-4 py-3 text-sm">
          <p className="mb-1 text-xs font-semibold tracking-wide text-dempet uppercase">Fagpersonen ser</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            <dt className="font-semibold">Bil</dt>
            <dd>
              {bil ? (
                <span className="flex flex-wrap items-center gap-2">
                  {bil.merke} {bil.modell} {bil.ar}
                  {bil.regnr && <span className="text-dempet">({visRegnr(bil.regnr)})</span>}
                  {bilBekreftet && <StatusMerke status={resultat.status} />}
                </span>
              ) : (
                'Ikke oppgitt ennå'
              )}
            </dd>
            {resultat.oppsett && (
              <>
                <dt className="font-semibold">Oppsett</dt>
                <dd>
                  {resultat.oppsett.frontlys ?? '?'}-frontlys
                  {resultat.oppsett.canbus ? `, Canbus: ${resultat.oppsett.canbus}` : ''} → {resultat.oppsett.krever === 'rele' ? 'relé' : 'kabelsett'}
                </dd>
              </>
            )}
            <dt className="font-semibold">Kurv</dt>
            <dd>
              {kurvLinjer.length ? (
                <>
                  <ul>
                    {kurvLinjer.map((k) => (
                      <li key={k.produktId}>
                        {k.antall} × {k.p.navn}
                      </li>
                    ))}
                  </ul>
                  <span className="font-semibold">Sum {kr(sum)}</span>
                </>
              ) : (
                'Tom'
              )}
            </dd>
          </dl>
        </section>

        <div role="tablist" aria-label="Kontaktmåte" className="flex border-b border-linje">
          {(['chat', 'ring'] as const).map((f) => (
            <button
              key={f}
              role="tab"
              type="button"
              aria-selected={fane === f}
              aria-controls={`fane-${f}`}
              id={`tab-${f}`}
              onClick={() => setFane(f)}
              className={`min-h-11 flex-1 font-semibold ${fane === f ? 'border-b-4 border-aksent text-tekst' : 'text-dempet'}`}
            >
              {f === 'chat' ? 'Chat' : 'Ring meg tilbake'}
            </button>
          ))}
        </div>

        {fane === 'chat' ? (
          <div id="fane-chat" role="tabpanel" aria-labelledby="tab-chat" className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3" aria-live="polite">
              <p className="rounded-lg bg-flate p-3 text-sm">
                <span className="font-semibold">{fagpersonSvar.fagperson}:</span> Hei! Jeg ser bilen og handlekurven din. Hva lurer du på?
              </p>
              {meldinger.map((m) => (
                <div key={m.id} className={m.fra === 'kunde' ? 'flex justify-end' : ''}>
                  <p className={`max-w-[85%] rounded-lg p-3 text-sm ${m.fra === 'kunde' ? 'bg-aksent text-white' : 'bg-flate'}`}>
                    <span className="sr-only">{m.fra === 'kunde' ? 'Du' : fagpersonSvar.fagperson}: </span>
                    {m.fra === 'fagperson' && <span className="font-semibold">{fagpersonSvar.fagperson}: </span>}
                    {m.tekst}
                  </p>
                  {m.fra === 'fagperson' && m.id.startsWith('montering') && (
                    <div className="mt-2">
                      <button type="button" disabled className="knapp-sekundar w-full text-sm">
                        Bestill montering hos partnerverksted (kommer)
                      </button>
                      <p className="mt-1 text-xs font-semibold text-varsel">Idé, avklares med JDD.</p>
                    </div>
                  )}
                </div>
              ))}
              <div ref={slutt} />
            </div>
            <div className="border-t border-linje px-4 py-3">
              <p id="velg-sporsmal" className="mb-2 text-sm font-semibold">
                Velg et spørsmål:
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-labelledby="velg-sporsmal">
                {fagpersonSvar.sporsmal.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => spor(s.id)}
                    className="rounded-full border-2 border-info px-3 py-1.5 text-left text-sm font-semibold text-info hover:bg-info-lys"
                  >
                    {s.sporsmal}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-dempet">Prototype: forhåndsskrevne svar, ingen ekte chat.</p>
            </div>
          </div>
        ) : (
          <div id="fane-ring" role="tabpanel" aria-labelledby="tab-ring" className="flex-1 overflow-y-auto px-4 py-4">
            {ringBestilt ? (
              <p role="status" className="rounded-lg bg-ok-lys p-3 text-ok">
                ✓ Takk! En fagperson ringer deg {tidsvindu === 'snarest' ? 'innen 30 minutter' : tidsvindu} og ser bilen og handlekurven din. (Simulert.)
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  setRingBestilt(true)
                  logg('fagperson_sporsmal', 'ring_meg')
                }}
                className="space-y-4"
              >
                <fieldset>
                  <legend className="mb-2 font-semibold">Når passer det?</legend>
                  {[
                    ['snarest', 'Så snart som mulig (innen 30 min)'],
                    ['i ettermiddag kl. 15–17', 'I ettermiddag kl. 15–17'],
                    ['i morgen kl. 09–11', 'I morgen kl. 09–11'],
                  ].map(([v, t]) => (
                    <label key={v} className="flex min-h-11 items-center gap-3">
                      <input type="radio" name="tid" value={v} checked={tidsvindu === v} onChange={() => setTidsvindu(v)} className="size-5 accent-aksent" />
                      {t}
                    </label>
                  ))}
                </fieldset>
                <div>
                  <label htmlFor="tlf" className="mb-1 block font-semibold">
                    Telefonnummer
                  </label>
                  <input id="tlf" className="felt" disabled placeholder="Simulert – ikke fyll inn" aria-describedby="tlf-hjelp" />
                  <p id="tlf-hjelp" className="mt-1 text-xs text-dempet">
                    Prototype: vi lagrer ikke telefonnummer.
                  </p>
                </div>
                <button type="submit" className="knapp-primar w-full">
                  Ring meg tilbake (simulert)
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </dialog>
  )
}
