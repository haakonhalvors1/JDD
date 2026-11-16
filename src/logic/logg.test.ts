import { describe, expect, it } from 'vitest'
import { nesteId, oppgaveRader, stoppetVed, tilCsv, type Okt } from './logg'

const base = { uuid: 'u', start: '2026-11-16T10:00:00.000Z', test: true, variant: 'b' as const }

const fullfort: Okt = {
  ...base, uuid: 'u1', id: 'T1',
  oppgaver: {
    1: { status: 'fullfort', startet: '2026-11-16T10:00:00.000Z', avsluttet: '2026-11-16T10:02:05.000Z', sekunder: 125,
      tilbakemelding: { trygghet: 4, unodvendig: 'ja', unodvendigHva: 'bryter; deksel', hjelpEllerMersalg: 5, fritekst: 'Bra "relé"-forklaring' } },
    2: { status: 'ikke_startet' },
  },
  hendelser: [
    { navn: 'oppgave_startet', tid: '2026-11-16T10:00:00.000Z', oppgave: 1 },
    { navn: 'landing', tid: '2026-11-16T10:00:01.000Z', oppgave: 1 },
    { navn: 'bil_bekreftet', tid: '2026-11-16T10:00:20.000Z', oppgave: 1 },
    { navn: 'pakke_vist', tid: '2026-11-16T10:00:31.000Z', oppgave: 1 },
    { navn: 'bestilt', tid: '2026-11-16T10:02:00.000Z', detalj: 'komplett', oppgave: 1 },
    { navn: 'oppgave_fullfort', tid: '2026-11-16T10:02:05.000Z', oppgave: 1 },
  ],
}

const avbrutt: Okt = {
  ...base, uuid: 'u2', id: 'T2', variant: 'a',
  oppgaver: {
    1: { status: 'avbrutt', sekunder: 40, stoppetVed: 'pakke_vist @ /passer/pakke', arsak: 'usikker_pakke', arsakFritekst: '' },
    2: { status: 'ikke_startet' },
  },
  hendelser: [
    { navn: 'pakke_vist', tid: '2026-11-16T11:00:30.000Z', oppgave: 1 },
    { navn: 'oppgave_avbrutt', tid: '2026-11-16T11:00:40.000Z', oppgave: 1 },
  ],
}

describe('testlogg', () => {
  it('neste testperson-ID og siste funnel-steg', () => {
    expect(nesteId([fullfort, { ...avbrutt, id: 'T7' }])).toBe('T8')
    expect(stoppetVed(fullfort)).toBe('bestilt')
  })

  it('én rad per testperson og startet oppgave, med status, tid og stoppet ved', () => {
    const r = oppgaveRader([fullfort, avbrutt])
    expect(r).toHaveLength(2)
    expect(r[0]).toMatchObject({ testperson: 'T1', oppgave: 1, status: 'fullfort', tidSekunder: 125, stoppetVed: 'bestilt' })
    expect(r[1]).toMatchObject({ testperson: 'T2', oppgave: 1, status: 'avbrutt', tidSekunder: 40, stoppetVed: 'pakke_vist @ /passer/pakke' })
    expect(r[1].svar).toContain('Usikker på om pakken passet')
  })

  it('CSV har BOM, semikolon, de nye kolonnene og ulik status for fullført og avbrutt', () => {
    const csv = tilCsv([fullfort, avbrutt])
    expect(csv.startsWith('﻿')).toBe(true)
    const rader = csv.slice(1).split('\r\n')
    expect(rader[0].split(';').slice(0, 7)).toEqual(['testperson', 'oppgave', 'variant', 'status', 'tid_sekunder', 'stoppet_ved', 'svar'])
    expect(rader[1]).toMatch(/^T1;1;b;fullført;125;bestilt;/)
    expect(rader[2]).toMatch(/^T2;1;a;avbrutt;40;pakke_vist @ \/passer\/pakke;/)
    expect(csv).toContain('bryter; deksel')
    expect(csv).toContain('""relé""')
  })
})
