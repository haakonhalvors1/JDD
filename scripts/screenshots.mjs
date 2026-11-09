// Skjermbilder av alle hovedskjermer (mobil 390 px og desktop 1280 px) + axe-sjekk (WCAG 2.1 AA)
// + ende-til-ende-sjekker av hovedflyt og alternative flyter.
// Bruk: npm run build && npx vite preview --port 4173 & npm run screenshots
import { chromium } from 'playwright'
import { AxeBuilder } from '@axe-core/playwright'
import { mkdirSync, writeFileSync } from 'node:fs'

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/JDD/'
const UT = 'docs/screenshots'
mkdirSync(UT, { recursive: true })

const VISNINGER = [
  { navn: 'mobil', viewport: { width: 390, height: 844 } },
  { navn: 'desktop', viewport: { width: 1280, height: 900 } },
]

const resultater = { axe: {}, sjekker: [] }
const sjekk = (navn, ok, detalj = '') => {
  resultater.sjekker.push({ navn, ok, detalj })
  console.log(`${ok ? '✔' : '✘'} ${navn}${detalj ? ` – ${detalj}` : ''}`)
}

async function axe(page, navn) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const alvorlige = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact))
  resultater.axe[navn] = r.violations.map((v) => ({ id: v.id, impact: v.impact, antall: v.nodes.length }))
  if (alvorlige.length) console.log(`  axe ${navn}:`, alvorlige.map((v) => `${v.id} (${v.nodes.length})`).join(', '))
  return alvorlige.length
}

async function bilde(page, visning, navn, { full = true } = {}) {
  await page.waitForTimeout(150)
  await page.screenshot({ path: `${UT}/${visning}-${navn}.png`, fullPage: full })
}

async function ingenHorisontalScroll(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
}

const browser = await chromium.launch()

for (const v of VISNINGER) {
  const ctx = await browser.newContext({ viewport: v.viewport, deviceScaleFactor: 2, locale: 'nb-NO' })
  const page = await ctx.newPage()
  const feil = []
  page.on('pageerror', (e) => feil.push(e.message))
  let axeAvvik = 0
  const steg = async (navn, opts) => {
    await bilde(page, v.navn, navn, opts)
    axeAvvik += await axe(page, `${v.navn}-${navn}`)
    if (v.navn === 'mobil' && !(await ingenHorisontalScroll(page))) sjekk(`Ingen horisontal scroll (${navn})`, false)
  }

  // --- Hovedflyt: RAV4 (testmodus, variant a) ---
  await page.goto(`${BASE}?test=1&oppgave=1&variant=a#/`)
  await steg('01-forside')
  await page.goto(`${BASE}#/ekstralys/toyota-rav4`)
  if (v.navn === 'mobil') {
    const synlig = await page.locator('#regnr').evaluate((el) => el.getBoundingClientRect().bottom <= window.innerHeight)
    sjekk('AK-1.1 Regnr-felt synlig uten scroll på 390 px', synlig)
  }
  await steg('02-landingsside-rav4')
  await page.fill('#regnr', 'pm 22 022')
  await page.click('button:has-text("Finn bilen")')
  await page.locator('h1:has-text("stemmer det?")').waitFor()
  sjekk('AK-1.2 «Toyota RAV4 2022 – stemmer det?»', await page.locator('h1:has-text("Toyota RAV4 2022 – stemmer det?")').isVisible())
  await steg('03-bekreft-bil')
  await page.click('button:has-text("Ja, det er bilen min")')
  sjekk('AK-1.3 Modelltabell viser CAN FD og Bekreftet', (await page.textContent('main')).includes('CAN FD') && (await page.textContent('main')).includes('Bekreftet'))
  await steg('04-modelltabell')
  await page.click('button:has-text("Videre")')
  await steg('05-sporsmal-1')
  await page.locator('button:has-text("Hva betyr dette?")').click()
  await steg('06-sporsmal-forklaring')
  await page.click('button:has-text("Neste")')
  await page.click('button:has-text("Neste")')
  await steg('07-sporsmal-3')
  await page.click('button:has-text("Vis pakken min")')
  await page.locator('h1:has-text("Ekstralys til")').waitFor()
  const pakketekst = await page.textContent('main')
  sjekk('AK-2.1 RAV4-pakken har CAN FD-relé', pakketekst.includes('Canbus-relé CAN FD'))
  sjekk('AK-1.6 RAV4-pakken har ikke kabelsett', !pakketekst.includes('Kabelsett med relé'))
  sjekk('G4 Basis og anbefalt vises', pakketekst.includes('Basis') && pakketekst.includes('Anbefalt'))
  sjekk('Variant a: «Trengs for å fungere»', pakketekst.includes('Trengs for å fungere'))
  await steg('08-pakke')
  await page.locator('button:has-text("Hvorfor dette?")').nth(2).click()
  await page.locator('button:has-text("Ikke inkludert")').first().click()
  sjekk('AK-3.3 «Hvorfor dette?» for relé nevner Canbus og regel R-001', (await page.locator('[id] >> text=Regel R-001').count()) > 0)
  await steg('09-pakke-hvorfor-ikke-inkludert')
  await page.locator('button:has-text("Legg hele pakken i kurven")').first().click()
  await page.locator('main button:has-text("Spør en fagperson")').first().click()
  await page.click('button:has-text("Kan jeg montere dette selv?")')
  sjekk('AK-6.2 Fagperson ser bil og kurv', (await page.locator('dialog').textContent()).includes('Canbus-relé CAN FD'))
  await bilde(page, v.navn, '10-fagperson-chat', { full: false })
  axeAvvik += await axe(page, `${v.navn}-10-fagperson-chat`)
  await page.click('button[role="tab"]:has-text("Ring meg tilbake")')
  await bilde(page, v.navn, '11-fagperson-ring-meg', { full: false })
  await page.click('dialog button[aria-label="Lukk"]')
  await page.goto(`${BASE}#/kurv`)
  await steg('12-kurv')
  await page.click('button[aria-label^="Fjern Canbus-relé"]')
  sjekk('AK-2.5 Advarsel når relé fjernes', await page.locator('[role="alert"]:has-text("vil lysene ikke fungere")').isVisible())
  await steg('13-kurv-advarsel')
  await page.click('button:has-text("Legg tilbake det som mangler")')
  await page.click('button:has-text("Til kassen")')
  await steg('14-kasse')
  sjekk('AK-1.7 Samtykke ikke forhåndsavkrysset', !(await page.locator('input[type=checkbox]').isChecked()))
  await page.click('button:has-text("Bestill hele pakken")')
  await page.locator('h1:has-text("Takk for bestillingen")').waitFor()
  await steg('15-bekreftelse')
  const lsNokler = await page.evaluate(() => Object.keys(localStorage).join(','))
  sjekk('AK-1.7 Regnr ikke lagret uten samtykke', !(await page.evaluate(() => JSON.stringify(localStorage))).includes('PM22022'), lsNokler)
  await page.click('button:has-text("Jeg er ferdig")')
  await steg('16-tilbakemelding')
  await page.locator('label:has-text("4")').first().click()
  await page.locator('label:has-text("Nei")').click()
  await page.locator('fieldset').nth(2).locator('label:has-text("5")').click()
  await page.click('button:has-text("Send tilbakemelding")')

  // --- Testlogg og innsikt ---
  await page.goto(`${BASE}#/testlogg`)
  await page.locator('button:has-text("hendelser")').first().click()
  const loggtekst = await page.textContent('main')
  for (const h of ['Landing', 'Bil bekreftet', 'Spørsmål ferdig', 'Pakke vist', '«Hvorfor dette?» åpnet', '«Ikke inkludert» åpnet', 'Fagperson åpnet', 'Lagt i kurv', 'Bestilt']) {
    if (v.navn === 'mobil') sjekk(`Logg: ${h}`, loggtekst.includes(h))
  }
  await steg('17-testlogg')
  await page.goto(`${BASE}#/innsikt`)
  await steg('18-innsikt')

  // --- A1: Ukjent bil (Kia Sportage 2019) ---
  await page.evaluate(() => sessionStorage.clear())
  await page.goto(`${BASE}?test=0#/passer`)
  await page.reload()
  await page.fill('#regnr', 'PM19019')
  await page.click('button:has-text("Finn bilen")')
  await page.click('button:has-text("Ja, det er bilen min")')
  const ukjenttekst = await page.textContent('main')
  sjekk('G2 Kia vises som Ukjent, ikke Bekreftet', ukjenttekst.includes('Ukjent') && !ukjenttekst.includes('Bekreftet'))
  await steg('19-ukjent-led-sporsmal')
  await page.click('button:has-text("Vet ikke")')
  sjekk('A1 «Vet ikke» tilbyr fagperson', await page.locator('main button:has-text("Spør en fagperson")').isVisible())
  await steg('20-ukjent-vet-ikke')
  await page.click('button:has-text("Svar på spørsmålet igjen")')
  await page.click('button:has-text("Ja, LED")')
  sjekk('AK-2.3 «Ja, LED» gir Regelutledet', (await page.textContent('main')).includes('Regelutledet'))
  await steg('21-regelutledet')
  await page.click('button:has-text("Videre")')
  await page.click('button:has-text("Hopp over")')
  await page.locator('h1:has-text("Ekstralys til")').waitFor()
  const kiatekst = await page.textContent('main')
  sjekk('AK-2.3 Universalrelé + merknad om rimeligere relé', kiatekst.includes('Universalrelé') && kiatekst.includes('rimeligere relé'))
  sjekk('AK-5.4 Hopp over viser standardvalg', kiatekst.includes('Du hoppet over spørsmålene'))
  await steg('22-pakke-regelutledet-hoppet-over')

  // --- A4: modellvelger + XC70 (halogen) ---
  await page.goto(`${BASE}#/passer?modell=1`)
  await page.selectOption('#merke', 'Volvo')
  await page.selectOption('#modell', 'XC70')
  await page.selectOption('#ar', '2012')
  await steg('23-modellvelger')
  await page.click('button:has-text("Velg denne bilen")')
  await page.click('button:has-text("Ja, det er bilen min")')
  await page.click('button:has-text("Videre")')
  await page.click('button:has-text("Hopp over")')
  await page.locator('h1:has-text("Ekstralys til")').waitFor()
  const xctekst = await page.textContent('main')
  sjekk('AK-2.2 XC70 har kabelsett og ikke relé i pakken', xctekst.includes('Kabelsett med relé, 2 lamper') && !xctekst.includes('Canbus-relé CAN FD'))
  await steg('24-pakke-xc70-kabelsett')

  // --- Variant b ---
  await page.evaluate(() => sessionStorage.clear())
  await page.goto(`${BASE}?test=1&oppgave=2&variant=b#/passer`)
  await page.reload()
  await page.fill('#regnr', 'PM22022')
  await page.click('button:has-text("Finn bilen")')
  await page.click('button:has-text("Ja, det er bilen min")')
  await page.click('button:has-text("Videre")')
  await page.click('button:has-text("Hopp over")')
  await page.locator('h1:has-text("Ekstralys til")').waitFor()
  const btekst = await page.textContent('main')
  sjekk('Variant b: «Ofte kjøpt sammen» over nødvendig tilbehør, «Andre kjøpte også» for valgfritt', btekst.includes('Andre kjøpte også') && !btekst.includes('Trengs for å fungere'))
  await steg('25-pakke-variant-b-oppgave-2')

  // --- K4: fagperson-side ---
  await page.goto(`${BASE}#/fagperson`)
  await steg('26-fagperson-regler')
  await page.click('button[aria-label="Godkjenn R-004"]')
  sjekk('AK-4.3 Godkjenn R-004', (await page.textContent('main')).includes('R-004 er godkjent'))
  await page.goto(`${BASE}#/passer`)
  await page.fill('#regnr', 'PM19019')
  await page.click('button:has-text("Finn bilen")')
  await page.click('button:has-text("Ja, det er bilen min")')
  sjekk('AK-4.4 Kia blir Bekreftet etter godkjenning', (await page.textContent('main')).includes('Bekreftet'))
  await page.goto(`${BASE}#/fagperson`)
  await page.click('button[aria-label="Rediger R-001"]')
  await page.fill('#f-merknad', 'Endret i test')
  await steg('27-fagperson-rediger')
  await page.click('button:has-text("Lagre som utkast")')
  sjekk('AK-4.2 Redigert regel blir utkast', (await page.locator('li:has-text("R-001")').first().textContent()).includes('Utkast'))
  await page.goto(`${BASE}#/passer`)
  await page.fill('#regnr', 'PM22022')
  await page.click('button:has-text("Finn bilen")')
  await page.click('button:has-text("Ja, det er bilen min")')
  sjekk('AK-4.4 RAV4 faller til Ukjent når R-001 er utkast', (await page.textContent('main')).includes('Ukjent'))
  await page.goto(`${BASE}#/fagperson`)
  page.once('dialog', (d) => d.accept())
  await page.click('button:has-text("Tilbakestill eksempeldata")')
  sjekk('AK-4.5 Tilbakestill gjenoppretter regler', !(await page.textContent('main')).includes('Endret i test'))
  await page.locator('#dk').scrollIntoViewIfNeeded()
  sjekk('AK-4.6 Datakvalitet flagger 5500K/5700K', (await page.textContent('main')).includes('5700K') && (await page.textContent('main')).includes('5500K'))
  await bilde(page, v.navn, '28-fagperson-datakvalitet')

  sjekk(`Ingen JS-feil (${v.navn})`, feil.length === 0, feil.join(' | '))
  sjekk(`NF2 axe: 0 alvorlige/kritiske avvik (${v.navn})`, axeAvvik === 0, `${axeAvvik} skjermer med avvik`)
  await ctx.close()
}

await browser.close()
writeFileSync(`${UT}/resultat.json`, JSON.stringify(resultater, null, 2))
const feilet = resultater.sjekker.filter((s) => !s.ok)
console.log(`\n${resultater.sjekker.length - feilet.length}/${resultater.sjekker.length} sjekker OK`)
process.exit(feilet.length ? 1 : 0)
