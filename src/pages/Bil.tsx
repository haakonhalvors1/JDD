// Bekreft bil + modelltabell + Ukjent-flyt (K1, G2, A1, A5)
import { Navigate, useNavigate } from 'react-router-dom'
import { Brodsmuler, Fagord, FagpersonKnapp, StatusMerke } from '../components/Felles'
import { BilBekreftelse, LedSporsmal } from '../components/BilBekreftelse'
import { produkter } from '../logic/data'
import { useApp } from '../state/AppState'

export function BilSide() {
  const { bil, bilBekreftet, settBil, resultat, ledSvar, settLedSvar } = useApp()
  const nav = useNavigate()
  if (!bil) return <Navigate to="/passer" replace />

  const bilnavn = `${bil.merke} ${bil.modell} ${bil.ar}`

  if (!bilBekreftet) {
    return (
      <div className="mx-auto max-w-2xl">
        <Brodsmuler steg={1} />
        <BilBekreftelse
          vedNei={() => {
            settBil(null)
            nav('/passer')
          }}
        />
      </div>
    )
  }

  const rele = resultat.oppsett?.releId ? produkter.find((p) => p.id === resultat.oppsett!.releId) : undefined

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Brodsmuler steg={1} />
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="h1">{bilnavn}</h1>
        <StatusMerke status={resultat.status} stor />
      </div>

      {/* Bekreftet: modelltabellen (AK-1.3) */}
      {resultat.status === 'bekreftet' && resultat.regel && (
        <section aria-labelledby="mt" className="kort">
          <h2 id="mt" className="h3 mb-2">Dette vet vi om bilen din</h2>
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Modelltabell for {bilnavn}</caption>
            <tbody className="divide-y divide-linje">
              <tr>
                <th scope="row" className="py-2 pr-3 font-semibold">Frontlys</th>
                <td className="py-2">{resultat.regel.frontlys}</td>
              </tr>
              <tr>
                <th scope="row" className="py-2 pr-3 font-semibold"><Fagord ord="Canbus" /></th>
                <td className="py-2">{resultat.regel.canbus === 'nei' ? 'Nei' : `Ja (${resultat.regel.canbus})`}</td>
              </tr>
              <tr>
                <th scope="row" className="py-2 pr-3 font-semibold">Trenger</th>
                <td className="py-2 font-semibold">
                  {resultat.regel.krever === 'rele' ? `${rele?.navn ?? 'Canbus-relé'} (ikke vanlig kabelsett)` : 'Standard kabelsett (ikke relé)'}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 text-xs text-dempet">
            Regel {resultat.regel.id} · Kilde: {resultat.regel.kilde} · Godkjent av {resultat.regel.godkjentAv}, {resultat.regel.godkjentDato} · Eksempeldata
          </p>
        </section>
      )}

      {/* Ukjent: spør med bilde (A1). Ukjent vises aldri som bekreftet (G2). */}
      {resultat.status === 'ukjent' && resultat.nesteSteg === 'spor_led' && (
        <section aria-label="Spørsmål om frontlys" className="kort border-2 border-varsel">
          <p className="mb-3 text-sm">{resultat.begrunnelse} Svar på ett spørsmål, så finner vi ut hva som trengs.</p>
          <LedSporsmal vedSvar={settLedSvar} />
        </section>
      )}

      {resultat.status === 'ukjent' && resultat.nesteSteg === 'fagperson' && (
        <section className="kort border-2 border-varsel" aria-live="polite">
          <h2 className="h2">Ingen fare – en fagperson kan sjekke bilen for deg</h2>
          <p className="mt-2">
            Vi vil ikke gjette. Uten å vite om bilen har LED-frontlys kan vi ikke si om du trenger relé eller kabelsett. En fagperson ser bilen din og kan svare med en gang.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <FagpersonKnapp fra="ukjent_bil" />
            <button type="button" className="knapp-sekundar" disabled>
              Send bilde av frontlyset (kommer)
            </button>
          </div>
          <button type="button" className="knapp-lenke mt-2" onClick={() => settLedSvar(null)}>
            Svar på spørsmålet igjen
          </button>
        </section>
      )}

      {resultat.status === 'regelutledet' && (
        <section className="kort border-2 border-info" aria-live="polite">
          <h2 className="h3">Ut fra svaret ditt ({ledSvar === 'ja' ? 'LED-frontlys' : 'halogen-frontlys'}):</h2>
          <p className="mt-1">{resultat.begrunnelse}</p>
          <p className="mt-2 text-xs text-dempet">Regel {resultat.utledning?.id} · Kilde: {resultat.kilde}</p>
          <button type="button" className="knapp-lenke" onClick={() => settLedSvar(null)}>
            Endre svar
          </button>
        </section>
      )}

      {resultat.status !== 'ukjent' && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" className="knapp-primar" onClick={() => nav('/passer/sporsmal')}>
            Videre: tre korte spørsmål →
          </button>
          <FagpersonKnapp fra="bil" />
        </div>
      )}
    </div>
  )
}
