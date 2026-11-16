import { describe, expect, it } from 'vitest'
import { erAvsluttet, nyOppgave, overgang, type OppgaveTilstand } from './testtilstand'

const T0 = '2026-11-16T10:00:00.000Z'
const T1 = '2026-11-16T10:02:05.000Z'

const start = (t: OppgaveTilstand = nyOppgave()) => overgang(t, { type: 'start', tid: T0 })

describe('testtilstand: ikke_startet → pagar → fullfort | avbrutt', () => {
  it('ny oppgave er ikke_startet', () => {
    expect(nyOppgave()).toEqual({ status: 'ikke_startet' })
  })

  it('start: ikke_startet → pagar', () => {
    const r = start()
    expect(r.endret).toBe(true)
    expect(r.tilstand).toEqual({ status: 'pagar', startet: T0 })
  })

  it('Ferdig: pagar → fullfort med tid brukt', () => {
    const r = overgang(start().tilstand, { type: 'fullfor', tid: T1 })
    expect(r.endret).toBe(true)
    expect(r.tilstand).toMatchObject({ status: 'fullfort', avsluttet: T1, sekunder: 125 })
    expect(r.tilstand.stoppetVed).toBeUndefined()
  })

  it('Gi opp: pagar → avbrutt med tid brukt og hvor det stoppet', () => {
    const r = overgang(start().tilstand, { type: 'avbryt', tid: T1, stoppetVed: 'pakke_vist @ /passer/pakke' })
    expect(r.endret).toBe(true)
    expect(r.tilstand).toMatchObject({ status: 'avbrutt', sekunder: 125, stoppetVed: 'pakke_vist @ /passer/pakke' })
  })

  it('Ferdig og Gi opp gir ulik status', () => {
    const p = start().tilstand
    expect(overgang(p, { type: 'fullfor', tid: T1 }).tilstand.status).not.toBe(
      overgang(p, { type: 'avbryt', tid: T1, stoppetVed: 'x' }).tilstand.status,
    )
  })

  it('ulovlige overganger endrer ingenting', () => {
    const ny = nyOppgave()
    expect(overgang(ny, { type: 'fullfor', tid: T1 })).toEqual({ tilstand: ny, endret: false })
    expect(overgang(ny, { type: 'avbryt', tid: T1, stoppetVed: 'x' })).toEqual({ tilstand: ny, endret: false })
    const pagar = start().tilstand
    expect(overgang(pagar, { type: 'start', tid: T1 }).endret).toBe(false)
  })

  it('en avsluttet oppgave kan ikke startes, fullføres eller avbrytes på nytt', () => {
    for (const slutt of [
      overgang(start().tilstand, { type: 'fullfor', tid: T1 }).tilstand,
      overgang(start().tilstand, { type: 'avbryt', tid: T1, stoppetVed: 'x' }).tilstand,
    ]) {
      expect(erAvsluttet(slutt)).toBe(true)
      expect(overgang(slutt, { type: 'start', tid: T1 }).endret).toBe(false)
      expect(overgang(slutt, { type: 'fullfor', tid: T1 }).endret).toBe(false)
      expect(overgang(slutt, { type: 'avbryt', tid: T1, stoppetVed: 'y' }).endret).toBe(false)
    }
  })
})
