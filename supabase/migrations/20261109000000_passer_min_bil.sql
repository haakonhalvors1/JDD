-- «Passer min bil» – felles backend for prototypen (IS-219, gruppe 1)
-- Lagrer: anonyme testøkter, logghendelser, tilbakemeldinger og kompatibilitetsregler (K4).
-- Lagrer IKKE: regnr, navn, e-post, telefon eller andre personopplysninger (G8).
-- Kjøres én gang i Supabase: SQL Editor → lim inn → Run (eller via Supabase CLI/MCP).

-- ---------- Testøkter ----------
create sequence if not exists public.testperson_nr;

create table if not exists public.okter (
  id uuid primary key,
  testperson text not null unique,          -- T1, T2 … (tildeles av serveren)
  test boolean not null default false,
  oppgave smallint check (oppgave in (1, 2)),
  variant text not null check (variant in ('a', 'b')),
  start timestamptz not null default now(),
  slutt_type text check (slutt_type in ('ferdig', 'gitt_opp')),
  slutt_tid timestamptz
);

create table if not exists public.hendelser (
  id bigint generated always as identity primary key,
  okt_id uuid not null references public.okter(id) on delete cascade,
  navn text not null check (navn ~ '^[a-z_]{3,40}$'),
  detalj text check (char_length(detalj) <= 80),
  tid timestamptz not null default now()
);
create index if not exists hendelser_okt_idx on public.hendelser (okt_id, tid);

create table if not exists public.tilbakemeldinger (
  okt_id uuid primary key references public.okter(id) on delete cascade,
  trygghet smallint check (trygghet between 1 and 5),
  unodvendig text check (unodvendig in ('ja', 'nei')),
  unodvendig_hva text check (char_length(unodvendig_hva) <= 500),
  hjelp_mersalg smallint check (hjelp_mersalg between 1 and 5),
  fritekst text check (char_length(fritekst) <= 2000),
  sendt timestamptz not null default now()
);

-- ---------- Kompatibilitetsregler (K4) ----------
create table if not exists public.regler (
  id text primary key check (id ~ '^R-\d{3,}$'),
  merke text not null,
  modell text not null,
  ar_fra smallint not null,
  ar_til smallint not null,
  frontlys text not null check (frontlys in ('LED', 'halogen')),
  canbus text not null check (canbus in ('nei', 'CAN', 'CAN FD')),
  krever text not null check (krever in ('rele', 'kabelsett')),
  rele_id text,
  kilde text not null default '',
  status text not null check (status in ('godkjent', 'utkast')),
  godkjent_av text,
  godkjent_dato date,
  merknad text,
  oppdatert timestamptz not null default now()
);

-- ---------- Funksjoner ----------
-- Ny økt: serveren tildeler neste T-nummer, slik at ID-ene er unike på tvers av enheter.
create or replace function public.ny_okt(p_id uuid, p_test boolean, p_oppgave smallint, p_variant text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_label text;
begin
  select testperson into v_label from okter where id = p_id;
  if v_label is not null then
    return v_label;
  end if;
  v_label := 'T' || nextval('public.testperson_nr');
  insert into okter (id, testperson, test, oppgave, variant) values (p_id, v_label, p_test, p_oppgave, p_variant);
  return v_label;
end;
$$;

-- Avslutt oppgave (Ferdig / Gi opp). Første avslutning vinner.
create or replace function public.avslutt_okt(p_id uuid, p_type text)
returns void
language sql
security definer
set search_path = public
as $$
  update okter set slutt_type = p_type, slutt_tid = now()
  where id = p_id and slutt_type is null and p_type in ('ferdig', 'gitt_opp');
$$;

-- ---------- Tilgang (RLS) ----------
-- Prototypen har ingen innlogging. Den publiserbare nøkkelen (anon) kan:
--   * lese alt (loggen er anonym og trengs på #/testlogg og #/innsikt),
--   * legge til hendelser og tilbakemeldinger,
--   * lese og endre regler (fagperson-siden er åpen i prototypen).
-- Den kan IKKE slette logg eller endre/slette andres hendelser. Sletting gjøres i Supabase-dashbordet.
alter table public.okter enable row level security;
alter table public.hendelser enable row level security;
alter table public.tilbakemeldinger enable row level security;
alter table public.regler enable row level security;

drop policy if exists "les okter" on public.okter;
create policy "les okter" on public.okter for select to anon, authenticated using (true);

drop policy if exists "les hendelser" on public.hendelser;
create policy "les hendelser" on public.hendelser for select to anon, authenticated using (true);
drop policy if exists "ny hendelse" on public.hendelser;
create policy "ny hendelse" on public.hendelser for insert to anon, authenticated with check (true);

drop policy if exists "les tilbakemeldinger" on public.tilbakemeldinger;
create policy "les tilbakemeldinger" on public.tilbakemeldinger for select to anon, authenticated using (true);
drop policy if exists "ny tilbakemelding" on public.tilbakemeldinger;
create policy "ny tilbakemelding" on public.tilbakemeldinger for insert to anon, authenticated with check (true);

drop policy if exists "les regler" on public.regler;
create policy "les regler" on public.regler for select to anon, authenticated using (true);
drop policy if exists "ny regel" on public.regler;
create policy "ny regel" on public.regler for insert to anon, authenticated with check (true);
drop policy if exists "endre regel" on public.regler;
create policy "endre regel" on public.regler for update to anon, authenticated using (true) with check (true);
drop policy if exists "slett regel" on public.regler;
create policy "slett regel" on public.regler for delete to anon, authenticated using (true);

revoke all on function public.ny_okt(uuid, boolean, smallint, text) from public;
revoke all on function public.avslutt_okt(uuid, text) from public;
grant execute on function public.ny_okt(uuid, boolean, smallint, text) to anon, authenticated;
grant execute on function public.avslutt_okt(uuid, text) to anon, authenticated;
-- Supabase gir som standard anon alle rettigheter på nye tabeller. Vi strammer inn eksplisitt (i tillegg til RLS).
revoke all on public.okter, public.hendelser, public.tilbakemeldinger, public.regler from anon, authenticated;
grant select on public.okter, public.hendelser, public.tilbakemeldinger, public.regler to anon, authenticated;
grant insert on public.hendelser, public.tilbakemeldinger, public.regler to anon, authenticated;
grant update, delete on public.regler to anon, authenticated;

-- ---------- Eksempelregler (samme som src/data/regler.json) ----------
insert into public.regler (id, merke, modell, ar_fra, ar_til, frontlys, canbus, krever, rele_id, kilde, status, godkjent_av, godkjent_dato, merknad) values
  ('R-001', 'Toyota', 'RAV4', 2019, 2024, 'LED', 'CAN FD', 'rele', 'REL-CANFD', 'Service safari 12.10.2026 (byggemodul og chat) + fagperson (eksempel)', 'godkjent', 'Fagperson A (eksempel)', '2026-10-20', 'LED-frontlys og Canbus med CAN FD. Fjernlyssignalet kan ikke tappes direkte.'),
  ('R-002', 'Volvo', 'XC70', 2008, 2013, 'halogen', 'nei', 'kabelsett', null, 'Fagperson (eksempel)', 'godkjent', 'Fagperson A (eksempel)', '2026-10-20', 'Halogen fjernlys. Standard kabelsett med relé kobles til fjernlyset.'),
  ('R-003', 'Volkswagen', 'Golf', 2017, 2020, 'LED', 'CAN', 'rele', 'REL-CAN', 'Produsentens relétabell (eksempel)', 'godkjent', 'Fagperson B (eksempel)', '2026-10-28', 'LED-frontlys med klassisk CAN.'),
  ('R-004', 'Kia', 'Sportage', 2016, 2021, 'LED', 'CAN', 'rele', 'REL-CAN', 'Kundesenter-henvendelse (eksempel), ikke kontrollert', 'utkast', null, null, 'Utkast fra kundesenteret. Må kontrolleres av fagperson før den brukes som bekreftet.')
on conflict (id) do nothing;
