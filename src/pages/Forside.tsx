import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { RegnrSkjema } from '../components/BilSkjema'
import { Garantimerke } from '../components/Felles'
import { Lampe } from '../components/Illustrasjoner'
import { loggEnGang } from '../logic/logg'

export function Forside() {
  useEffect(() => loggEnGang('landing', 'forside'), [])
  return (
    <div className="space-y-8">
      <section className="grid items-center gap-6 rounded-xl bg-flate p-5 md:grid-cols-2 md:p-8">
        <div>
          <p className="mb-1 text-sm font-semibold text-aksent">Nyhet: Passer min bil</p>
          <h1 className="h1">Ekstralys som passer bilen din – med alt som trengs</h1>
          <p className="mt-2 text-dempet">
            Skriv inn registreringsnummeret. Vi finner ut om bilen har LED-frontlys og Canbus, og setter sammen en komplett pakke med riktig relé.
          </p>
          <div className="mt-4">
            <RegnrSkjema />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <Garantimerke />
            <Link to="/passer?modell=1" className="knapp-lenke">Vet ikke regnr? Velg modell</Link>
          </div>
        </div>
        <Lampe className="mx-auto hidden w-64 md:block" />
      </section>

      <section aria-labelledby="slik">
        <h2 id="slik" className="h2 mb-3">Slik fungerer det</h2>
        <ol className="grid gap-3 md:grid-cols-3">
          {[
            ['1', 'Kjenn bilen', 'Regnr eller merke, modell og år. Vi viser hva bilen har.'],
            ['2', 'Tre korte spørsmål', 'Antall lamper, festemetode og kontakttype. Du kan hoppe over.'],
            ['3', 'Komplett pakke', 'Alt som trengs for å fungere, med forklaring og garanti.'],
          ].map(([n, t, b]) => (
            <li key={n} className="kort flex gap-3">
              <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-aksent font-bold text-white">{n}</span>
              <div>
                <p className="font-bold">{t}</p>
                <p className="text-sm text-dempet">{b}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="pop">
        <h2 id="pop" className="h2 mb-3">Populære bilmodeller</h2>
        <ul className="flex flex-wrap gap-2">
          <li><Link to="/ekstralys/toyota-rav4" className="knapp-sekundar min-h-10 py-2 text-sm">Ekstralys til Toyota RAV4</Link></li>
          {['Volvo XC70', 'VW Golf', 'Kia Sportage'].map((m) => (
            <li key={m}><Link to="/passer" className="knapp-sekundar min-h-10 py-2 text-sm">Ekstralys til {m}</Link></li>
          ))}
        </ul>
      </section>
    </div>
  )
}
