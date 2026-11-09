import { describe, expect, it } from 'vitest'
import { anbefal, finnRegel } from './anbefal'
import { kjoretoy, produkter, standardRegeldata, standardsvar } from './data'
import { slaOppRegnr, normaliserRegnr } from './regnr'
import type { Bil, Regeldata, Svar } from './typer'

const RAV4: Bil = { merke: 'Toyota', modell: 'RAV4', ar: 2022 }
const XC70: Bil = { merke: 'Volvo', modell: 'XC70', ar: 2012 }
const KIA: Bil = { merke: 'Kia', modell: 'Sportage', ar: 2019 }
const svar2: Svar = { lamper: 2, feste: 'grill', kontakt: 'ingen' }

const kjor = (bil: Bil | null, ledSvar: 'ja' | 'nei' | 'vet_ikke' | null = null, svar: Svar = svar2, regeldata: Regeldata = standardRegeldata) =>
  anbefal({ bil, ledSvar, svar, regeldata, produkter })

const ider = (linjer: { produkt: { id: string } }[]) => linjer.map((l) => l.produkt.id)

describe('regnr-oppslag (simulert)', () => {
  it('normaliserer mellomrom og små bokstaver', () => {
    expect(normaliserRegnr(' pm 22 022 ')).toBe('PM22022')
    expect(slaOppRegnr('pm 22022', kjoretoy)).toMatchObject(RAV4)
  })
  it('gir null for regnr uten treff', () => {
    expect(slaOppRegnr('ZZ99999', kjoretoy)).toBeNull()
  })
})

describe('Scenario 1: Toyota RAV4 2022 (LED + CAN FD) – hovedscenario', () => {
  const r = kjor(RAV4)

  it('er Bekreftet fra godkjent regel R-001', () => {
    expect(r.status).toBe('bekreftet')
    expect(r.regel?.id).toBe('R-001')
    expect(r.oppsett).toMatchObject({ frontlys: 'LED', canbus: 'CAN FD', krever: 'rele' })
  })

  it('K2: begge pakker har lys, brakett og CAN FD-relé', () => {
    for (const p of [r.pakker!.basis, r.pakker!.anbefalt]) {
      expect(ider(p.linjer)).toContain('REL-CANFD')
      expect(p.linjer.map((l) => l.rolle)).toEqual(expect.arrayContaining(['lys', 'brakett', 'tilkobling']))
    }
  })

  it('negativt: inneholder aldri kabelsett eller feil relé', () => {
    for (const p of [r.pakker!.basis, r.pakker!.anbefalt]) {
      const id = ider(p.linjer)
      expect(id).not.toContain('KAB-2')
      expect(id).not.toContain('KAB-4')
      expect(id).not.toContain('REL-CAN')
      expect(id).not.toContain('REL-UNI')
    }
  })

  it('K3: hver linje har hvorfor, regel-ID og kilde, og reléet forklarer Canbus', () => {
    for (const l of r.pakker!.basis.linjer) {
      expect(l.hvorfor.length).toBeGreaterThan(10)
      expect(l.regelId).toBeTruthy()
      expect(l.kilde).toBeTruthy()
    }
    const rele = r.pakker!.basis.linjer.find((l) => l.rolle === 'tilkobling')!
    expect(rele.regelId).toBe('R-001')
    expect(rele.hvorfor).toMatch(/Canbus/)
    expect(r.pakker!.basis.ikkeInkludert.some((i) => i.tekst === 'Vanlig kabelsett' && i.trengs === 'nei')).toBe(true)
  })

  it('G4: basis finnes og er billigere enn anbefalt, og merprisen forklares', () => {
    const { basis, anbefalt } = r.pakker!
    expect(basis.sum).toBeLessThan(anbefalt.sum)
    expect(anbefalt.ekstra?.merpris).toBe(anbefalt.sum - basis.sum)
    expect(anbefalt.ekstra?.tekst).toMatch(/rekkevidde/)
    // Relé og brakett er de samme i begge
    expect(ider(basis.linjer).slice(1)).toEqual(ider(anbefalt.linjer).slice(1))
  })

  it('G5: «Ofte kjøpt sammen» er aldri en del av pakken', () => {
    const ofte = r.ofteKjopt.map((p) => p.id)
    expect(ofte.length).toBeGreaterThan(0)
    for (const p of [r.pakker!.basis, r.pakker!.anbefalt]) {
      expect(ider(p.linjer).some((id) => ofte.includes(id))).toBe(false)
    }
  })

  it('4 lamper: to sett, to braketter og forgreningskabel til reléet', () => {
    const p = kjor(RAV4, null, { lamper: 4, feste: 'stotfanger', kontakt: 'ingen' }).pakker!.basis
    expect(p.linjer.find((l) => l.rolle === 'lys')).toMatchObject({ antall: 2, produkt: { id: 'LYS-N9-2' } })
    expect(p.linjer.find((l) => l.rolle === 'brakett')).toMatchObject({ antall: 2, produkt: { id: 'BRK-STOT' } })
    expect(ider(p.linjer)).toContain('FGR-4')
  })

  it('original ekstralyskontakt endrer ikke behovet for relé', () => {
    const p = kjor(RAV4, null, { lamper: 2, feste: 'grill', kontakt: 'original' }).pakker!.basis
    expect(ider(p.linjer)).toContain('REL-CANFD')
    expect(ider(p.linjer)).not.toContain('PNP-ORIG')
  })

  it('er deterministisk (G1): samme input gir samme output', () => {
    expect(kjor(RAV4)).toEqual(kjor(RAV4))
  })
})

describe('Scenario 2: Volvo XC70 2012 (halogen, uten Canbus)', () => {
  const r = kjor(XC70)

  it('er Bekreftet og krever standard kabelsett', () => {
    expect(r.status).toBe('bekreftet')
    expect(r.regel?.id).toBe('R-002')
    expect(ider(r.pakker!.basis.linjer)).toContain('KAB-2')
  })

  it('negativt: inneholder aldri relé (aldri dyrere enn nødvendig)', () => {
    for (const p of [r.pakker!.basis, r.pakker!.anbefalt]) {
      expect(p.linjer.some((l) => l.produkt.kategori === 'rele')).toBe(false)
    }
    expect(r.pakker!.basis.ikkeInkludert.some((i) => i.tekst === 'Canbus-relé' && i.trengs === 'nei')).toBe(true)
  })

  it('4 lamper gir kabelsett for 4, original kontakt gir plug-and-play', () => {
    expect(ider(kjor(XC70, null, { lamper: 4, feste: 'grill', kontakt: 'ingen' }).pakker!.basis.linjer)).toContain('KAB-4')
    const pnp = ider(kjor(XC70, null, { lamper: 2, feste: 'grill', kontakt: 'original' }).pakker!.basis.linjer)
    expect(pnp).toContain('PNP-ORIG')
    expect(pnp).not.toContain('KAB-2')
  })

  it('1 lampe gir enkeltlampe og én brakett', () => {
    const p = kjor(XC70, null, { lamper: 1, feste: 'tak', kontakt: 'ingen' }).pakker!.basis
    expect(p.linjer.find((l) => l.rolle === 'lys')).toMatchObject({ antall: 1, produkt: { id: 'LYS-N9-1' } })
    expect(p.linjer.find((l) => l.rolle === 'brakett')).toMatchObject({ antall: 1, produkt: { id: 'BRK-TAK' } })
    expect(p.ikkeInkludert[0].tekst).toMatch(/Takstativ/)
  })
})

describe('Scenario 3: Kia Sportage 2019 – ingen godkjent regel', () => {
  it('uten svar er status Ukjent, uten pakke, og spør om LED-frontlys (G2)', () => {
    const r = kjor(KIA)
    expect(r.status).toBe('ukjent')
    expect(r.status).not.toBe('bekreftet')
    expect(r.pakker).toBeNull()
    expect(r.nesteSteg).toBe('spor_led')
    expect(r.begrunnelse).toMatch(/ikke godkjent/) // R-004 finnes som utkast
  })

  it('«Vet ikke» gir fortsatt Ukjent og sender til fagperson', () => {
    const r = kjor(KIA, 'vet_ikke')
    expect(r.status).toBe('ukjent')
    expect(r.nesteSteg).toBe('fagperson')
    expect(r.pakker).toBeNull()
  })

  it('«Ja, LED» gir Regelutledet med universalrelé og merknad om fagperson', () => {
    const r = kjor(KIA, 'ja')
    expect(r.status).toBe('regelutledet')
    expect(r.utledning?.id).toBe('U-001')
    expect(ider(r.pakker!.basis.linjer)).toContain('REL-UNI')
    expect(ider(r.pakker!.basis.linjer)).not.toContain('KAB-2')
    expect(r.merknader.join(' ')).toMatch(/rimeligere relé/)
  })

  it('«Nei, halogen» gir Regelutledet med kabelsett og uten relé', () => {
    const r = kjor(KIA, 'nei')
    expect(r.status).toBe('regelutledet')
    expect(ider(r.pakker!.basis.linjer)).toContain('KAB-2')
    expect(r.pakker!.basis.linjer.some((l) => l.produkt.kategori === 'rele')).toBe(false)
  })

  it('AK-4.4: når fagperson godkjenner R-004, blir bilen Bekreftet', () => {
    const godkjent: Regeldata = {
      ...standardRegeldata,
      regler: standardRegeldata.regler.map((r) => (r.id === 'R-004' ? { ...r, status: 'godkjent' as const } : r)),
    }
    const r = kjor(KIA, null, svar2, godkjent)
    expect(r.status).toBe('bekreftet')
    expect(ider(r.pakker!.basis.linjer)).toContain('REL-CAN')
  })

  it('AK-4.4: når en godkjent regel settes til utkast, faller RAV4 til Ukjent', () => {
    const utkast: Regeldata = {
      ...standardRegeldata,
      regler: standardRegeldata.regler.map((r) => (r.id === 'R-001' ? { ...r, status: 'utkast' as const } : r)),
    }
    expect(kjor(RAV4, null, svar2, utkast).status).toBe('ukjent')
  })

  it('bil utenfor årsintervallet får ikke regelen', () => {
    expect(finnRegel({ ...RAV4, ar: 2015 }, standardRegeldata.regler).godkjent).toBeUndefined()
    expect(kjor({ ...RAV4, ar: 2015 }).status).toBe('ukjent')
  })

  it('ukjent bil (null) er Ukjent', () => {
    expect(kjor(null).status).toBe('ukjent')
  })
})

describe('Hopp over veilederen (A2)', () => {
  it('standardsvar gir komplett pakke, og bilens oppsett gjelder fortsatt', () => {
    expect(standardsvar).toEqual({ lamper: 2, feste: 'grill', kontakt: 'vet_ikke' })
    const r = kjor(RAV4, null, standardsvar)
    expect(ider(r.pakker!.basis.linjer)).toEqual(['LYS-N9-2', 'BRK-GRILL', 'REL-CANFD'])
    const x = kjor(XC70, null, standardsvar)
    expect(ider(x.pakker!.basis.linjer)).toContain('KAB-2')
  })
})

describe('G3: pakken har alltid nøyaktig én tilkobling for alle kombinasjoner', () => {
  const lamper = [1, 2, 4] as const
  const fester = ['grill', 'stotfanger', 'tak'] as const
  const kontakter = ['original', 'ingen', 'vet_ikke'] as const
  for (const bil of [RAV4, XC70]) {
    it(`${bil.merke} ${bil.modell}`, () => {
      for (const l of lamper) for (const f of fester) for (const k of kontakter) {
        const r = kjor(bil, null, { lamper: l, feste: f, kontakt: k })
        for (const p of [r.pakker!.basis, r.pakker!.anbefalt]) {
          expect(p.linjer.filter((x) => x.rolle === 'tilkobling')).toHaveLength(1)
          expect(p.linjer.filter((x) => x.rolle === 'lys')).toHaveLength(1)
          expect(p.linjer.filter((x) => x.rolle === 'brakett')).toHaveLength(1)
          expect(p.sum).toBe(p.linjer.reduce((s, x) => s + x.produkt.pris * x.antall, 0))
        }
      }
    })
  }
})
