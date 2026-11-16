// Testlogg (CSV), tilbakemelding (med avbruddsspørsmål) og kundesenter-innsikt (K8)
import { Fragment, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fagpersonSvar } from '../logic/data'
import {
  FUNNEL, har, harAvbrutt, hentOkter, hoppetOver, komplettOrdre, lagreAvbruddArsak, lagreTilbakemelding, oppgaveRader,
  slettLogg, stoppetVed, tilCsv, type Hendelse, type Okt, type OppgaveNr,
} from '../logic/logg'
import { AVBRUDD_ARSAKER, STATUS_TEKST, type AvbruddArsak, type TestStatus, type Tilbakemelding } from '../logic/testtilstand'
import { OPPGAVER } from '../components/Layout'
import { useApp } from '../state/AppState'
import { useTest } from '../state/TestContext'

const tid = (iso: string) => new Date(iso).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
const varighet = (s: number | null | undefined) => (s === null || s === undefined ? '–' : `${Math.floor(s / 60)} min ${s % 60} s`)

const HENDELSE_NAVN: Record<Hendelse, string> = {
  landing: 'Landing',
  populaer_modell_valgt: 'Valgte populær modell',
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
  oppgave_startet: 'Oppgave startet',
  oppgave_fullfort: 'Oppgave fullført',
  oppgave_avbrutt: 'Oppgave avbrutt',
  avbrudd_besvart: 'Svarte på «Hvor stoppet det opp?»',
  tilbakemelding_sendt: 'Tilbakemelding sendt',
}

function lastNed(innhold: string, filnavn: string) {
  const url = URL.createObjectURL(new Blob([innhold], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filnavn
  a.click()
  URL.revokeObjectURL(url)
}

function StatusEtikett({ status }: { status: TestStatus }) {
  const kl = {
    ikke_startet: 'bg-flate text-dempet border-linje',
    pagar: 'bg-info-lys text-info border-info',
    fullfort: 'bg-ok-lys text-ok border-ok',
    avbrutt: 'bg-varsel-lys text-varsel border-varsel',
  }[status]
  return <span className={`etikett border ${kl}`}>{STATUS_TEKST[status]}</span>
}

export function Testlogg() {
  const { testperson, aktivOppgave, startOppgave, nyTestperson, oppdater } = useTest()
  const { nullstill } = useApp()
  const nav = useNavigate()
  const [okter, setOkter] = useState<Okt[]>(hentOkter)
  const [apen, setApen] = useState<string | null>(null)
  const [nyVariant, setNyVariant] = useState<'a' | 'b'>(testperson?.variant === 'a' ? 'b' : 'a')
  const rader = oppgaveRader(okter)

  const nullstillApp = () => {
    nullstill()
    try {
      sessionStorage.removeItem('pmb.ordre')
    } catch {
      /* ignorer */
    }
  }

  const start = (n: OppgaveNr) => {
    if (startOppgave(n)) {
      nullstillApp()
      nav('/ekstralys/toyota-rav4')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="etikett mb-2 bg-tekst text-white">Intern side – for testleder</p>
        <h1 className="h1">Testlogg</h1>
        <p className="mt-1 text-dempet">
          Anonym logg per testperson, lagret bare i denne nettleseren. Kjør alle testene på samme enhet, og eksporter CSV etter hver test. Mål: minst to tester før visning for JDD (mål fem).
        </p>
      </div>

      <section aria-labelledby="aktiv" className="kort space-y-3">
        <h2 id="aktiv" className="h3">
          {testperson ? `Aktiv testperson: ${testperson.id} (variant ${testperson.variant.toUpperCase()})` : 'Ingen aktiv testperson'}
        </h2>
        {testperson && (
          <ul className="space-y-2">
            {([1, 2] as const).map((n) => {
              const t = testperson.oppgaver[n]
              const kanStarte = t.status === 'ikke_startet' && aktivOppgave === null
              return (
                <li key={n} className="flex flex-col gap-2 rounded-md bg-flate p-3 sm:flex-row sm:items-center">
                  <div className="flex-1 text-sm">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      Oppgave {n} <StatusEtikett status={t.status} />
                      {t.sekunder !== undefined && <span className="font-normal text-dempet">{varighet(t.sekunder)}</span>}
                    </p>
                    <p className="text-dempet">{OPPGAVER[n]}</p>
                  </div>
                  <button
                    type="button"
                    className="knapp-primar min-h-10 py-2 text-sm"
                    disabled={!kanStarte}
                    onClick={() => start(n)}
                    aria-describedby={kanStarte ? undefined : `hvorfor-${n}`}
                  >
                    Start oppgave {n}
                  </button>
                  {!kanStarte && (
                    <span id={`hvorfor-${n}`} className="sr-only">
                      {t.status === 'pagar' ? 'Oppgaven pågår.' : t.status === 'ikke_startet' ? 'En annen oppgave pågår.' : 'Oppgaven er avsluttet for denne testpersonen. Start ny testperson for å teste igjen.'}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        {testperson && (testperson.oppgaver[1].status === 'fullfort' || testperson.oppgaver[1].status === 'avbrutt' || testperson.oppgaver[2].status === 'fullfort' || testperson.oppgaver[2].status === 'avbrutt') && (
          <p className="text-xs text-dempet">En avsluttet oppgave kan ikke startes på nytt for samme testperson. Bruk «Start ny testperson».</p>
        )}

        <div className="flex flex-col gap-2 border-t border-linje pt-3 sm:flex-row sm:items-end">
          <fieldset>
            <legend className="mb-1 text-sm font-semibold">Variant for neste testperson</legend>
            <div className="flex gap-3">
              {(['a', 'b'] as const).map((v) => (
                <label key={v} className="flex min-h-11 items-center gap-2 text-sm">
                  <input type="radio" name="ny-variant" value={v} checked={nyVariant === v} onChange={() => setNyVariant(v)} className="size-5 accent-aksent" />
                  {v === 'a' ? 'A («Trengs for å fungere»)' : 'B («Ofte kjøpt sammen»)'}
                </label>
              ))}
            </div>
          </fieldset>
          <button
            type="button"
            className="knapp-sekundar sm:ml-auto"
            disabled={aktivOppgave !== null}
            onClick={() => {
              nyTestperson(nyVariant)
              nullstillApp()
              setOkter(hentOkter())
              setNyVariant(nyVariant === 'a' ? 'b' : 'a')
            }}
          >
            Start ny testperson
          </button>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="knapp-primar" disabled={!rader.length} onClick={() => lastNed(tilCsv(okter), `testlogg-passer-min-bil-${new Date().toISOString().slice(0, 10)}.csv`)}>
          Eksporter CSV
        </button>
        <button
          type="button"
          className="knapp-sekundar"
          disabled={!okter.length}
          onClick={() => {
            if (window.confirm('Slette hele testloggen i denne nettleseren?')) {
              slettLogg()
              setOkter([])
              oppdater()
            }
          }}
        >
          Slett logg
        </button>
      </div>

      {rader.length === 0 ? (
        <p>Ingen oppgaver logget ennå.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">Status per testperson og oppgave</caption>
            <thead className="border-b-2 border-tekst">
              <tr>
                <th scope="col" className="py-2 pr-2">Testperson</th>
                <th scope="col" className="pr-2">Oppgave</th>
                <th scope="col" className="pr-2">Variant</th>
                <th scope="col" className="pr-2">Status</th>
                <th scope="col" className="pr-2">Tid</th>
                <th scope="col" className="pr-2">Stoppet ved</th>
                <th scope="col">Hendelser</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linje">
              {rader.map((r) => {
                const nokkel = `${r.okt.uuid}-${r.oppgave ?? 0}`
                return (
                  <Fragment key={nokkel}>
                    <tr>
                      <th scope="row" className="py-2 pr-2 font-bold">
                        {r.testperson}
                        {!r.okt.test && <span className="block text-xs font-normal text-dempet">uten testmodus</span>}
                      </th>
                      <td className="pr-2">{r.oppgave ?? '–'}</td>
                      <td className="pr-2">{r.variant.toUpperCase()}</td>
                      <td className="pr-2">{r.oppgave ? <StatusEtikett status={r.status} /> : '–'}</td>
                      <td className="pr-2">{varighet(r.tidSekunder)}</td>
                      <td className="pr-2">{r.stoppetVed || '–'}</td>
                      <td>
                        <button type="button" aria-expanded={apen === nokkel} className="knapp-lenke min-h-9" onClick={() => setApen(apen === nokkel ? null : nokkel)}>
                          {r.hendelser.length} hendelser
                        </button>
                      </td>
                    </tr>
                    {apen === nokkel && (
                      <tr>
                        <td colSpan={7} className="bg-flate p-3">
                          <ol className="space-y-0.5">
                            {r.hendelser.map((h, i) => (
                              <li key={i}>
                                <span className="font-mono">{tid(h.tid)}</span> {HENDELSE_NAVN[h.navn] ?? h.navn}
                                {h.detalj && <span className="text-dempet"> ({h.detalj})</span>}
                              </li>
                            ))}
                          </ol>
                          {r.svar && <p className="mt-2"><strong>Svar:</strong> {r.svar}</p>}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
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

/** Ekstra spørsmål etter «Gi opp» */
function AvbruddSporsmal({ vedSvar }: { vedSvar: (arsak: AvbruddArsak, fritekst: string) => void }) {
  const [arsak, setArsak] = useState<AvbruddArsak | null>(null)
  const [fritekst, setFritekst] = useState('')
  return (
    <form
      className="mx-auto max-w-xl space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (arsak) vedSvar(arsak, fritekst)
      }}
    >
      <fieldset>
        <legend className="h1 mb-1">Hvor stoppet det opp?</legend>
        <p className="mb-3 text-dempet">Det er helt i orden å gi opp. Svaret hjelper oss å forbedre løsningen.</p>
        <div className="grid gap-2">
          {AVBRUDD_ARSAKER.map((a) => (
            <label key={a.verdi} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border-2 p-3 ${arsak === a.verdi ? 'border-aksent bg-aksent-lys' : 'border-linje'}`}>
              <input type="radio" name="arsak" value={a.verdi} checked={arsak === a.verdi} onChange={() => setArsak(a.verdi)} className="size-5 accent-aksent" />
              <span className="font-semibold">{a.tekst}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="arsak-fritekst" className="mb-1 block font-semibold">
          {arsak === 'annet' ? 'Hva skjedde?' : 'Fortell gjerne mer (valgfritt)'}
        </label>
        <textarea id="arsak-fritekst" rows={3} className="felt" value={fritekst} onChange={(e) => setFritekst(e.target.value)} aria-describedby="arsak-hjelp" />
        <p id="arsak-hjelp" className="mt-1 text-xs text-dempet">Ikke skriv navn eller kontaktinformasjon.</p>
      </div>
      <button type="submit" className="knapp-primar w-full" disabled={!arsak}>
        Neste
      </button>
    </form>
  )
}

export function TilbakemeldingSide() {
  const { testperson, sisteAvsluttet, oppdater } = useTest()
  const oppgave = sisteAvsluttet
  const tilstand = oppgave && testperson ? testperson.oppgaver[oppgave] : null
  const avbrutt = tilstand?.status === 'avbrutt'
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

  // Gi opp: først «Hvor stoppet det opp?»
  if (avbrutt && oppgave && !tilstand?.arsak) {
    return (
      <AvbruddSporsmal
        vedSvar={(arsak, fritekst) => {
          lagreAvbruddArsak(oppgave, arsak, fritekst)
          oppdater()
        }}
      />
    )
  }

  return (
    <form
      className="mx-auto max-w-xl space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        lagreTilbakemelding(oppgave, t)
        oppdater()
        setSendt(true)
      }}
    >
      <div>
        <h1 className="h1">{avbrutt ? 'Takk for at du prøvde' : 'Takk, oppgaven er fullført'}</h1>
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
  const okter = useMemo(hentOkter, [])
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
    const tb = os
      .flatMap((o) => [o.oppgaver[1].tilbakemelding?.hjelpEllerMersalg, o.oppgaver[2].tilbakemelding?.hjelpEllerMersalg])
      .filter((x): x is number => typeof x === 'number')
    return { v, n: os.length, bestilt, hjelp: tb.length ? (tb.reduce((a, b) => a + b, 0) / tb.length).toFixed(1) : '–' }
  })
  const arsaker = AVBRUDD_ARSAKER.map((a) => ({
    ...a,
    antall: okter.flatMap((o) => [o.oppgaver[1], o.oppgaver[2]]).filter((t) => t.arsak === a.verdi).length,
  })).filter((a) => a.antall)
  const maks = Math.max(1, ...FUNNEL.map((f) => okter.filter((o) => har(o, f)).length))
  const spNavn = (id: string) => fagpersonSvar.sporsmal.find((s) => s.id === id)?.sporsmal ?? (id === 'ring_meg' ? 'Ring meg tilbake' : id)

  return (
    <div className="space-y-6">
      <div>
        <p className="etikett mb-2 bg-tekst text-white">Intern side – data fra brukertester, ikke ekte kunder</p>
        <h1 className="h1">Kundesenter: innsikt</h1>
        <p className="mt-1 text-dempet">Hva testerne spurte om og hvor de stoppet. Samme mål som foreslås for gevinstmåling: konvertering, andel komplette ordrer og bruk av fagperson.</p>
      </div>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Testpersoner', String(n)],
          ['Konvertering (bestilt)', andel(okter.filter((o) => har(o, 'bestilt')).length)],
          ['Komplette ordrer', `${okter.filter(komplettOrdre).length} av ${okter.filter((o) => har(o, 'bestilt')).length}`],
          ['Brukte fagperson', andel(okter.filter((o) => har(o, 'fagperson_apnet')).length)],
          ['Hoppet over veileder', andel(okter.filter(hoppetOver).length)],
          ['Ga opp (avbrutt)', andel(okter.filter(harAvbrutt).length)],
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

      <section aria-labelledby="arsak">
        <h2 id="arsak" className="h2 mb-2">Hvor stoppet det opp? (svar ved «Gi opp»)</h2>
        {arsaker.length ? (
          <ul className="space-y-1 text-sm">
            {arsaker.map((a) => <li key={a.verdi}>{a.tekst}: <strong>{a.antall}</strong></li>)}
          </ul>
        ) : <p className="text-sm">Ingen avbrudd ennå.</p>}
      </section>

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
