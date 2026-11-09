import { describe, expect, it } from 'vitest'
import { komplettOrdre, nesteId, sekunderPaOppgave, stoppetVed, tilCsv, type Okt } from './logg'

const okt: Okt = {
  uuid: '00000000-0000-0000-0000-000000000001', id: 'T1', start: '2026-11-09T10:00:00.000Z', test: true, oppgave: 1, variant: 'b',
  hendelser: [
    { navn: 'landing', tid: '2026-11-09T10:00:00.000Z' },
    { navn: 'bil_bekreftet', tid: '2026-11-09T10:00:20.000Z' },
    { navn: 'veileder_hoppet_over', tid: '2026-11-09T10:00:30.000Z' },
    { navn: 'pakke_vist', tid: '2026-11-09T10:00:31.000Z', detalj: 'b' },
    { navn: 'bestilt', tid: '2026-11-09T10:02:05.000Z', detalj: 'komplett' },
  ],
  slutt: { type: 'ferdig', tid: '2026-11-09T10:02:10.000Z' },
  tilbakemelding: { trygghet: 4, unodvendig: 'ja', unodvendigHva: 'bryter; deksel', hjelpEllerMersalg: 5, fritekst: 'Bra "relé"-forklaring' },
}

describe('testlogg', () => {
  it('regner ut tid, siste steg og komplett ordre', () => {
    expect(sekunderPaOppgave(okt)).toBe(130)
    expect(stoppetVed(okt)).toBe('bestilt')
    expect(komplettOrdre(okt)).toBe(true)
    expect(nesteId([okt, { ...okt, id: 'T7' }])).toBe('T8')
  })

  it('CSV har BOM, semikolon, én rad per hendelse og escaper spesialtegn', () => {
    const csv = tilCsv([okt])
    expect(csv.startsWith('﻿')).toBe(true)
    const rader = csv.slice(1).split('\r\n')
    expect(rader).toHaveLength(1 + okt.hendelser.length)
    expect(rader[0].split(';')).toContain('veileder_hoppet_over')
    expect(rader[1]).toMatch(/^T1;1;b;ja;landing;/)
    expect(csv).toContain('"bryter; deksel"')
    expect(csv).toContain('"Bra ""relé""-forklaring"')
  })
})
