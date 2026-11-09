// Ende-til-ende-test av backend-koden uten ekte Supabase.
// Appen bygges mot http://supabase.test. Playwright fanger opp REST-kallene og svarer fra en minnedatabase
// som oppfører seg som tabellene i supabase/migrations (okter, hendelser, tilbakemeldinger, regler).
// To nettleserkontekster = to enheter som deler samme database.
//
// Bruk:
//   VITE_SUPABASE_URL=http://supabase.test VITE_SUPABASE_PUBLISHABLE_KEY=test npx vite build --outDir dist-backendtest
//   npx vite preview --outDir dist-backendtest --port 4174 &
//   node scripts/backend-test.mjs
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const BASE = process.env.BASE_URL ?? 'http://localhost:4174/JDD/'

// ---------- Minnedatabase ----------
const standardRegler = JSON.parse(readFileSync('src/data/regler.json', 'utf8')).regler.map((r) => ({
  id: r.id, merke: r.merke, modell: r.modell, ar_fra: r.arFra, ar_til: r.arTil, frontlys: r.frontlys, canbus: r.canbus,
  krever: r.krever, rele_id: r.releId ?? null, kilde: r.kilde, status: r.status, godkjent_av: r.godkjentAv ?? null,
  godkjent_dato: r.godkjentDato ?? null, merknad: r.merknad ?? null,
}))
const db = { okter: [], hendelser: [], tilbakemeldinger: [], regler: structuredClone(standardRegler), nr: 0 }

function svar(route, status, body) {
  return route.fulfill({
    status,
    headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' },
    body: body === undefined ? '' : JSON.stringify(body),
  })
}

async function fakeSupabase(route) {
  const req = route.request()
  const url = new URL(req.url())
  const sti = url.pathname.replace('/rest/v1/', '')
  const metode = req.method()
  if (metode === 'OPTIONS') return svar(route, 204)
  const kropp = req.postData() ? JSON.parse(req.postData()) : null

  if (sti === 'rpc/ny_okt') {
    const finnes = db.okter.find((o) => o.id === kropp.p_id)
    if (finnes) return svar(route, 200, finnes.testperson)
    const testperson = `T${++db.nr}`
    db.okter.push({ id: kropp.p_id, testperson, test: kropp.p_test, oppgave: kropp.p_oppgave, variant: kropp.p_variant, start: new Date().toISOString(), slutt_type: null, slutt_tid: null })
    return svar(route, 200, testperson)
  }
  if (sti === 'rpc/avslutt_okt') {
    const o = db.okter.find((x) => x.id === kropp.p_id)
    if (o && !o.slutt_type) Object.assign(o, { slutt_type: kropp.p_type, slutt_tid: new Date().toISOString() })
    return svar(route, 204)
  }
  const tabell = db[sti]
  if (!tabell) return svar(route, 404, { message: `ukjent ${sti}` })

  if (metode === 'GET') return svar(route, 200, tabell)
  if (metode === 'POST') {
    const rader = Array.isArray(kropp) ? kropp : [kropp]
    if (sti === 'hendelser') {
      for (const r of rader) {
        if (!db.okter.some((o) => o.id === r.okt_id)) return svar(route, 409, { message: 'fremmednøkkel: økten finnes ikke' })
        if (!/^[a-z_]{3,40}$/.test(r.navn)) return svar(route, 400, { message: 'ugyldig navn' })
      }
    }
    for (const r of rader) {
      const i = sti === 'regler' ? tabell.findIndex((x) => x.id === r.id) : -1
      if (i >= 0) tabell[i] = r // upsert
      else tabell.push(r)
    }
    return svar(route, 201)
  }
  if (metode === 'DELETE' && sti === 'regler') {
    // id=not.in.("R-001","R-002")
    const filter = url.searchParams.get('id') ?? ''
    const behold = [...filter.matchAll(/"([^"]+)"/g)].map((m) => m[1])
    db.regler = db.regler.filter((r) => behold.includes(r.id))
    return svar(route, 204)
  }
  return svar(route, 405, { message: `${metode} ${sti} ikke tillatt (RLS)` })
}

// ---------- Test ----------
const resultat = []
const sjekk = (navn, ok, detalj = '') => {
  resultat.push(ok)
  console.log(`${ok ? '✔' : '✘'} ${navn}${detalj ? ` – ${detalj}` : ''}`)
}

const browser = await chromium.launch()
const enhet = async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await ctx.route('http://supabase.test/**', fakeSupabase)
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log('JS-feil:', e.message))
  return page
}

// Enhet A: testperson gjennomfører oppgave 1
const a = await enhet()
await a.goto(`${BASE}?test=1&oppgave=1&variant=b#/ekstralys/toyota-rav4`)
await a.locator('text=(T1, variant B)').waitFor()
sjekk('Serveren tildeler T1 og testlinjen viser den', true)
await a.fill('#regnr', 'PM22022')
await a.click('button:has-text("Finn bilen")')
await a.click('button:has-text("Ja, det er bilen min")')
await a.click('button:has-text("Videre")')
await a.click('button:has-text("Hopp over")')
await a.locator('h1:has-text("Ekstralys til")').waitFor()
await a.locator('button:has-text("Hvorfor dette?")').first().click()
await a.locator('button:has-text("Legg hele pakken i kurven")').first().click()
await a.goto(`${BASE}#/kasse`)
await a.click('button:has-text("Bestill hele pakken")')
await a.locator('h1:has-text("Takk for bestillingen")').waitFor()
await a.click('button:has-text("Jeg er ferdig")')
await a.locator('label:has-text("4")').first().click()
await a.click('button:has-text("Send tilbakemelding")')
await a.waitForTimeout(500)
const navn = db.hendelser.map((h) => h.navn)
sjekk('Hendelser er lagret i backend', ['landing', 'bil_bekreftet', 'veileder_hoppet_over', 'pakke_vist', 'hvorfor_apnet', 'lagt_i_kurv', 'bestilt', 'oppgave_ferdig', 'tilbakemelding_sendt'].every((n) => navn.includes(n)), navn.join(','))
sjekk('Avslutning lagret (ferdig)', db.okter[0]?.slutt_type === 'ferdig')
sjekk('Tilbakemelding lagret', db.tilbakemeldinger[0]?.trygghet === 4)
sjekk('G8: ingen regnr sendt til backend', !JSON.stringify(db).includes('PM22022'))

// Enhet B: testleder ser loggen fra enhet A
const b = await enhet()
await b.goto(`${BASE}#/testlogg`)
await b.locator('text=felles database – alle enheter').waitFor()
const loggB = await b.textContent('main')
sjekk('Testlogg på enhet B viser T1 fra enhet A', loggB.includes('T1') && loggB.includes('Ferdig'))
await b.goto(`${BASE}#/innsikt`)
await b.locator('text=felles database – alle enheter').waitFor()
sjekk('Innsikt på enhet B teller testpersonen', (await b.locator('dt:has-text("Testpersoner") + dd').textContent()) === '1')

// Enhet B: fagperson godkjenner R-004. Enhet A ser Kia som Bekreftet.
await b.goto(`${BASE}#/fagperson`)
await b.locator('text=felles database').first().waitFor()
await b.click('button[aria-label="Godkjenn R-004"]')
await b.waitForTimeout(300)
sjekk('Godkjenning lagret i backend', db.regler.find((r) => r.id === 'R-004')?.status === 'godkjent')
const c = await enhet() // ny økt/enhet
await c.goto(`${BASE}#/passer`)
await c.waitForTimeout(300)
await c.fill('#regnr', 'PM19019')
await c.click('button:has-text("Finn bilen")')
await c.click('button:has-text("Ja, det er bilen min")')
sjekk('Ny enhet ser Kia som Bekreftet etter godkjenning på en annen enhet', (await c.textContent('main')).includes('Bekreftet'))
sjekk('Ny enhet får T2', db.okter.some((o) => o.testperson === 'T2'))

// Tilbakestill fra enhet B
await b.goto(`${BASE}#/fagperson`)
b.once('dialog', (d) => d.accept())
await b.click('button:has-text("Tilbakestill eksempeldata")')
await b.waitForTimeout(300)
sjekk('Tilbakestill skriver eksempelreglene tilbake til backend', db.regler.find((r) => r.id === 'R-004')?.status === 'utkast' && db.regler.length === 4)

// Backend nede: appen faller tilbake og viser varsel
const d = await browser.newContext({ viewport: { width: 390, height: 844 } })
await d.route('http://supabase.test/**', (r) => r.abort())
const dp = await d.newPage()
await dp.goto(`${BASE}#/fagperson`)
await dp.locator('text=Fikk ikke kontakt med den felles databasen').waitFor()
sjekk('Ved nedetid vises varsel og eksempeldata', true)
await dp.goto(`${BASE}#/passer`)
await dp.fill('#regnr', 'PM22022')
await dp.click('button:has-text("Finn bilen")')
await dp.click('button:has-text("Ja, det er bilen min")')
sjekk('Kundeflyten virker selv om backend er nede', (await dp.textContent('main')).includes('Bekreftet'))

await browser.close()
console.log(`\n${resultat.filter(Boolean).length}/${resultat.length} backend-sjekker OK`)
process.exit(resultat.every(Boolean) ? 0 : 1)
