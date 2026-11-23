// Tar opp en demovideo av prototypen (mobil 390 px) med synlig peker og rolig tempo, for VoiceOver i etterkant.
// Skriver også et manus med tidskoder per kapittel.
// Bruk: npm run build && npx vite preview --port 4173 &  →  node scripts/demo-video.mjs [--pc]
// Resultat (mobil): docs/demo/passer-min-bil-demo.mp4 og docs/demo/manus.md
// Resultat (--pc, 1920×1080): docs/demo/passer-min-bil-demo-pc.mp4 og docs/demo/manus-pc.md
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/JDD/'
const UT = 'docs/demo'
const PC = process.argv.includes('--pc')
// Mobil: 390×844 skalert ×2. PC: 1280×720 (desktop-layout) skalert til 1920×1080.
const W = PC ? 1280 : 390
const H = PC ? 720 : 844
const UT_W = PC ? 1920 : W * 2
const UT_H = PC ? 1080 : H * 2
const SUFFIKS = PC ? '-pc' : ''
const RAA = `${UT}/raa${SUFFIKS}`
rmSync(RAA, { recursive: true, force: true })
mkdirSync(RAA, { recursive: true })


const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 2,
  locale: 'nb-NO',
  // Playwright tar opp i viewport-størrelse (skalerer ikke opp). Vi skalerer opp med ffmpeg etterpå.
  recordVideo: { dir: RAA, size: { width: W, height: H } },
})

// Synlig peker og klikk-markering (Playwright viser ingen peker i video)
await ctx.addInitScript(() => {
  const lag = () => {
    if (document.getElementById('demo-peker')) return
    const s = document.createElement('style')
    s.textContent = `
      #demo-peker{position:fixed;z-index:2147483647;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;
        background:rgba(200,16,46,.35);border:2px solid #c8102e;pointer-events:none;transition:transform .15s;left:-50px;top:-50px}
      #demo-peker.trykk{transform:scale(.7);background:rgba(200,16,46,.6)}
      .demo-ring{position:fixed;z-index:2147483646;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;
        border:3px solid #c8102e;pointer-events:none;animation:demo-ring .6s ease-out forwards}
      @keyframes demo-ring{to{transform:scale(2.6);opacity:0}}`
    document.head.appendChild(s)
    const p = document.createElement('div')
    p.id = 'demo-peker'
    document.body.appendChild(p)
    document.addEventListener('mousemove', (e) => {
      p.style.left = e.clientX + 'px'
      p.style.top = e.clientY + 'px'
    }, true)
    document.addEventListener('mousedown', (e) => {
      p.classList.add('trykk')
      const r = document.createElement('div')
      r.className = 'demo-ring'
      r.style.left = e.clientX + 'px'
      r.style.top = e.clientY + 'px'
      document.body.appendChild(r)
      setTimeout(() => r.remove(), 700)
    }, true)
    document.addEventListener('mouseup', () => p.classList.remove('trykk'), true)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', lag)
  else lag()
})

const page = await ctx.newPage()
const t0 = Date.now()
const kapitler = []
const vent = (ms) => page.waitForTimeout(ms)
const tid = () => {
  const s = Math.round((Date.now() - t0) / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
const kapittel = (tittel, viser, forslag) => {
  kapitler.push({ tid: tid(), tittel, viser, forslag })
  console.log(`${tid()}  ${tittel}`)
}

let px = W / 2
let py = H / 2
async function flyttTil(x, y) {
  await page.mouse.move(x, y, { steps: 18 })
  px = x
  py = y
}
async function visEl(loc) {
  await loc.evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  await vent(800)
}
async function klikk(loc, etter = 900) {
  await loc.waitFor({ state: 'visible' })
  await visEl(loc)
  const b = await loc.boundingBox()
  await flyttTil(b.x + b.width / 2, b.y + b.height / 2)
  await vent(250)
  await page.mouse.click(px, py)
  await vent(etter)
}
async function skriv(loc, tekst) {
  await klikk(loc, 300)
  await page.keyboard.type(tekst, { delay: 140 })
  await vent(500)
}
async function velg(loc, verdi) {
  await visEl(loc)
  const b = await loc.boundingBox()
  await flyttTil(b.x + b.width / 2, b.y + b.height / 2)
  await vent(300)
  await loc.selectOption(verdi)
  await vent(700)
}
/** Rolig rulling nedover (eller oppover med negativt tall) */
async function rull(piksler, ms = 1600) {
  const steg = Math.max(1, Math.round(ms / 40))
  for (let i = 0; i < steg; i++) {
    await page.mouse.wheel(0, piksler / steg)
    await vent(40)
  }
  await vent(400)
}
const tilToppen = async () => {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  await vent(800)
}

// ---------------- 1. Forside ----------------
await page.goto(`${BASE}#/`)
await page.locator('h1').waitFor()
await flyttTil(W / 2, 300)
kapittel('Introduksjon og forside',
  'Forsiden med prototype-stripen, regnr-feltet, Passer-garanti og «Populære bilmodeller».',
  'Dette er «Passer min bil», en klikkbar prototype vi har laget for JDD Utstyr. Problemet vi løser: kunden vet ikke hva bilen trenger, for eksempel at nyere biler med LED-frontlys trenger et Canbus-relé som ikke er med i «komplette» ekstralyssett.')
await vent(3500)
await rull(700, 2200)
await vent(1500)
await tilToppen()

// ---------------- 2. Landingsside + regnr ----------------
await page.goto(`${BASE}#/ekstralys/toyota-rav4`)
await page.locator('h1:has-text("Ekstralys til Toyota RAV4")').waitFor()
await flyttTil(W / 2, 250)
kapittel('Landingsside for bilmodellen',
  'Landingssiden «Ekstralys til Toyota RAV4» med regnr-feltet øverst.',
  'Martin googler «ekstralys RAV4» og lander her. Regnr-feltet står øverst, så han kan sjekke bilen med en gang.')
await vent(2500)
await skriv(page.locator('#regnr'), 'PM 22022')
await klikk(page.locator('button:has-text("Finn bilen")'), 1200)

// ---------------- 3. Bekreft bil ----------------
await page.locator('h1:has-text("stemmer det?")').waitFor()
kapittel('Bilen bekreftes',
  '«Toyota RAV4 2022 – stemmer det?» med status Bekreftet.',
  'Prototypen slår opp bilen og spør om den stemmer. Statusen «Bekreftet» betyr at oppsettet kommer fra modelltabellen, godkjent av en fagperson hos JDD.')
await vent(3500)
await klikk(page.locator('button:has-text("Ja, det er bilen min")'), 1200)
kapittel('Modelltabellen',
  'Hva vi vet om bilen: LED-frontlys, Canbus (CAN FD), trenger Canbus-relé. Regel, kilde og godkjenning nederst.',
  'Her ser kunden hva bilen har: LED-frontlys og Canbus. Derfor trengs et Canbus-relé i stedet for vanlig kabelsett. Kunden trenger ikke vite dette selv. Regelen og kilden vises, så rådet kan etterprøves.')
await vent(5000)
await klikk(page.locator('button:has-text("Videre")'), 1000)

// ---------------- 4. Tre spørsmål ----------------
kapittel('Tre konkrete spørsmål',
  'Spørsmål 1 av 3 med valgknapper, «Hva betyr dette?» og «Hopp over».',
  'JDD ønsket tre spørsmål: antall lamper, festemetode og kontakttype. Det er valgknapper, ikke fritekst, og fagord forklares. Erfarne kunder kan hoppe over.')
await vent(2000)
await klikk(page.locator('label:has-text("2 lamper")'), 700)
await klikk(page.locator('button:has-text("Hva betyr dette?")'), 2500)
await klikk(page.locator('button:has-text("Neste")'), 900)
await klikk(page.locator('label:has-text("Frontgrill / skiltbrakett")'), 700)
await klikk(page.locator('button:has-text("Neste")'), 900)
await klikk(page.locator('label:has-text("Ingen kontakt, kobles fra fjernlyset")'), 700)
await klikk(page.locator('button:has-text("Vis pakken min")'), 1200)

// ---------------- 5. Pakken ----------------
await page.locator('h1:has-text("Ekstralys til")').waitFor()
kapittel('Pakken: basis og anbefalt',
  'Pakkesiden: «Bilen din trenger et Canbus-relé», Basis-pakken med «Passer din bil» og samlet pris.',
  'Pakken har alt som trengs for å fungere: lys, brakett og riktig relé, i én ordre. Basis vises alltid først, slik at det aldri blir dyrere enn nødvendig.')
await vent(3000)
const releHvorfor = page.locator('button:has-text("Hvorfor dette?")').nth(2)
await klikk(releHvorfor, 3500)
kapittel('«Hvorfor dette?» og «Ikke inkludert»',
  'Forklaringen for reléet (regel R-001 og kilde), og listen over hva som ikke er med.',
  'Kunden kan se hvorfor reléet er med, og hvilken regel og kilde det bygger på. «Ikke inkludert» viser hva som ikke er med, for eksempel verktøy, og at vanlig kabelsett ikke trengs.')
await klikk(page.locator('button:has-text("Ikke inkludert")').first(), 4000)
await rull(900, 2500)
kapittel('Anbefalt pakke, tilbehør og regler',
  'Anbefalt pakke med merpris forklart, «Ofte kjøpt sammen» i egen seksjon, og merknaden om regler for ekstralys.',
  'Anbefalt pakke forklarer hva du får ekstra og hva det koster mer. «Ofte kjøpt sammen» står for seg selv og er ikke med i prisen. Det skiller nødvendig utstyr fra mersalg.')
await vent(2500)
await rull(1100, 3000)
await vent(1500)
await rull(900, 2500)
await vent(2500)

// ---------------- 6. Fagperson ----------------
kapittel('Spør en fagperson',
  'Fagperson-panelet: øverst ser fagpersonen bilen og oppsettet. Spørsmål om montering og relé med forhåndsskrevne svar.',
  'Er kunden usikker, kan hen spørre en fagperson. Fagpersonen ser bilen og handlekurven med en gang, så kunden slipper å forklare. I prototypen er svarene forhåndsskrevne, uten chatbot.')
await klikk(page.locator('main button:has-text("Spør en fagperson")').last(), 2500)
await klikk(page.locator('dialog button:has-text("Kan jeg montere dette selv?")'), 4500)
await klikk(page.locator('dialog button:has-text("Hvorfor trenger jeg et relé?")'), 4500)
await klikk(page.locator('dialog button[aria-label="Lukk"]'), 1000)

// ---------------- 7. Kurv, kasse, bekreftelse ----------------
await tilToppen()
const leggI = page.locator('button:has-text("Legg hele pakken i kurven")').first()
kapittel('Hele pakken i kurven',
  'Basis-pakken legges i kurven med ett klikk, og kurven viser hva som trengs for å fungere.',
  'Med ett klikk havner hele pakken i kurven. Fjerner kunden en nødvendig del, får hen en advarsel.')
await klikk(leggI, 1200)
await klikk(page.locator('button:has-text("Gå til kurven")').first(), 1500)
await vent(2000)
await klikk(page.locator('button:has-text("Til kassen")'), 1500)
kapittel('Kassen',
  'Kassen: leveringstid, ingen skjulte tillegg, Passer-garanti og samtykke til «Min garasje».',
  'I kassen vises leveringstid og at det ikke kommer skjulte tillegg. Passer-garantien gir fri retur hvis rådet var feil. Regnr lagres bare hvis kunden selv krysser av.')
await vent(2500)
await rull(600, 2000)
await vent(2000)
await klikk(page.locator('button:has-text("Bestill hele pakken")'), 1500)
await page.locator('h1:has-text("Takk for bestillingen")').waitFor()
kapittel('Bekreftelse og oppfølging',
  'Ordrebekreftelse, monteringsguide med koblingsskjema (fase 2) og e-posten «Fungerte det?» etter en uke.',
  'Etter bestillingen får kunden monteringsguide og koblingsskjema for bilen. Etter en uke kommer e-posten «Fungerte det?». Svarene brukes til å forbedre reglene.')
await vent(3000)
await rull(800, 2500)
await vent(2000)
await rull(800, 2500)
await vent(2500)

// ---------------- 8. Ukjent bil ----------------
await page.goto(`${BASE}#/passer`)
await page.locator('h1:has-text("Hvilken bil har du?")').waitFor()
await flyttTil(W / 2, 300)
kapittel('Ukjent bil via «Populære bilmodeller»',
  'Trykk på «Kia Sportage 2019»: feltene fylles ut, og bekreftelsen viser status Ukjent og spørsmålet «Har bilen LED-frontlys?» med bilder.',
  'Hva hvis vi ikke kjenner bilen? Da sier prototypen det ærlig: status «Ukjent», aldri «Bekreftet». Kunden får ett enkelt spørsmål med bilde: har bilen LED-frontlys?')
await vent(1500)
await klikk(page.locator('button:has-text("Kia Sportage 2019")'), 2500)
await vent(2500)
await klikk(page.locator('button:has-text("Ja, LED")'), 1500)
kapittel('Regelutledet',
  'Status Regelutledet: universalrelé, med tilbud om fagperson som kan bekrefte et rimeligere relé.',
  'Ut fra svaret velger prototypen et universalrelé som passer begge Canbus-typer. Det er det sikreste valget, og en fagperson kan bekrefte et rimeligere relé.')
await vent(5000)

// ---------------- 9. Fagperson-siden ----------------
await page.goto(`${BASE}#/fagperson`)
await page.locator('h1:has-text("Fagperson")').waitFor()
await flyttTil(W / 2, 300)
kapittel('Fagperson-siden: kunnskapen blir i JDD',
  'Modelltabellen med regler. Regel R-004 for Kia Sportage står som «Utkast – ikke godkjent».',
  'Bak kulissene legger fagpersoner inn regler per bilmodell og godkjenner dem. Slik blir kunnskapen i JDD, også når nøkkelpersoner går av med pensjon.')
await vent(3000)
await klikk(page.locator('button[aria-label="Godkjenn R-004"]'), 2500)
kapittel('Godkjenning slår inn med en gang',
  'R-004 er godkjent. Kia Sportage 2019 vises nå som Bekreftet for kunden.',
  'Når fagpersonen godkjenner regelen, ser kunden Kia-en som «Bekreftet» med en gang.')
await page.goto(`${BASE}#/passer?merke=Kia&modell=Sportage&ar=2019`)
await page.locator('h2:has-text("Kia Sportage 2019 – stemmer det?")').waitFor()
await vent(4000)
await page.goto(`${BASE}#/fagperson`)
await page.locator('h1:has-text("Fagperson")').waitFor()
await rull(2600, 3500)
kapittel('Datakvalitet',
  'Datakvalitet: avviket 5700K mot 5500K på samme produkt er flagget.',
  'Fagperson-siden flagger også motstridende produktdata, som avviket vi fant i service safarien: 5700K i beskrivelsen og 5500K i teknisk info.')
await vent(4000)
// Tilbakestill (uten å vise dialogen)
page.once('dialog', (d) => d.accept())
await tilToppen()
await page.locator('button:has-text("Tilbakestill eksempeldata")').click()
await vent(800)

// ---------------- 10. Testmodus ----------------
await page.goto(`${BASE}#/testlogg`)
await page.locator('h1:has-text("Testlogg")').waitFor()
await flyttTil(W / 2, 300)
kapittel('Testmodus for brukertestene',
  'Testloggen: «Start ny testperson» og «Start oppgave 1».',
  'For brukertestene har prototypen en testmodus. Testlederen starter en anonym testperson og en oppgave, den samme som i service safarien.')
await vent(2500)
await klikk(page.locator('button:has-text("Start ny testperson")'), 1500)
await klikk(page.locator('button:has-text("Start oppgave 1")'), 1500)
await page.locator('section[aria-label="Testoppgave"]').waitFor()
kapittel('Testlinjen',
  'Testlinjen øverst med oppgaveteksten og knappene «Ferdig» og «Gi opp».',
  'Testpersonen ser oppgaven øverst og kan trykke «Ferdig» eller «Gi opp». Alt som skjer, logges anonymt med tid.')
await vent(4000)
await klikk(page.locator('button:has-text("Gi opp")'), 1500)
kapittel('Hvor stoppet det opp?',
  'Etter «Gi opp»: spørsmålet «Hvor stoppet det opp?». Testlinjen er borte.',
  'Gir testpersonen opp, spør vi hvor det stoppet opp. Da ser vi hvor tjenesten må forbedres.')
await vent(4000)
await page.goto(`${BASE}#/innsikt`)
await page.locator('h1:has-text("innsikt")').waitFor()
await flyttTil(W / 2, 300)
kapittel('Innsikt for kundesenteret',
  'Innsiktssiden: testpersoner, konvertering, bruk av fagperson, funnel og hvor folk stoppet.',
  'Til slutt samles alt i en oversikt: konvertering, andel komplette ordrer og bruk av fagperson. Det er de samme målene vi foreslår for gevinstmåling.')
await vent(3000)
await rull(1400, 3500)
await vent(3000)
await tilToppen()
kapittel('Avslutning',
  'Tilbake til toppen av innsiktssiden.',
  '«Passer min bil»: kjenn bilen, få en komplett pakke med forklaring, en fagperson ved behov og garanti hvis rådet er feil. Takk for oppmerksomheten.')
await vent(4000)

const varighet = tid()
await page.close()
await ctx.close()
await browser.close()

// ---------- Konverter til MP4 og skriv manus ----------
const webm = readdirSync(RAA).find((f) => f.endsWith('.webm'))
renameSync(`${RAA}/${webm}`, `${RAA}/demo.webm`)
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${RAA}/demo.webm`, '-vf', `scale=${UT_W}:${UT_H}:flags=lanczos`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '20',
  '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', `${UT}/passer-min-bil-demo${SUFFIKS}.mp4`])
rmSync(RAA, { recursive: true, force: true })

const manus = `# Manus for VoiceOver: «Passer min bil»-demo

Video: \`passer-min-bil-demo${SUFFIKS}.mp4\` · ${PC ? 'PC-format 1920 × 1080 (desktop-layout)' : 'mobilvisning (390 px)'} · varighet ca. ${varighet} · ingen lyd.
Tidskodene viser når hvert kapittel starter. «Forslag til tale» kan brukes som utgangspunkt. Tilpass gjerne.

| Tid | Kapittel | Det som vises | Forslag til tale |
| --- | --- | --- | --- |
${kapitler.map((k) => `| ${k.tid} | ${k.tittel} | ${k.viser} | ${k.forslag} |`).join('\n')}

Prototype med eksempeldata, fiktive varenavn og eksempelpriser. Ingen ekte bestilling.
`
writeFileSync(`${UT}/manus${SUFFIKS}.md`, manus)
console.log(`\nFerdig: ${UT}/passer-min-bil-demo${SUFFIKS}.mp4 (${varighet}) og ${UT}/manus${SUFFIKS}.md`)
