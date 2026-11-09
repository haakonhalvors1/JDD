// Testlogg (CSV), tilbakemelding og kundesenter-innsikt (K8)
import { Fragment, useEffect, useMemo, useState } from 'react'
import { harBackend, hentFellesOkter } from '../logic/backend'
import { Link } from 'react-router-dom'
import { fagpersonSvar } from '../logic/data'
import {
  FUNNEL, har, hentOkter, hoppetOver, komplettOrdre, lagreTilbakemelding, sekunderPaOppgave, slettLogg, stoppetVed, tilCsv,
  type Hendelse, type Okt, type Tilbakemelding,
} from '../logic/logg'

const tid = (iso: string) => new Date(iso).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
const varighet = (s: number | null) => (s === null ? '–' : `${Math.floor(s / 60)} min ${s % 60} s`)

const HENDELSE_NAVN: Record<Hendelse, string> = {
  landing: 'Landing',
  bil_bekreftet: 'Bil bekreftet',
  led_besvart: 'Svarte på LED-spørsmål',
  sporsmal_ferdig: 'Spørsmål ferdig',
  veileder_hoppet_over: 'Hoppet over veileder',
  pakke_vist: 'Pakke vist',
  hvorfor_apnet: '«Hvorfor dette?» åpnet',
  ikke_inkludert_apnet: '«Ikke inkludert» åpnet',
  fagperson_apnet: 'Fagperson åpnet',
  fagperson_sporsmal: 'Spørsmål til fagperson',
  lagt_i_kurv: 'Lagt i kurv',
  bestilt: 'Bestilt',
  oppgave_ferdig: 'Oppgave ferdig',
  oppgave_gitt_opp: 'Ga opp',
  tilbakemelding_sendt: 'Tilbakemelding sendt',
}

/** Henter økter: fra felles database når den finnes, ellers fra denne nettleseren. */
function useOkter() {
  const [okter, setOkter] = useState<Okt[]>(() => (harBackend ? [] : hentOkter()))
  const [status, setStatus] = useState<'lokal' | 'laster' | 'felles' | 'feil'>(harBackend ? 'laster' : 'lokal')
  const last = () => {
    if (!harBackend) return setOkter(hentOkter())
    setStatus('laster')
    hentFellesOkter()
      .then((o) => {
        setOkter(o ?? [])
        setStatus('felles')
      })
      .catch((e) => {
        console.warn('Kunne ikke hente felles logg, viser lokal logg:', e)
        setOkter(hentOkter())
        setStatus('feil')
      })
  }
  useEffect(last, [])
  return { okter, setOkter, status, last }
}

function Kilde({ status, last }: { status: string; last: () => void }) {
  return (
    <p className="flex flex-wrap items-center gap-2 text-sm" role="status">
      <span className="font-semibold">Datakilde:</span>
      {status === 'lokal' && 'bare denne nettleseren (ingen felles database satt opp)'}
      {status === 'laster' && 'henter fra felles database …'}
      {status === 'felles' && 'felles database – alle enheter'}
      {status === 'feil' && <span className="font-semibold text-aksent">⚠ fikk ikke kontakt med felles database, viser bare denne nettleseren</span>}
      {status !== 'lokal' && (
        <button type="button" className="knapp-lenke min-h-9" onClick={last}>
          Oppdater
        </button>
      )}
    </p>
  )
}

function lastNed(innhold: string, filnavn: string) {
  const url = URL.createObjectURL(new Blob([innhold], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filnavn
  a.click()
  URL.revokeObjectURL(url)
}

function nyTestLenke(oppgave: 1 | 2, variant: 'a' | 'b') {
  return `${window.location.pathname}?test=1&oppgave=${oppgave}&variant=${variant}#/ekstralys/toyota-rav4`
}

export function Testlogg() {
  const { okter, setOkter, status, last } = useOkter()
  const [apen, setApen] = useState<string | null>(null)
  const startNy = (o: 1 | 2, v: 'a' | 'b') => {
    try {
      sessionStorage.clear()
    } catch {
      /* ignorer */
    }
    window.location.href = nyTestLenke(o, v)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="etikett mb-2 bg-tekst text-white">Intern side – for testleder</p>
        <h1 className="h1">Testlogg</h1>
        <p className="mt-1 text-dempet">Anonym logg per testperson. Mål: minst to tester før visning for JDD (mål fem).</p>
        <div className="mt-2"><Kilde status={status} last={last} /></div>
      </div>

      <section aria-labelledby="start" className="kort">
        <h2 id="start" className="h3 mb-2">Start ny testperson (ny ID, ren økt)</h2>
        <div className="flex flex-wrap gap-2">
          {([1, 2] as const).flatMap((o) =>
            (['a', 'b'] as const).map((v) => (
              <button key={`${o}${v}`} type="button" className="knapp-sekundar min-h-10 py-2 text-sm" onClick={() => startNy(o, v)}>
                Oppgave {o}, variant {v.toUpperCase()}
              </button>
            )),
          )}
        </div>
        <p className="mt-2 text-xs text-dempet">Variant A: «Trengs for å fungere». Variant B: «Ofte kjøpt sammen» over det samme tilbehøret.</p>
      </section>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="knapp-primar" disabled={!okter.length} onClick={() => lastNed(tilCsv(okter), `testlogg-passer-min-bil-${new Date().toISOString().slice(0, 10)}.csv`)}>
          Eksporter CSV
        </button>
        <button
          type="button"
          className="knapp-sekundar"
          disabled={!okter.length || harBackend}
          title={harBackend ? 'Felles logg slettes i Supabase-dashbordet' : undefined}
          onClick={() => {
            if (window.confirm('Slette hele testloggen i denne nettleseren?')) {
              slettLogg()
              setOkter([])
            }
          }}
        >
          Slett logg
        </button>
        {harBackend && <p className="w-full text-xs text-dempet">Den felles loggen kan ikke slettes herfra. Det gjøres i Supabase-dashbordet (Table Editor).</p>}
      </div>

      {okter.length === 0 ? (
        <p>Ingen økter logget ennå.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">Testpersoner</caption>
            <thead className="border-b-2 border-tekst">
              <tr>
                <th scope="col" className="py-2 pr-2">ID</th>
                <th scope="col" className="pr-2">Oppgave</th>
                <th scope="col" className="pr-2">Variant</th>
                <th scope="col" className="pr-2">Tid</th>
                <th scope="col" className="pr-2">Slutt</th>
                <th scope="col" className="pr-2">Hoppet over</th>
                <th scope="col" className="pr-2">Fagperson</th>
                <th scope="col" className="pr-2">Komplett ordre</th>
                <th scope="col">Hendelser</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linje">
              {okter.map((o) => (
                <Fragment key={o.uuid}>
                  <tr>
                    <th scope="row" className="py-2 pr-2 font-bold">{o.id}{!o.test && <span className="block text-xs font-normal text-dempet">uten testmodus</span>}</th>
                    <td className="pr-2">{o.oppgave ?? '–'}</td>
                    <td className="pr-2">{o.variant.toUpperCase()}</td>
                    <td className="pr-2">{varighet(sekunderPaOppgave(o))}</td>
                    <td className="pr-2">{o.slutt ? (o.slutt.type === 'ferdig' ? 'Ferdig' : 'Ga opp') : '–'}</td>
                    <td className="pr-2">{hoppetOver(o) ? 'Ja' : 'Nei'}</td>
                    <td className="pr-2">{har(o, 'fagperson_apnet') ? 'Ja' : 'Nei'}</td>
                    <td className="pr-2">{komplettOrdre(o) ? 'Ja' : har(o, 'bestilt') ? 'Nei' : '–'}</td>
                    <td>
                      <button type="button" aria-expanded={apen === o.id} className="knapp-lenke min-h-9" onClick={() => setApen(apen === o.id ? null : o.id)}>
                        {o.hendelser.length} hendelser
                      </button>
                    </td>
                  </tr>
                  {apen === o.id && (
                    <tr>
                      <td colSpan={9} className="bg-flate p-3">
                        <ol className="space-y-0.5">
                          {o.hendelser.map((h, i) => (
                            <li key={i}>
                              <span className="font-mono">{tid(h.tid)}</span> {HENDELSE_NAVN[h.navn] ?? h.navn}
                              {h.detalj && <span className="text-dempet"> ({h.detalj})</span>}
                            </li>
                          ))}
                        </ol>
                        {o.tilbakemelding && (
                          <p className="mt-2">
                            <strong>Tilbakemelding:</strong> trygghet {o.tilbakemelding.trygghet ?? '–'}/5 · unødvendig: {o.tilbakemelding.unodvendig ?? '–'}
                            {o.tilbakemelding.unodvendigHva && ` (${o.tilbakemelding.unodvendigHva})`} · hjelp/mersalg {o.tilbakemelding.hjelpEllerMersalg ?? '–'}/5
                            {o.tilbakemelding.fritekst && ` · «${o.tilbakemelding.fritekst}»`}
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-sm"><Link to="/innsikt" className="knapp-lenke">Se samlet innsikt →</Link></p>
    </div>
  )
}

function Skala({ id, legend, venstre, hoyre, verdi, sett }: { id: string; legend: string; venstre: string; hoyre: string; verdi: number | null; sett: (n: number) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 font-semibold">{legend}</legend>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={`grid min-h-12 flex-1 cursor-pointer place-items-center rounded-md border-2 font-bold ${verdi === n ? 'border-aksent bg-aksent-lys' : 'border-linje'}`}>
            <input type="radio" name={id} value={n} checked={verdi === n} onChange={() => sett(n)} className="sr-only" />
            {n}
          </label>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-dempet">
        <span>1 = {venstre}</span>
        <span>5 = {hoyre}</span>
      </div>
    </fieldset>
  )
}

export function TilbakemeldingSide() {
  const [t, setT] = useState<Tilbakemelding>({ trygghet: null, unodvendig: null, unodvendigHva: '', hjelpEllerMersalg: null, fritekst: '' })
  const [sendt, setSendt] = useState(false)

  if (sendt) {
    return (
      <div className="mx-auto max-w-xl rounded-lg bg-ok-lys p-6 text-center" role="status">
        <h1 className="h1 text-ok">Takk for hjelpen!</h1>
        <p className="mt-2">Svarene er lagret anonymt. Du kan gi enheten tilbake til testlederen.</p>
      </div>
    )
  }

  return (
    <form
      className="mx-auto max-w-xl space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        lagreTilbakemelding(t)
        setSendt(true)
      }}
    >
      <div>
        <h1 className="h1">Hvordan gikk det?</h1>
        <p className="mt-1 text-dempet">Fire korte spørsmål. Anonymt: vi spør ikke om navn eller e-post.</p>
      </div>
      <Skala id="trygghet" legend="Hvor trygg var du på at pakken passet bilen?" venstre="ikke trygg" hoyre="helt trygg" verdi={t.trygghet} sett={(n) => setT({ ...t, trygghet: n })} />
      <fieldset>
        <legend className="mb-2 font-semibold">Var noe i pakken unødvendig?</legend>
        <div className="flex gap-2">
          {(['nei', 'ja'] as const).map((v) => (
            <label key={v} className={`grid min-h-12 flex-1 cursor-pointer place-items-center rounded-md border-2 font-bold ${t.unodvendig === v ? 'border-aksent bg-aksent-lys' : 'border-linje'}`}>
              <input type="radio" name="unodvendig" value={v} checked={t.unodvendig === v} onChange={() => setT({ ...t, unodvendig: v })} className="sr-only" />
              {v === 'ja' ? 'Ja' : 'Nei'}
            </label>
          ))}
        </div>
        {t.unodvendig === 'ja' && (
          <div className="mt-2">
            <label htmlFor="hva" className="mb-1 block text-sm font-semibold">Hva var unødvendig?</label>
            <input id="hva" className="felt" value={t.unodvendigHva} onChange={(e) => setT({ ...t, unodvendigHva: e.target.value })} />
          </div>
        )}
      </fieldset>
      <Skala id="mersalg" legend="Hvordan opplevde du forslagene?" venstre="mersalg" hoyre="hjelp" verdi={t.hjelpEllerMersalg} sett={(n) => setT({ ...t, hjelpEllerMersalg: n })} />
      <div>
        <label htmlFor="fritekst" className="mb-1 block font-semibold">Noe annet du vil si? (valgfritt)</label>
        <textarea id="fritekst" rows={4} className="felt" value={t.fritekst} onChange={(e) => setT({ ...t, fritekst: e.target.value })} aria-describedby="fritekst-hjelp" />
        <p id="fritekst-hjelp" className="mt-1 text-xs text-dempet">Ikke skriv navn eller kontaktinformasjon.</p>
      </div>
      <button type="submit" className="knapp-primar w-full">Send tilbakemelding</button>
    </form>
  )
}

export function Innsikt() {
  const { okter, status, last } = useOkter()
  const n = okter.length
  const andel = (k: number) => (n ? `${Math.round((k / n) * 100)} %` : '–')
  const stopp = useMemo(() => {
    const m = new Map<string, number>()
    okter.filter((o) => !har(o, 'bestilt')).forEach((o) => {
      const s = stoppetVed(o) ?? 'ingen'
      m.set(s, (m.get(s) ?? 0) + 1)
    })
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [okter])
  const sporsmal = useMemo(() => {
    const m = new Map<string, number>()
    okter.forEach((o) => o.hendelser.filter((h) => h.navn === 'fagperson_sporsmal').forEach((h) => m.set(h.detalj ?? '', (m.get(h.detalj ?? '') ?? 0) + 1)))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [okter])
  const varianter = (['a', 'b'] as const).map((v) => {
    const os = okter.filter((o) => o.variant === v)
    const bestilt = os.filter((o) => har(o, 'bestilt')).length
    const tb = os.map((o) => o.tilbakemelding?.hjelpEllerMersalg).filter((x): x is number => typeof x === 'number')
    return { v, n: os.length, bestilt, hjelp: tb.length ? (tb.reduce((a, b) => a + b, 0) / tb.length).toFixed(1) : '–' }
  })
  const maks = Math.max(1, ...FUNNEL.map((f) => okter.filter((o) => har(o, f)).length))
  const spNavn = (id: string) => fagpersonSvar.sporsmal.find((s) => s.id === id)?.sporsmal ?? (id === 'ring_meg' ? 'Ring meg tilbake' : id)

  return (
    <div className="space-y-6">
      <div>
        <p className="etikett mb-2 bg-tekst text-white">Intern side – data fra brukertester, ikke ekte kunder</p>
        <h1 className="h1">Kundesenter: innsikt</h1>
        <p className="mt-1 text-dempet">Hva testerne spurte om og hvor de stoppet. Samme mål som foreslås for gevinstmåling: konvertering, andel komplette ordrer og bruk av fagperson.</p>
        <div className="mt-2"><Kilde status={status} last={last} /></div>
      </div>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Testpersoner', String(n)],
          ['Konvertering (bestilt)', andel(okter.filter((o) => har(o, 'bestilt')).length)],
          ['Komplette ordrer', `${okter.filter(komplettOrdre).length} av ${okter.filter((o) => har(o, 'bestilt')).length}`],
          ['Brukte fagperson', andel(okter.filter((o) => har(o, 'fagperson_apnet')).length)],
          ['Hoppet over veileder', andel(okter.filter(hoppetOver).length)],
          ['Ga opp', andel(okter.filter((o) => o.slutt?.type === 'gitt_opp').length)],
        ].map(([t, v]) => (
          <div key={t} className="kort">
            <dt className="text-sm text-dempet">{t}</dt>
            <dd className="text-2xl font-bold">{v}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="funnel">
        <h2 id="funnel" className="h2 mb-2">Funnel</h2>
        <table className="w-full text-sm">
          <caption className="sr-only">Antall testpersoner som nådde hvert steg</caption>
          <tbody>
            {FUNNEL.map((f) => {
              const k = okter.filter((o) => har(o, f)).length
              return (
                <tr key={f}>
                  <th scope="row" className="w-48 py-1 pr-2 text-left font-normal">{HENDELSE_NAVN[f]}</th>
                  <td className="py-1">
                    <div className="flex items-center gap-2">
                      <div className="h-5 rounded-sm bg-aksent" style={{ width: `${(k / maks) * 70}%`, minWidth: k ? 4 : 0 }} aria-hidden="true" />
                      <span className="font-semibold">{k}</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="stopp">
          <h2 id="stopp" className="h2 mb-2">Hvor stoppet de som ikke bestilte?</h2>
          {stopp.length ? (
            <ul className="space-y-1 text-sm">
              {stopp.map(([s, k]) => <li key={s}>Etter «{HENDELSE_NAVN[s as Hendelse] ?? s}»: <strong>{k}</strong></li>)}
            </ul>
          ) : <p className="text-sm">Ingen data ennå.</p>}
        </section>
        <section aria-labelledby="spm">
          <h2 id="spm" className="h2 mb-2">Spørsmål til fagperson</h2>
          {sporsmal.length ? (
            <ul className="space-y-1 text-sm">
              {sporsmal.map(([s, k]) => <li key={s}>{spNavn(s)}: <strong>{k}</strong></li>)}
            </ul>
          ) : <p className="text-sm">Ingen data ennå.</p>}
        </section>
      </div>

      <section aria-labelledby="var">
        <h2 id="var" className="h2 mb-2">Variant A («Trengs for å fungere») mot B («Ofte kjøpt sammen»)</h2>
        <table className="w-full max-w-lg text-left text-sm">
          <thead className="border-b-2 border-tekst">
            <tr><th scope="col" className="py-1">Variant</th><th scope="col">Testere</th><th scope="col">Bestilte</th><th scope="col">Hjelp vs. mersalg (snitt 1–5)</th></tr>
          </thead>
          <tbody className="divide-y divide-linje">
            {varianter.map((x) => (
              <tr key={x.v}><th scope="row" className="py-1">{x.v.toUpperCase()}</th><td>{x.n}</td><td>{x.bestilt}</td><td>{x.hjelp}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-dempet">Få testere gir ikke statistisk sikre forskjeller. Bruk tallene sammen med det testerne sier.</p>
      </section>
    </div>
  )
}
