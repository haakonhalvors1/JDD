import { describe, expect, it } from 'vitest'
import { anbefal } from './anbefal'
import { arFor, erKomplett, modellerFor, populaereModeller, tomVelger, velgerReducer, velgerTilBil } from './bilvelger'
import { kjoretoy, produkter, standardRegeldata, standardsvar } from './data'

const status = (bil: ReturnType<typeof velgerTilBil>) =>
  anbefal({ bil, ledSvar: null, svar: standardsvar, regeldata: standardRegeldata, produkter }).status

describe('Populære bilmodeller', () => {
  it('genereres fra kjoretoy.json med RAV4 2022 først og alle testbilene etter', () => {
    const p = populaereModeller()
    expect(p[0].tekst).toBe('Toyota RAV4 2022')
    expect(p.map((x) => x.tekst).sort()).toEqual(kjoretoy.map((k) => `${k.merke} ${k.modell} ${k.ar}`).sort())
  })

  it('hver populær modell kan velges i velgeren (merke → modell → år)', () => {
    for (const p of populaereModeller()) {
      expect(modellerFor(p.merke)).toContain(p.modell)
      expect(arFor(p.merke, p.modell)).toContain(p.ar)
    }
  })

  it('trykk på RAV4 2022 fyller ut alle tre feltene og gir status Bekreftet', () => {
    const p = populaereModeller()[0]
    const v = velgerReducer(tomVelger, { type: 'fyll', ...p })
    expect(v).toEqual({ merke: 'Toyota', modell: 'RAV4', ar: '2022' })
    expect(erKomplett(v)).toBe(true)
    expect(status(velgerTilBil(v))).toBe('bekreftet')
  })

  it('trykk på bilen uten godkjent regel (Kia Sportage 2019) gir status Ukjent', () => {
    const kia = populaereModeller().find((p) => p.modell === 'Sportage')!
    const v = velgerReducer(tomVelger, { type: 'fyll', ...kia })
    expect(erKomplett(v)).toBe(true)
    expect(status(velgerTilBil(v))).toBe('ukjent')
  })
})

describe('Velgeren: avhengige lister og nullstilling', () => {
  it('modell-listen avhenger av merke, og år-listen av modell', () => {
    expect(modellerFor('')).toEqual([])
    expect(modellerFor('Volvo')).toEqual(['V90', 'XC60', 'XC70'])
    expect(arFor('Volvo', '')).toEqual([])
    expect(arFor('Volvo', 'XC70')[0]).toBe(2016)
    expect(arFor('Volvo', 'XC70').at(-1)).toBe(2005)
    expect(arFor('Volvo', 'V90').at(-1)).toBe(2016)
  })

  it('bytte av merke nullstiller modell og år', () => {
    const v = velgerReducer(velgerReducer(tomVelger, { type: 'fyll', merke: 'Toyota', modell: 'RAV4', ar: 2022 }), { type: 'merke', verdi: 'Volvo' })
    expect(v).toEqual({ merke: 'Volvo', modell: '', ar: '' })
  })

  it('bytte av modell nullstiller år', () => {
    const v = velgerReducer({ merke: 'Toyota', modell: 'RAV4', ar: '2022' }, { type: 'modell', verdi: 'Hilux' })
    expect(v).toEqual({ merke: 'Toyota', modell: 'Hilux', ar: '' })
  })

  it('samme merke på nytt nullstiller ikke', () => {
    const fylt = { merke: 'Toyota', modell: 'RAV4', ar: '2022' }
    expect(velgerReducer(fylt, { type: 'merke', verdi: 'Toyota' })).toBe(fylt)
  })

  it('ugyldige verdier godtas ikke', () => {
    expect(velgerReducer(tomVelger, { type: 'fyll', merke: 'Tesla', modell: 'Model 3', ar: 2022 })).toEqual(tomVelger)
    expect(velgerReducer(tomVelger, { type: 'fyll', merke: 'Volvo', modell: 'XC70', ar: 2022 })).toEqual({ merke: 'Volvo', modell: 'XC70', ar: '' })
    expect(velgerReducer({ merke: 'Volvo', modell: 'V90', ar: '' }, { type: 'ar', verdi: '2010' }).ar).toBe('')
  })
})
