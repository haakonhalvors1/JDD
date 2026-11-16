// Playwright-tester (mobil 390 px) for feilrettingen 16.11.2026:
//   Feil 1: «Populære bilmodeller» fyller ut bilvelgeren og viser bekreftelsen med riktig status.
//   Feil 2: Testlinjen forsvinner etter Ferdig/Gi opp, og de to gir ulike hendelser, skjermer og status.
// Bruk: npm run build && npx vite preview --port 4173 &  →  npm run test:e2e
import { chromium } from 'playwright'
import { AxeBuilder } from '@axe-core/playwright'
import { mkdirSync, readFileSync } from 'node:fs'

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/JDD/'
const UT = 'docs/screenshots'
mkdirSync(UT, { recursive: true })

const resultat = []
const sjekk = (navn, ok, detalj = '') => {
  resultat.push(ok)
  console.log(`${ok ? '✔' : '✘'} ${navn}${detalj ? ` – ${detalj}` : ''}`)
}

const browser = await chromium.launch()
const nyEnhet = async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'nb-NO', acceptDownloads: true })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => sjekk('Ingen JS-feil', false, e.message))
  return { ctx, page }
}
const bilde = (page, navn, full = true) => page.screenshot({ path: `${UT}/mobil-${navn}.png`, fullPage: full })
const axe = async (page, navn) => {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const alvorlige = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact))
  sjekk(`axe: 0 alvorlige avvik (${navn})`, alvorlige.length === 0, alvorlige.map((v) => v.id).join(', '))
}
const logg = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('pmb.logg') ?? '[]'))
const testlinje = (page) => page.locator('section[aria-label="Testoppgave"]')

// ---------------- Feil 1: Populære bilmodeller ----------------
{
  const { ctx, page } = await nyEnhet()
  await page.goto(`${BASE}#/`)
  const knapper = await page.locator('#populaere ~ ul button').allTextContents()
  sjekk('Populære bilmodeller generert fra kjoretoy.json, RAV4 2022 først', knapper[0] === 'Toyota RAV4 2022' && knapper.length === 4, knapper.join(', '))

  await page.click('button:has-text("Toyota RAV4 2022")')
  const bekreft = page.locator('h2:has-text("Toyota RAV4 2022 – stemmer det?")')
  await bekreft.waitFor()
  const felt = [await page.inputValue('#merke'), await page.inputValue('#modell'), await page.inputValue('#ar')]
  sjekk('AK: Trykk på «Toyota RAV4 2022» → alle tre feltene er utfylt', felt.join(' ') === 'Toyota RAV4 2022', felt.join(' '))
  sjekk('AK: … og bekreftelsen vises uten flere klikk', await bekreft.isVisible())
  sjekk('… med status Bekreftet', await page.locator('#bil-bekreft ~ p >> text=Bekreftet').first().isVisible())
  await bilde(page, '29-bilvelger-populaer-rav4')
  await axe(page, 'bilvelger RAV4')
  let o = (await logg(page))[0]
  sjekk('Hendelsen populaer_modell_valgt er logget', o?.hendelser.some((h) => h.navn === 'populaer_modell_valgt' && h.detalj === 'Toyota RAV4 2022'))
  await page.click('button:has-text("Ja, det er bilen min")')
  await page.locator('h2:has-text("Dette vet vi om bilen din")').waitFor()
  o = (await logg(page))[0]
  sjekk('… i tillegg til bil_bekreftet', o?.hendelser.some((h) => h.navn === 'bil_bekreftet'))

  // Bilen uten godkjent regel (Kia Sportage 2019)
  await page.goto(`${BASE}#/passer`)
  await page.click('button:has-text("Kia Sportage 2019")')
  await page.locator('h2:has-text("Kia Sportage 2019 – stemmer det?")').waitFor()
  const kiaFelt = [await page.inputValue('#merke'), await page.inputValue('#modell'), await page.inputValue('#ar')].join(' ')
  sjekk('Kia: feltene er utfylt', kiaFelt === 'Kia Sportage 2019', kiaFelt)
  sjekk('AK: Bil uten treff i modelltabellen → status Ukjent', await page.locator('#bil-bekreft ~ p >> text=Ukjent').first().isVisible())
  sjekk('AK: … og spørsmålet «Har bilen LED-frontlys?»', await page.locator('legend:has-text("Har bilen LED-frontlys?")').isVisible())
  sjekk('G2: Ukjent vises ikke som Bekreftet', !(await page.locator('#bil-bekreft').locator('..').textContent()).includes('Bekreftet'))
  await bilde(page, '30-bilvelger-populaer-ukjent')

  // Bytte merke nullstiller modell og år, og bekreftelsen forsvinner
  await page.selectOption('#merke', 'Volvo')
  sjekk('Bytte av merke nullstiller modell og år', (await page.inputValue('#modell')) === '' && (await page.inputValue('#ar')) === '' && (await page.isDisabled('#ar')))
  sjekk('… og bekreftelsen forsvinner', (await page.locator('#bil-bekreft').count()) === 0)
  await page.selectOption('#modell', 'XC70')
  const arVolvo = await page.locator('#ar option').allTextContents()
  sjekk('År-listen avhenger av modell (XC70: 2016–2005)', arVolvo[1] === '2016' && arVolvo.at(-1) === '2005')
  await page.selectOption('#ar', '2012')
  await page.locator('h2:has-text("Volvo XC70 2012 – stemmer det?")').waitFor()
  sjekk('Manuelt valg viser også bekreftelsen med Bekreftet', await page.locator('#bil-bekreft ~ p >> text=Bekreftet').first().isVisible())
  await ctx.close()
}

// ---------------- Feil 2: Testlinjen, Ferdig og Gi opp ----------------
{
  const { ctx, page } = await nyEnhet()

  // Start oppgave fra #/testlogg
  await page.goto(`${BASE}#/testlogg`)
  await page.click('button:has-text("Start ny testperson")')
  await page.click('button:has-text("Start oppgave 1")')
  await page.locator('h1:has-text("Ekstralys til Toyota RAV4")').waitFor()
  sjekk('Testlinjen vises når oppgaven er startet fra #/testlogg', await testlinje(page).isVisible())
  sjekk('… med oppgavetekst, Ferdig og Gi opp', (await testlinje(page).textContent()).includes('Kjøp ekstralys') && (await page.locator('button:has-text("Ferdig")').isVisible()) && (await page.locator('button:has-text("Gi opp")').isVisible()))
  await bilde(page, '31-testlinje', false)

  // Ferdig
  await page.fill('#regnr', 'PM22022')
  await page.click('button:has-text("Finn bilen")')
  await page.click('button:has-text("Ferdig")')
  await page.locator('h1:has-text("Takk, oppgaven er fullført")').waitFor()
  sjekk('AK Ferdig: tilbakemeldingssiden «Takk, oppgaven er fullført»', true)
  sjekk('AK Ferdig: ingen testlinje', (await testlinje(page).count()) === 0)
  let t1 = (await logg(page)).find((o) => o.id === 'T1')
  sjekk('AK Ferdig: «fullført» i loggen med tid brukt', t1?.oppgaver['1'].status === 'fullfort' && typeof t1.oppgaver['1'].sekunder === 'number')
  sjekk('Ferdig logger oppgave_fullfort (ikke oppgave_avbrutt)', t1.hendelser.some((h) => h.navn === 'oppgave_fullfort') && !t1.hendelser.some((h) => h.navn === 'oppgave_avbrutt'))
  sjekk('?test=1 er ikke i adressen etter avslutning', !page.url().includes('test=1'))
  await page.reload()
  await page.locator('h1').first().waitFor()
  sjekk('AK Ferdig: ingen testlinje etter oppdatering av siden', (await testlinje(page).count()) === 0)
  await page.goto(`${BASE}?test=1&oppgave=1&variant=a#/ekstralys/toyota-rav4`)
  await page.locator('h1:has-text("Ekstralys til")').waitFor()
  sjekk('Ingen testlinje selv med ?test=1 i adressen (oppgaven er avsluttet)', (await testlinje(page).count()) === 0)
  t1 = (await logg(page)).find((o) => o.id === 'T1')
  sjekk('… og oppgaven er fortsatt fullført', t1.oppgaver['1'].status === 'fullfort')
  await page.goto(`${BASE}#/testlogg`)
  sjekk('Avsluttet oppgave kan ikke startes på nytt for samme testperson', await page.isDisabled('button:has-text("Start oppgave 1")'))

  // Gi opp (ny testperson)
  await page.click('button:has-text("Start ny testperson")')
  await page.click('button:has-text("Start oppgave 1")')
  await page.locator('h1:has-text("Ekstralys til Toyota RAV4")').waitFor()
  await page.fill('#regnr', 'PM22022')
  await page.click('button:has-text("Finn bilen")')
  await page.click('button:has-text("Ja, det er bilen min")')
  await page.locator('h2:has-text("Dette vet vi om bilen din")').waitFor()
  await page.click('button:has-text("Gi opp")')
  const sporsmal = page.locator('legend:has-text("Hvor stoppet det opp?")')
  await sporsmal.waitFor()
  sjekk('AK Gi opp: spørsmålet «Hvor stoppet det opp?» vises', await sporsmal.isVisible())
  sjekk('AK Gi opp: ingen testlinje', (await testlinje(page).count()) === 0)
  const valg = await page.locator('input[name="arsak"] + span').allTextContents()
  sjekk('Valgene: fant ikke bilen, usikker, tilbehør, pris, annet', valg.join('|') === 'Fant ikke bilen|Usikker på om pakken passet|Forsto ikke tilbehøret|Pris|Annet', valg.join('|'))
  let t2 = (await logg(page)).find((o) => o.id === 'T2')
  sjekk('AK Gi opp: «avbrutt» i loggen', t2?.oppgaver['1'].status === 'avbrutt')
  sjekk('Gi opp logger oppgave_avbrutt med tid og siste hendelse/side', t2.hendelser.some((h) => h.navn === 'oppgave_avbrutt') && !t2.hendelser.some((h) => h.navn === 'oppgave_fullfort') && t2.oppgaver['1'].stoppetVed === 'bil_bekreftet @ /passer/bil', t2.oppgaver['1'].stoppetVed)
  await axe(page, 'avbruddsspørsmål')
  await bilde(page, '32-avbrudd-sporsmal')
  await page.locator('label:has-text("Annet")').click()
  await page.fill('#arsak-fritekst', 'Visste ikke hva Canbus er')
  await page.click('button:has-text("Neste")')
  await page.locator('h1:has-text("Takk for at du prøvde")').waitFor()
  sjekk('Gi opp: deretter tilbakemeldingssiden «Takk for at du prøvde»', true)
  await bilde(page, '33-tilbakemelding-etter-avbrudd')
  await page.reload()
  await page.locator('h1').first().waitFor()
  sjekk('Ingen testlinje etter oppdatering (avbrutt)', (await testlinje(page).count()) === 0)

  // Testlogg + CSV
  await page.goto(`${BASE}#/testlogg`)
  const tabell = await page.locator('table').textContent()
  sjekk('#/testlogg viser status per oppgave (fullført/avbrutt)', tabell.includes('fullført') && tabell.includes('avbrutt'))
  await bilde(page, '34-testlogg-status')
  const [nedlasting] = await Promise.all([page.waitForEvent('download'), page.click('button:has-text("Eksporter CSV")')])
  const csv = readFileSync(await nedlasting.path(), 'utf8').replace(/^﻿/, '').split('\r\n')
  sjekk('CSV: kolonnene testperson, oppgave, variant, status, tid_sekunder, stoppet_ved, svar', csv[0].startsWith('testperson;oppgave;variant;status;tid_sekunder;stoppet_ved;svar'))
  const r1 = csv.find((r) => r.startsWith('T1;1;')) ?? ''
  const r2 = csv.find((r) => r.startsWith('T2;1;')) ?? ''
  sjekk('CSV: Ferdig og Gi opp gir ulik status', r1.split(';')[3] === 'fullført' && r2.split(';')[3] === 'avbrutt', `${r1.split(';')[3]} / ${r2.split(';')[3]}`)
  sjekk('CSV: stoppet_ved og svar for avbrutt', r2.includes('bil_bekreftet @ /passer/bil') && r2.includes('Annet (Visste ikke hva Canbus er)'))
  await ctx.close()
}

await browser.close()
console.log(`\n${resultat.filter(Boolean).length}/${resultat.length} sjekker OK`)
process.exit(resultat.every(Boolean) ? 0 : 1)
