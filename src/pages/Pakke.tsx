// K2, K3, K7, NF5: Pakke med forklaring. G4 (basis alltid), G5 (trengs ≠ ofte kjøpt), G6 (regel og kilde).
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Brodsmuler, FagpersonKnapp, Fagord, Garantimerke, Garantivilkar, Pris, StatusMerke, Utvid } from '../components/Felles'
import { ProduktBilde } from '../components/Illustrasjoner'
import { kr, LOVMERKNAD } from '../logic/anbefal'
import { sporsmal } from '../logic/data'
import { logg, loggEnGang } from '../logic/logg'
import type { Pakke, Resultat, Svar } from '../logic/typer'
import { overskrifter, useApp } from '../state/AppState'

function svarTekst(svar: Svar) {
  return sporsmal.map((s) => s.valg.find((v) => String(v.verdi) === String(svar[s.id as keyof Svar]))?.tekst).join(' · ')
}

function PakkeKort({ pakke, resultat, trengsTittel }: { pakke: Pakke; resultat: Resultat; trengsTittel: string }) {
  const { leggPakkeIKurv, valgtPakke, kurv } = useApp()
  const nav = useNavigate()
  const iKurv = valgtPakke === pakke.niva && kurv.some((k) => k.type === 'trengs')
  const anbefalt = pakke.niva === 'anbefalt'
  const tittelId = `pakke-${pakke.niva}`

  return (
    <article aria-labelledby={tittelId} className={`kort flex flex-col ${anbefalt ? 'border-2 border-tekst' : 'border-2'}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id={tittelId} className="h2">
            {pakke.tittel}
          </h2>
          <p className="text-sm text-dempet">{anbefalt ? 'For deg som kjører mye i mørket' : 'Det rimeligste som fungerer'}</p>
        </div>
        {resultat.status === 'bekreftet' ? (
          <span className="etikett border border-ok bg-ok-lys text-sm text-ok">
            <span aria-hidden="true">✓</span> Passer din bil
          </span>
        ) : (
          <span className="etikett border border-info bg-info-lys text-sm text-info">
            <span aria-hidden="true">ⓘ</span> Passer ut fra svarene dine
          </span>
        )}
      </div>

      <div className="my-3">
        <p className="text-sm text-dempet">Samlet pris for alt som trengs</p>
        <Pris belop={pakke.sum} />
        {pakke.ekstra && (
          <p className="mt-1 rounded-md bg-flate p-2 text-sm">
            <span className="font-semibold">+{kr(pakke.ekstra.merpris)} mot basis:</span> {pakke.ekstra.tekst}
          </p>
        )}
      </div>

      {/* G5: «Trengs»-seksjonen. Overskriften styres av variant a/b. */}
      <section aria-labelledby={`${tittelId}-trengs`} className="border-l-4 border-aksent pl-3">
        <h3 id={`${tittelId}-trengs`} className="h3 mb-1">
          {trengsTittel}
        </h3>
        <ul className="divide-y divide-linje">
          {pakke.linjer.map((l) => (
            <li key={l.produkt.id} className="py-2">
              <div className="flex gap-3">
                <ProduktBilde kategori={l.produkt.kategori} pro={anbefalt} className="w-16 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {l.antall > 1 && <span>{l.antall} × </span>}
                    {l.produkt.navn}
                  </p>
                  <p className="text-sm text-dempet">{l.produkt.kort}</p>
                  {l.produkt.referansetall && <p className="text-xs text-dempet"><Fagord ord="Referansetall" />: {l.produkt.referansetall.toLocaleString('nb-NO')} per lampe</p>}
                </div>
                <span className="text-sm font-semibold whitespace-nowrap">{kr(l.produkt.pris * l.antall)}</span>
              </div>
              <Utvid tittel="Hvorfor dette?" className="text-sm" vedApning={() => logg('hvorfor_apnet', l.produkt.id)}>
                <div className="rounded-md bg-info-lys p-3">
                  <p>{l.hvorfor}</p>
                  <p className="mt-2 text-xs text-dempet">
                    Regel {l.regelId} · Kilde: {l.kilde}
                  </p>
                </div>
              </Utvid>
            </li>
          ))}
        </ul>
      </section>

      <Utvid tittel="Ikke inkludert" ikon="⊘" className="mt-2 border-t border-linje pt-1" vedApning={() => logg('ikke_inkludert_apnet', pakke.niva)}>
        <ul className="space-y-2 text-sm">
          {pakke.ikkeInkludert.map((i) => (
            <li key={i.tekst} className="rounded-md bg-flate p-2">
              <span className="font-semibold">{i.tekst}</span>{' '}
              <span className={`etikett ml-1 ${i.trengs === 'ja' ? 'bg-varsel-lys text-varsel' : i.trengs === 'nei' ? 'bg-ok-lys text-ok' : 'bg-info-lys text-info'}`}>
                {i.trengs === 'ja' ? 'Trengs, har du det?' : i.trengs === 'nei' ? 'Trengs ikke' : 'Valgfritt'}
              </span>
              <p className="mt-1">{i.forklaring}</p>
            </li>
          ))}
        </ul>
      </Utvid>

      <div className="mt-auto pt-3">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Garantimerke />
          <span className="text-xs text-dempet">På lager · 2–4 virkedager · frakt inkludert</span>
        </div>
        {iKurv ? (
          <div role="status" className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <p className="font-semibold text-ok">✓ Pakken ligger i kurven</p>
            <button type="button" className="knapp-primar sm:ml-auto" onClick={() => nav('/kurv')}>
              Gå til kurven
            </button>
          </div>
        ) : (
          <button type="button" className={anbefalt ? 'knapp-primar w-full' : 'knapp-sekundar w-full'} onClick={() => leggPakkeIKurv(pakke.niva)}>
            Legg hele pakken i kurven ({kr(pakke.sum)})
          </button>
        )}
      </div>
    </article>
  )
}

function EndreSvar() {
  const { svar, settSvar } = useApp()
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {sporsmal.map((s) => (
        <div key={s.id}>
          <label htmlFor={`endre-${s.id}`} className="mb-1 block text-sm font-semibold">
            {s.tittel}
          </label>
          <select
            id={`endre-${s.id}`}
            className="felt"
            value={String(svar[s.id as keyof Svar])}
            onChange={(e) => {
              const v = s.valg.find((x) => String(x.verdi) === e.target.value)!.verdi
              settSvar({ [s.id]: v } as Partial<Svar>)
            }}
          >
            {s.valg.map((v) => (
              <option key={String(v.verdi)} value={String(v.verdi)}>
                {v.tekst}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  )
}

export function PakkeSide() {
  const app = useApp()
  const { bil, bilBekreftet, resultat, harSvart, hoppetOver, svar, innst, leggTilOfte, kurv } = app
  const tekster = overskrifter(innst.variant)
  const [visEndre, setVisEndre] = useState(hoppetOver)

  useEffect(() => {
    if (resultat.pakker) loggEnGang('pakke_vist', innst.variant)
  }, [resultat.pakker, innst.variant])

  if (!bil || !bilBekreftet) return <Navigate to="/passer" replace />
  if (resultat.status === 'ukjent' || !resultat.pakker) return <Navigate to="/passer/bil" replace />
  if (!harSvart) return <Navigate to="/passer/sporsmal" replace />

  return (
    <div className="space-y-5">
      <Brodsmuler steg={3} />
      <div>
        <h1 className="h1">Ekstralys til {bil.merke} {bil.modell} {bil.ar}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <StatusMerke status={resultat.status} />
          <Link to="/passer" className="knapp-lenke min-h-0">Endre bil</Link>
        </div>
      </div>

      <section aria-label="Dine valg" className="rounded-lg bg-flate p-3 text-sm">
        {hoppetOver && <p className="mb-1 font-semibold">Du hoppet over spørsmålene. Vi har brukt de vanligste valgene:</p>}
        <div className="flex flex-wrap items-center gap-2">
          <span>{svarTekst(svar)}</span>
          <button type="button" aria-expanded={visEndre} className="knapp-lenke min-h-0" onClick={() => setVisEndre(!visEndre)}>
            {visEndre ? 'Skjul' : 'Endre valg'}
          </button>
        </div>
        {visEndre && (
          <div className="mt-3">
            <EndreSvar />
          </div>
        )}
      </section>

      {/* Hvorfor denne pakken (G6) */}
      <section aria-labelledby="hvorfor-pakke" className={`kort border-2 ${resultat.status === 'bekreftet' ? 'border-ok' : 'border-info'}`}>
        <h2 id="hvorfor-pakke" className="h3">
          {resultat.oppsett?.krever === 'rele' ? 'Bilen din trenger et Canbus-relé' : 'Bilen din klarer seg med standard kabelsett'}
        </h2>
        <p className="mt-1">{resultat.begrunnelse}</p>
        <Utvid tittel="Hvorfor denne pakken? Regel og kilde" className="text-sm" vedApning={() => logg('hvorfor_apnet', 'pakke')}>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-md bg-flate p-3">
            <dt className="font-semibold">Status</dt>
            <dd>
              <StatusMerke status={resultat.status} />
            </dd>
            <dt className="font-semibold">Regel</dt>
            <dd>{resultat.regel?.id ?? resultat.utledning?.id}</dd>
            <dt className="font-semibold">Kilde</dt>
            <dd>{resultat.kilde}</dd>
            {resultat.regel?.godkjentAv && (
              <>
                <dt className="font-semibold">Godkjent</dt>
                <dd>
                  {resultat.regel.godkjentAv}, {resultat.regel.godkjentDato}
                </dd>
              </>
            )}
          </dl>
          <p className="mt-2 text-xs text-dempet">
            Anbefalingen kommer fra en fast regeltabell som fagpersoner vedlikeholder, ikke fra en chatbot. <Fagord ord="Relé" /> · <Fagord ord="Kabelsett" />
          </p>
        </Utvid>
        {resultat.merknader.slice(1).map((m) => (
          <p key={m} className="mt-2 flex flex-wrap items-center gap-2 rounded-md bg-info-lys p-2 text-sm">
            <span>{m}</span>
            <FagpersonKnapp fra="merknad_rele" variant="lenke" />
          </p>
        ))}
      </section>

      {/* G4: basis alltid synlig, side om side med anbefalt fra desktop */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PakkeKort pakke={resultat.pakker.basis} resultat={resultat} trengsTittel={tekster.trengs} />
        <PakkeKort pakke={resultat.pakker.anbefalt} resultat={resultat} trengsTittel={tekster.trengs} />
      </div>

      <Garantivilkar />

      {/* G5: Ofte kjøpt sammen – visuelt adskilt, aldri forhåndsvalgt, ikke i pakkeprisen */}
      <section aria-labelledby="ofte" className="rounded-lg border-2 border-dashed border-linje bg-flate p-4">
        <h2 id="ofte" className="h2">{tekster.ofte}</h2>
        <p className="mb-3 text-sm text-dempet">Valgfritt. Ikke nødvendig for at lysene skal fungere, og ikke med i pakkeprisen.</p>
        <ul className="grid gap-3 md:grid-cols-3">
          {resultat.ofteKjopt.map((p) => {
            const lagtTil = kurv.some((k) => k.produktId === p.id)
            return (
              <li key={p.id} className="flex gap-3 rounded-md bg-white p-3">
                <ProduktBilde kategori={p.kategori} className="w-14 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold">{p.navn}</p>
                  <p className="text-sm text-dempet">{p.kort}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <Pris belop={p.pris} liten />
                    <button
                      type="button"
                      className="knapp-lenke min-h-10"
                      disabled={lagtTil}
                      onClick={() => leggTilOfte(p.id)}
                      aria-label={lagtTil ? `${p.navn} er lagt i kurven` : `Legg til ${p.navn}`}
                    >
                      {lagtTil ? '✓ Lagt til' : '+ Legg til'}
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      {/* NF5: regler for ekstralys */}
      <aside aria-label="Regler for ekstralys" className="rounded-lg border border-linje p-3 text-sm">
        <p>
          <span className="font-semibold">Regler for ekstralys:</span> {LOVMERKNAD}
        </p>
        <p className="mt-1 text-xs font-semibold text-varsel">Forslag, avklares med JDD.</p>
      </aside>

      <div className="flex flex-col gap-2 rounded-lg bg-flate p-4 sm:flex-row sm:items-center">
        <p className="flex-1">Usikker? En fagperson ser bilen og kurven din og svarer med en gang.</p>
        <FagpersonKnapp fra="pakke" />
      </div>
    </div>
  )
}
