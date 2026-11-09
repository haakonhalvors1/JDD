// K4: Fagperson legger inn, redigerer og godkjenner regler. Kunnskapen blir i JDD.
import { useState } from 'react'
import { produkter, sporsmal } from '../logic/data'
import type { Canbus, Frontlys, Krever, Regel } from '../logic/typer'
import { useApp } from '../state/AppState'

const iDag = () => new Date().toISOString().slice(0, 10)
const RELEER = produkter.filter((p) => p.kategori === 'rele')

function StatusRegel({ r }: { r: Regel }) {
  return r.status === 'godkjent' ? (
    <span className="etikett border border-ok bg-ok-lys text-ok">✓ Godkjent</span>
  ) : (
    <span className="etikett border border-varsel bg-varsel-lys text-varsel">Utkast – ikke godkjent</span>
  )
}

function RegelSkjema({ start, lagre, avbryt }: { start: Regel; lagre: (r: Regel) => void; avbryt: () => void }) {
  const [r, setR] = useState<Regel>(start)
  const felt = (navn: keyof Regel, label: string, type: 'text' | 'number' = 'text') => (
    <div>
      <label htmlFor={`f-${navn}`} className="mb-1 block text-sm font-semibold">{label}</label>
      <input
        id={`f-${navn}`}
        className="felt"
        type={type}
        value={String(r[navn] ?? '')}
        onChange={(e) => setR({ ...r, [navn]: type === 'number' ? Number(e.target.value) : e.target.value })}
        required
      />
    </div>
  )
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        // AK-4.2: redigert eller ny regel blir alltid utkast
        lagre({ ...r, releId: r.krever === 'rele' ? (r.releId ?? 'REL-CAN') : undefined, status: 'utkast', godkjentAv: undefined, godkjentDato: undefined })
      }}
      className="grid gap-3 rounded-lg border-2 border-info bg-info-lys p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {felt('merke', 'Merke')}
      {felt('modell', 'Modell')}
      {felt('arFra', 'År fra', 'number')}
      {felt('arTil', 'År til', 'number')}
      <div>
        <label htmlFor="f-frontlys" className="mb-1 block text-sm font-semibold">Frontlys</label>
        <select id="f-frontlys" className="felt" value={r.frontlys} onChange={(e) => setR({ ...r, frontlys: e.target.value as Frontlys })}>
          <option value="LED">LED</option>
          <option value="halogen">Halogen</option>
        </select>
      </div>
      <div>
        <label htmlFor="f-canbus" className="mb-1 block text-sm font-semibold">Canbus</label>
        <select id="f-canbus" className="felt" value={r.canbus} onChange={(e) => setR({ ...r, canbus: e.target.value as Canbus })}>
          <option value="nei">Nei</option>
          <option value="CAN">CAN</option>
          <option value="CAN FD">CAN FD</option>
        </select>
      </div>
      <div>
        <label htmlFor="f-krever" className="mb-1 block text-sm font-semibold">Krever</label>
        <select id="f-krever" className="felt" value={r.krever} onChange={(e) => setR({ ...r, krever: e.target.value as Krever })}>
          <option value="rele">Canbus-relé</option>
          <option value="kabelsett">Kabelsett</option>
        </select>
      </div>
      <div>
        <label htmlFor="f-rele" className="mb-1 block text-sm font-semibold">Relé</label>
        <select id="f-rele" className="felt" disabled={r.krever !== 'rele'} value={r.releId ?? ''} onChange={(e) => setR({ ...r, releId: e.target.value })}>
          {RELEER.map((p) => <option key={p.id} value={p.id}>{p.navn}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">{felt('kilde', 'Kilde')}</div>
      <div className="sm:col-span-2">
        <label htmlFor="f-merknad" className="mb-1 block text-sm font-semibold">Merknad</label>
        <input id="f-merknad" className="felt" value={r.merknad ?? ''} onChange={(e) => setR({ ...r, merknad: e.target.value })} />
      </div>
      <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
        <button type="submit" className="knapp-primar">Lagre som utkast</button>
        <button type="button" className="knapp-sekundar" onClick={avbryt}>Avbryt</button>
        <p className="w-full text-xs text-dempet">Lagrede endringer må godkjennes før de gir status «Bekreftet» for kundene.</p>
      </div>
    </form>
  )
}

export function FagpersonAdmin() {
  const { regeldata, lagreRegler, tilbakestillRegler } = useApp()
  const regler = regeldata.regler
  const [redigerer, setRedigerer] = useState<string | null>(null)
  const [godkjenner, setGodkjenner] = useState('Fagperson A')
  const [melding, setMelding] = useState('')
  const [lost, setLost] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('pmb.datakvalitet') ?? '[]')
    } catch {
      return []
    }
  })

  const lagre = (ny: Regel) => {
    const finnes = regler.some((r) => r.id === ny.id)
    lagreRegler(finnes ? regler.map((r) => (r.id === ny.id ? ny : r)) : [...regler, ny])
    setRedigerer(null)
    setMelding(`${ny.id} er lagret som utkast. Den må godkjennes før kundene ser den som bekreftet.`)
  }

  const godkjenn = (id: string) => {
    lagreRegler(regler.map((r) => (r.id === id ? { ...r, status: 'godkjent', godkjentAv: godkjenner || 'Fagperson', godkjentDato: iDag() } : r)))
    setMelding(`${id} er godkjent av ${godkjenner || 'Fagperson'}. Kundene ser nå bilen som «Bekreftet».`)
  }

  const nyId = `R-${String(regler.reduce((m, r) => Math.max(m, Number(r.id.replace(/\D/g, '')) || 0), 0) + 1).padStart(3, '0')}`
  const tomRegel: Regel = { id: nyId, merke: '', modell: '', arFra: 2020, arTil: 2025, frontlys: 'LED', canbus: 'CAN', krever: 'rele', releId: 'REL-CAN', kilde: '', status: 'utkast' }

  const avvik = produkter.filter((p) => p.fargetempBeskrivelse && p.fargetempTeknisk && p.fargetempBeskrivelse !== p.fargetempTeknisk)
  const merkLost = (id: string) => {
    const ny = [...lost, id]
    setLost(ny)
    try {
      localStorage.setItem('pmb.datakvalitet', JSON.stringify(ny))
    } catch {
      /* ignorer */
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="etikett mb-2 bg-tekst text-white">Intern side – prototype</p>
        <h1 className="h1">Fagperson: kompatibilitetsregler</h1>
        <p className="mt-1 max-w-3xl text-dempet">
          Her legger fagpersoner inn hva hver bilmodell trenger. Bare godkjente regler gir «Bekreftet» hos kunden. Slik blir kunnskapen i JDD, også når nøkkelpersoner går av med pensjon. Endringer lagres bare i denne nettleseren (eksempeldata).
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="godkjenner" className="mb-1 block text-sm font-semibold">Godkjennes av</label>
          <input id="godkjenner" className="felt w-56" value={godkjenner} onChange={(e) => setGodkjenner(e.target.value)} />
        </div>
        <button type="button" className="knapp-primar" onClick={() => setRedigerer('ny')}>+ Ny regel</button>
        <button
          type="button"
          className="knapp-sekundar"
          onClick={() => {
            if (window.confirm('Tilbakestille alle regler til eksempeldataene?')) {
              tilbakestillRegler()
              setMelding('Reglene er tilbakestilt til eksempeldataene.')
            }
          }}
        >
          Tilbakestill eksempeldata
        </button>
      </div>

      <p role="status" className={melding ? 'rounded-md bg-ok-lys p-3 font-semibold text-ok' : 'sr-only'}>{melding}</p>

      {redigerer === 'ny' && <RegelSkjema start={tomRegel} lagre={lagre} avbryt={() => setRedigerer(null)} />}

      <section aria-labelledby="regler">
        <h2 id="regler" className="h2 mb-2">Modelltabell ({regler.length} regler)</h2>
        <ul className="space-y-3">
          {regler.map((r) => (
            <li key={r.id} className="kort">
              {redigerer === r.id ? (
                <RegelSkjema start={r} lagre={lagre} avbryt={() => setRedigerer(null)} />
              ) : (
                <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold">{r.id}</span>
                      <span className="font-bold">{r.merke} {r.modell} {r.arFra}–{r.arTil}</span>
                      <StatusRegel r={r} />
                    </div>
                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
                      <div><dt className="text-dempet">Frontlys</dt><dd className="font-semibold">{r.frontlys}</dd></div>
                      <div><dt className="text-dempet">Canbus</dt><dd className="font-semibold">{r.canbus}</dd></div>
                      <div><dt className="text-dempet">Krever</dt><dd className="font-semibold">{r.krever === 'rele' ? produkter.find((p) => p.id === r.releId)?.navn : 'Kabelsett'}</dd></div>
                      <div><dt className="text-dempet">Godkjent</dt><dd>{r.godkjentAv ? `${r.godkjentAv}, ${r.godkjentDato}` : '–'}</dd></div>
                    </dl>
                    <p className="mt-1 text-sm"><span className="text-dempet">Kilde:</span> {r.kilde}</p>
                    {r.merknad && <p className="text-sm"><span className="text-dempet">Merknad:</span> {r.merknad}</p>}
                  </div>
                  <div className="flex gap-2 lg:flex-col">
                    <button type="button" className="knapp-sekundar min-h-10 py-2 text-sm" onClick={() => setRedigerer(r.id)} aria-label={`Rediger ${r.id}`}>Rediger</button>
                    {r.status === 'utkast' && (
                      <button type="button" className="knapp min-h-10 bg-ok py-2 text-sm text-white" onClick={() => godkjenn(r.id)} aria-label={`Godkjenn ${r.id}`}>
                        ✓ Godkjenn
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="utledning">
        <h2 id="utledning" className="h2 mb-2">Utledningsregler (når bilen er ukjent)</h2>
        <ul className="space-y-2">
          {regeldata.utledning.map((u) => (
            <li key={u.id} className="kort text-sm">
              <p><span className="font-mono font-bold">{u.id}</span> · Kunden svarer «{u.ledSvar === 'ja' ? 'Ja, LED-frontlys' : 'Nei, halogen'}» → {u.krever === 'rele' ? produkter.find((p) => p.id === u.releId)?.navn : 'Kabelsett'} (status Regelutledet)</p>
              <p className="mt-1 text-dempet">Kilde: {u.kilde}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="dk">
        <h2 id="dk" className="h2 mb-2">Datakvalitet</h2>
        <ul className="space-y-2">
          {avvik.map((p) => (
            <li key={p.id} className={`kort ${lost.includes(p.id) ? 'opacity-70' : 'border-2 border-varsel'}`}>
              <p className="font-semibold">
                {lost.includes(p.id) ? '✓ Løst: ' : 'Motstridende spesifikasjon: '}
                {p.navn}
              </p>
              <p className="text-sm">Fargetemperatur: <strong>{p.fargetempBeskrivelse}</strong> i beskrivelsen, men <strong>{p.fargetempTeknisk}</strong> i teknisk info.</p>
              <p className="text-xs text-dempet">Funnet i service safarien 12.10.2026 (samme avvik på en ekte produktside). Kilde for riktig verdi: produsentens datablad.</p>
              {!lost.includes(p.id) && (
                <button type="button" className="knapp-sekundar mt-2 min-h-10 py-2 text-sm" onClick={() => merkLost(p.id)}>Merk som løst</button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="sp">
        <h2 id="sp" className="h2 mb-2">Spørsmålene i veilederen</h2>
        <p className="mb-2 text-sm font-semibold text-varsel">Forslag, avklares med JDD (e-post okt. 2026: antall lamper, festemetode, kontakttype).</p>
        <ul className="grid gap-2 md:grid-cols-3">
          {sporsmal.map((s) => (
            <li key={s.id} className="kort text-sm">
              <p className="font-semibold">{s.tittel}</p>
              <p className="text-dempet">{s.valg.map((v) => v.tekst).join(' · ')}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
