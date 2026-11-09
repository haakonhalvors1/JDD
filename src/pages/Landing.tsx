// Landingsside per bilmodell (dit Google-søket «ekstralys RAV4» leder). Regnr-feltet øverst (AK-1.1).
import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { RegnrSkjema } from '../components/BilSkjema'
import { Fagord, Garantimerke } from '../components/Felles'
import { loggEnGang } from '../logic/logg'

const MODELLER: Record<string, { navn: string; tekst: string }> = {
  'toyota-rav4': {
    navn: 'Toyota RAV4',
    tekst: 'RAV4 fra 2019 og nyere har LED-frontlys og Canbus. Da trengs et Canbus-relé i stedet for et vanlig kabelsett. Vi legger riktig relé i pakken for deg.',
  },
}

export function Landing() {
  const { modell = '' } = useParams()
  const m = MODELLER[modell] ?? { navn: 'bilen din', tekst: '' }
  useEffect(() => loggEnGang('landing', modell), [modell])

  return (
    <div className="space-y-6">
      <nav aria-label="Brødsmuler" className="text-sm text-dempet">
        <Link to="/" className="underline">Forside</Link> › Ekstralys › {m.navn}
      </nav>
      <section className="rounded-xl border-2 border-aksent p-4 md:p-6">
        <h1 className="h1">Ekstralys til {m.navn}</h1>
        <p className="mt-1 mb-4 text-dempet">Sjekk at alt passer før du kjøper. Det tar under ett minutt.</p>
        <RegnrSkjema />
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <Garantimerke />
          <Link to="/passer?modell=1" className="knapp-lenke">Velg årsmodell i stedet</Link>
        </div>
      </section>

      {m.tekst && (
        <section aria-labelledby="visste" className="kort bg-info-lys">
          <h2 id="visste" className="h3">Visste du?</h2>
          <p className="mt-1">
            {m.tekst.split('Canbus')[0]}
            <Fagord ord="Canbus" />
            {m.tekst.split('Canbus').slice(1).join('Canbus')}
          </p>
        </section>
      )}

      <section aria-labelledby="hva">
        <h2 id="hva" className="h2 mb-2">Dette får du med «Passer min bil»</h2>
        <ul className="grid gap-2 md:grid-cols-2">
          {[
            'Bekreftet at pakken passer bilen din',
            'Alt som trengs for å fungere i én ordre, også reléet',
            'Forklaring på hvorfor, og hva som ikke er med',
            'Fagperson på chat eller telefon ved behov',
            'Passer-garanti: fri retur hvis vi anbefalte feil',
            'Basis-pakke alltid synlig, ingen unødvendig mersalg',
          ].map((t) => (
            <li key={t} className="flex gap-2">
              <span aria-hidden="true" className="font-bold text-ok">✓</span>
              {t}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
