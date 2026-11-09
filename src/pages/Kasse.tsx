// Kurv, kasse og bekreftelse (K2, K7, K9, NF3)
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brodsmuler, FagpersonKnapp, Garantimerke, Garantivilkar, Pris, StatusMerke } from '../components/Felles'
import { Koblingsskjema, ProduktBilde } from '../components/Illustrasjoner'
import { kr } from '../logic/anbefal'
import { produkter } from '../logic/data'
import { avsluttOppgave, logg } from '../logic/logg'
import { visRegnr } from '../logic/regnr'
import { useApp } from '../state/AppState'

function useKurv() {
  const { kurv, resultat, valgtPakke } = useApp()
  const linjer = kurv.map((k) => ({ ...k, p: produkter.find((p) => p.id === k.produktId)! }))
  const sum = linjer.reduce((s, l) => s + l.p.pris * l.antall, 0)
  const trengs = valgtPakke ? (resultat.pakker?.[valgtPakke].linjer ?? []) : []
  const mangler = trengs.filter((l) => !kurv.some((k) => k.produktId === l.produkt.id))
  return { linjer, sum, mangler, komplett: valgtPakke !== null && mangler.length === 0 }
}

export function KurvSide() {
  const { fjernFraKurv, leggPakkeIKurv, valgtPakke, bil } = useApp()
  const { linjer, sum, mangler } = useKurv()
  const nav = useNavigate()

  if (!linjer.length) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="h1">Handlekurv</h1>
        <p className="mt-2">Kurven er tom.</p>
        <Link to="/passer" className="knapp-primar mt-4">Finn ekstralys som passer bilen din</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="h1">Handlekurv</h1>
      {bil && <p className="text-sm text-dempet">Til {bil.merke} {bil.modell} {bil.ar}</p>}

      {/* AK-2.5: advarsel når en nødvendig del er fjernet */}
      {mangler.length > 0 && valgtPakke && (
        <div role="alert" className="rounded-lg border-2 border-aksent bg-aksent-lys p-3">
          {mangler.map((m) => (
            <p key={m.produkt.id} className="font-semibold">
              Uten {m.produkt.navn.toLowerCase()} vil lysene ikke fungere på din bil.
            </p>
          ))}
          <button type="button" className="knapp-primar mt-2 min-h-10 py-2 text-sm" onClick={() => leggPakkeIKurv(valgtPakke)}>
            Legg tilbake det som mangler
          </button>
        </div>
      )}

      <ul className="divide-y divide-linje rounded-lg border border-linje">
        {linjer.map((l) => (
          <li key={l.produktId} className="flex gap-3 p-3">
            <ProduktBilde kategori={l.p.kategori} className="w-14 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">{l.antall > 1 && `${l.antall} × `}{l.p.navn}</p>
              <p className={`text-xs font-semibold ${l.type === 'trengs' ? 'text-aksent' : 'text-dempet'}`}>
                {l.type === 'trengs' ? 'Trengs for å fungere' : 'Valgfritt tilbehør'}
              </p>
              <button type="button" className="knapp-lenke min-h-9 text-sm" onClick={() => fjernFraKurv(l.produktId)} aria-label={`Fjern ${l.p.navn}`}>
                Fjern
              </button>
            </div>
            <span className="font-semibold whitespace-nowrap">{kr(l.p.pris * l.antall)}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between">
        <span className="font-semibold">Totalt</span>
        <Pris belop={sum} />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" className="knapp-primar flex-1" onClick={() => nav('/kasse')}>Til kassen</button>
        <Link to="/passer/pakke" className="knapp-sekundar">Tilbake til pakken</Link>
      </div>
    </div>
  )
}

interface Ordre {
  nr: string
  linjer: { navn: string; antall: number; pris: number }[]
  sum: number
  bil: string
  rele: boolean
  lagret: boolean
}

export function KasseSide() {
  const { bil, resultat, lagreIGarasje } = useApp()
  const { linjer, sum, komplett, mangler } = useKurv()
  const [samtykke, setSamtykke] = useState(false)
  const nav = useNavigate()

  if (!linjer.length) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="h1">Kasse</h1>
        <p className="mt-2">Kurven er tom.</p>
        <Link to="/passer" className="knapp-primar mt-4">Finn ekstralys</Link>
      </div>
    )
  }

  const bestill = () => {
    if (samtykke) lagreIGarasje()
    logg('bestilt', komplett ? 'komplett' : 'ufullstendig')
    const ordre: Ordre = {
      nr: `PMB-${String(Date.now()).slice(-6)}`,
      linjer: linjer.map((l) => ({ navn: l.p.navn, antall: l.antall, pris: l.p.pris })),
      sum,
      bil: bil ? `${bil.merke} ${bil.modell} ${bil.ar}` : 'bilen din',
      rele: resultat.oppsett?.krever === 'rele',
      lagret: samtykke,
    }
    try {
      sessionStorage.setItem('pmb.ordre', JSON.stringify(ordre))
    } catch {
      /* ignorer */
    }
    nav('/bekreftelse')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Brodsmuler steg={4} />
      <h1 className="h1">Kasse</h1>

      {bil && (
        <p className="flex flex-wrap items-center gap-2 text-sm">
          Til {bil.merke} {bil.modell} {bil.ar} <StatusMerke status={resultat.status} />
        </p>
      )}

      <section aria-labelledby="oppsummering" className="kort">
        <h2 id="oppsummering" className="h3 mb-2">Ordren din</h2>
        <ul className="space-y-1 text-sm">
          {linjer.map((l) => (
            <li key={l.produktId} className="flex justify-between gap-3">
              <span>{l.antall > 1 && `${l.antall} × `}{l.p.navn}</span>
              <span className="whitespace-nowrap">{kr(l.p.pris * l.antall)}</span>
            </li>
          ))}
          <li className="flex justify-between gap-3 border-t border-linje pt-1">
            <span>Frakt (én forsendelse)</span>
            <span>0 kr</span>
          </li>
        </ul>
        <div className="mt-2 flex items-center justify-between border-t-2 border-tekst pt-2">
          <span className="font-bold">Å betale (inkl. mva.)</span>
          <Pris belop={sum} />
        </div>
        <p className="mt-2 text-sm">
          På lager. Leveringstid 2–4 virkedager. <strong>Ingen skjulte tillegg.</strong>
        </p>
        {mangler.length > 0 && (
          <p role="alert" className="mt-2 rounded-md bg-aksent-lys p-2 text-sm font-semibold">
            Ordren mangler deler som trengs for at lysene skal fungere. <Link to="/kurv" className="underline">Se kurven</Link>
          </p>
        )}
      </section>

      {/* K7: Passer-garanti i kassen */}
      <section aria-label="Passer-garanti" className="kort border-ok">
        <Garantimerke />
        <p className="mt-2 text-sm">Fri retur hvis «Passer min bil» anbefalte noe som ikke passer bilen din.</p>
        <Garantivilkar />
      </section>

      <section aria-labelledby="kunde" className="kort">
        <h2 id="kunde" className="h3">Levering og betaling</h2>
        <p className="mt-1 text-sm text-dempet">Prototype: navn, adresse og betaling fylles ikke ut. Ingen ekte bestilling.</p>
        {bil?.regnr && (
          // NF3/G8: eksplisitt samtykke, ikke forhåndsavkrysset
          <label className="mt-3 flex min-h-11 items-start gap-3">
            <input type="checkbox" checked={samtykke} onChange={(e) => setSamtykke(e.target.checked)} className="mt-1 size-5 shrink-0 accent-aksent" aria-describedby="garasje-hjelp" />
            <span>
              <span className="font-semibold">Husk bilen min i Min garasje</span>
              <span id="garasje-hjelp" className="block text-sm text-dempet">
                Vi lagrer {visRegnr(bil.regnr)} i denne nettleseren, slik at du slipper å skrive det neste gang. Du kan slette det når som helst.
              </span>
            </span>
          </label>
        )}
      </section>

      <button type="button" className="knapp-primar w-full text-lg" onClick={bestill}>
        Bestill hele pakken ({kr(sum)}) – simulert
      </button>
      <FagpersonKnapp fra="kasse" variant="lenke" />
    </div>
  )
}

export function BekreftelseSide() {
  const { innst, garasje, glemGarasje, tomKurv } = useApp()
  const nav = useNavigate()
  // Kurven tømmes først her, slik at kassen ikke rendres tom før navigasjonen
  useEffect(() => tomKurv(), [tomKurv])
  let ordre: Ordre | null = null
  try {
    ordre = JSON.parse(sessionStorage.getItem('pmb.ordre') ?? 'null')
  } catch {
    /* ignorer */
  }
  if (!ordre) {
    return (
      <div>
        <h1 className="h1">Ingen ordre</h1>
        <Link to="/" className="knapp-lenke">Til forsiden</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="rounded-lg bg-ok-lys p-4">
        <h1 className="h1 text-ok">✓ Takk for bestillingen!</h1>
        <p className="mt-1">
          Ordre {ordre.nr} (simulert) · ekstralys til {ordre.bil} · {kr(ordre.sum)}
        </p>
        <p className="mt-1 text-sm">Alt kommer i én forsendelse om 2–4 virkedager.</p>
      </div>

      <section aria-labelledby="innhold" className="kort">
        <h2 id="innhold" className="h3 mb-2">Dette har du bestilt</h2>
        <ul className="space-y-1 text-sm">
          {ordre.linjer.map((l) => (
            <li key={l.navn} className="flex justify-between gap-3">
              <span>{l.antall > 1 && `${l.antall} × `}{l.navn}</span>
              <span>{kr(l.pris * l.antall)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3"><Garantimerke /></div>
      </section>

      {/* K9: monteringsguide som plassholder */}
      <section aria-labelledby="guide" className="kort">
        <h2 id="guide" className="h3">Monteringsguide og koblingsskjema for {ordre.bil}</h2>
        <p className="mb-2 text-sm font-semibold text-varsel">Kommer i fase 2. Skjemaet under er en illustrasjon.</p>
        <Koblingsskjema rele={ordre.rele} className="w-full" />
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
          <li>Monter braketten bak kjennemerket.</li>
          <li>Fest lampene og trekk kabelen inn i motorrommet.</li>
          <li>{ordre.rele ? 'Koble Canbus-reléet til kontakten som beskrevet i guiden.' : 'Koble kabelsettet til fjernlyset og batteriet.'}</li>
          <li>Test: lysene skal tennes sammen med fjernlyset.</li>
        </ol>
      </section>

      {/* «Fungerte det?» – forhåndsvisning av e-post etter en uke */}
      <section aria-labelledby="epost" className="rounded-lg border-2 border-dashed border-linje">
        <h2 id="epost" className="border-b border-linje bg-flate px-4 py-2 text-sm font-semibold">
          Forhåndsvisning: e-post vi sender om en uke (simulert)
        </h2>
        <div className="p-4 text-sm">
          <p className="text-dempet">Emne: Fungerte ekstralyset på {ordre.bil}?</p>
          <p className="mt-2">Hei! For en uke siden fikk du ekstralys fra oss. Fungerte alt som det skulle?</p>
          <div className="mt-3 flex flex-wrap gap-2" aria-hidden="true">
            <span className="rounded-md bg-ok px-3 py-2 font-semibold text-white">Ja, alt virker</span>
            <span className="rounded-md bg-flate px-3 py-2 font-semibold">Nei, jeg trenger hjelp</span>
          </div>
          <p className="mt-3">Svarer du nei, ringer en fagperson deg. Passet noe ikke, gjelder Passer-garantien.</p>
          <p className="mt-2 text-xs text-dempet">Svarene brukes til å forbedre reglene (returårsaker → datakvalitet).</p>
        </div>
      </section>

      {garasje && (
        <p className="text-sm">
          {garasje.merke} {garasje.modell} er lagret i Min garasje.{' '}
          <button type="button" className="knapp-lenke min-h-0" onClick={glemGarasje}>Slett fra Min garasje</button>
        </p>
      )}

      {innst.test && (
        <button
          type="button"
          className="knapp-primar w-full"
          onClick={() => {
            avsluttOppgave('ferdig')
            nav('/tilbakemelding')
          }}
        >
          Jeg er ferdig – gi tilbakemelding
        </button>
      )}
    </div>
  )
}
