import { useId, useState, type ReactNode } from 'react'
import { kr } from '../logic/anbefal'
import { fagord } from '../logic/data'
import type { Status } from '../logic/typer'
import { useApp } from '../state/AppState'

/** G2: status vises med ikon og tekst, ikke bare farge */
export function StatusMerke({ status, stor }: { status: Status; stor?: boolean }) {
  const s = {
    bekreftet: { tekst: 'Bekreftet', ikon: '✓', kl: 'bg-ok-lys text-ok border-ok', hjelp: 'fra modelltabellen, godkjent av fagperson' },
    regelutledet: { tekst: 'Regelutledet', ikon: 'ⓘ', kl: 'bg-info-lys text-info border-info', hjelp: 'ut fra svarene dine' },
    ukjent: { tekst: 'Ukjent', ikon: '?', kl: 'bg-varsel-lys text-varsel border-varsel', hjelp: 'ikke bekreftet ennå' },
  }[status]
  return (
    <span className={`etikett border ${s.kl} ${stor ? 'text-sm px-3 py-1' : ''}`}>
      <span aria-hidden="true">{s.ikon}</span>
      <span>
        {s.tekst}
        <span className="sr-only">: {s.hjelp}</span>
      </span>
    </span>
  )
}

export function Pris({ belop, liten }: { belop: number; liten?: boolean }) {
  return (
    <span className="whitespace-nowrap">
      <span className={liten ? 'font-semibold' : 'text-xl font-bold'}>{kr(belop)}</span>{' '}
      <span className="text-xs font-normal text-dempet">eksempelpris</span>
    </span>
  )
}

/** Disclosure-knapp (AK-3.4): button + aria-expanded */
export function Utvid({
  tittel,
  children,
  vedApning,
  ikon,
  className = '',
}: {
  tittel: ReactNode
  children: ReactNode
  vedApning?: () => void
  ikon?: string
  className?: string
}) {
  const [apen, setApen] = useState(false)
  const id = useId()
  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={apen}
        aria-controls={id}
        onClick={() => {
          if (!apen) vedApning?.()
          setApen(!apen)
        }}
        className="flex min-h-11 w-full items-center justify-between gap-2 text-left font-semibold text-info underline-offset-2 hover:underline"
      >
        <span className="flex items-center gap-2">
          {ikon && <span aria-hidden="true">{ikon}</span>}
          {tittel}
        </span>
        <span aria-hidden="true" className={`transition-transform ${apen ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      <div id={id} hidden={!apen} className="pb-2">
        {children}
      </div>
    </div>
  )
}

/** Forklarer fagord der de brukes (AK-5.3) */
export function Fagord({ ord, children }: { ord: keyof typeof fagord | string; children?: ReactNode }) {
  const [apen, setApen] = useState(false)
  const id = useId()
  return (
    <span className="inline">
      <button
        type="button"
        aria-expanded={apen}
        aria-controls={id}
        onClick={() => setApen(!apen)}
        className="font-semibold text-info underline decoration-dotted underline-offset-4"
      >
        {children ?? ord}
        <span className="sr-only"> – hva betyr dette?</span>
      </button>
      <span id={id} hidden={!apen} className="mt-1 mb-2 block rounded-md bg-info-lys p-2 text-sm text-tekst">
        <strong>{ord}:</strong> {fagord[ord]}
      </span>
    </span>
  )
}

/** K6: «Spør en fagperson» – tilgjengelig fra bilsteget og utover */
export function FagpersonKnapp({ fra, variant = 'sekundar' }: { fra: string; variant?: 'sekundar' | 'lenke' }) {
  const { apneFagperson } = useApp()
  return (
    <button
      type="button"
      onClick={() => apneFagperson(fra)}
      className={variant === 'lenke' ? 'knapp-lenke' : 'knapp-sekundar w-full sm:w-auto'}
    >
      <span aria-hidden="true">💬</span> Spør en fagperson
    </button>
  )
}

export function Garantimerke() {
  return (
    <span className="etikett border border-ok bg-ok-lys text-ok">
      <span aria-hidden="true">🛡</span> Passer-garanti
    </span>
  )
}

export const GARANTI_VILKAR =
  'Hvis «Passer min bil» anbefalte en del som ikke passer bilen din, kan du returnere den uten kostnad innen 60 dager. Vi betaler returfrakten og hjelper deg med riktig del. Gjelder når bilen og svarene dine stemmer med det du oppga.'

export function Garantivilkar() {
  return (
    <Utvid tittel="Vilkår for Passer-garanti" ikon="🛡">
      <p className="text-sm">{GARANTI_VILKAR}</p>
      <p className="mt-2 text-xs font-semibold text-varsel">Forslag, avklares med JDD.</p>
    </Utvid>
  )
}

export function Brodsmuler({ steg }: { steg: 1 | 2 | 3 | 4 }) {
  const navn = ['Bilen din', 'Tre spørsmål', 'Pakke', 'Kasse']
  return (
    <nav aria-label="Fremdrift">
      <ol className="mb-4 flex gap-1 text-xs">
        {navn.map((n, i) => (
          <li
            key={n}
            aria-current={i + 1 === steg ? 'step' : undefined}
            className={`flex-1 border-t-4 pt-1 ${i + 1 <= steg ? 'border-aksent font-semibold text-tekst' : 'border-linje text-dempet'}`}
          >
            {n}
          </li>
        ))}
      </ol>
    </nav>
  )
}
