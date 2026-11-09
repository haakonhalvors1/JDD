// Samler eksempeldataene med typer.
import kjoretoyJson from '../data/kjoretoy.json'
import reglerJson from '../data/regler.json'
import produkterJson from '../data/produkter.json'
import sporsmalJson from '../data/sporsmal.json'
import fagpersonJson from '../data/fagperson-svar.json'
import type { Bil, Produkt, Regeldata, Svar } from './typer'

export const kjoretoy = kjoretoyJson.kjoretoy as (Bil & { regnr: string })[]
export const modellvelger = kjoretoyJson.modellvelger
export const arsintervall = { fra: kjoretoyJson.arFra, til: kjoretoyJson.arTil }
export const standardRegeldata = { regler: reglerJson.regler, utledning: reglerJson.utledning } as Regeldata
export const produkter = produkterJson.produkter as Produkt[]
export const sporsmal = sporsmalJson.sporsmal
export const fagord = sporsmalJson.fagord as Record<string, string>
export const standardsvar = sporsmalJson.standardsvar as Svar
export const fagpersonSvar = fagpersonJson
