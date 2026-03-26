-- Traderess Copilot — Database Schema
-- Run this in your Supabase SQL Editor to create all tables.
-- Assumes Supabase Auth is already enabled (provides auth.users).

-- ─── TRADER PROFILES ─────────────────────────────────────────────────────────
-- Extends auth.users with trading-specific profile data.

create table public.trader_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_initial text not null default 'T',
  bio text not null default '',
  stage text not null default 'Stage 1',
  funded_status text not null default 'Challenge',
  tracking_since date not null default current_date,
  primary_pair text not null default 'EUR/USD',
  confluence_pair text not null default 'DXY',
  session_focus text not null default 'London Open',
  risk_model text not null default 'Ladder (0.5–1.5%)',

  -- JSON columns for flexible structured data
  strengths jsonb not null default '[]'::jsonb,
  weaknesses jsonb not null default '[]'::jsonb,
  radar_scores jsonb not null default '[]'::jsonb,
  space_method jsonb not null default '[]'::jsonb,
  behavioural_patterns jsonb not null default '[]'::jsonb,
  trading_plan jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trader_profiles enable row level security;

create policy "Users can view their own profile"
  on public.trader_profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.trader_profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.trader_profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.trader_profiles (id, full_name, avatar_initial)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(left(new.raw_user_meta_data ->> 'full_name', 1), 'T')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ─── TRADING PERFORMANCE (WEEKLY) ────────────────────────────────────────────

create table public.trading_performance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_label text not null,
  week_start date not null,
  week_end date not null,
  pnl numeric(10,2) not null default 0,
  trades integer not null default 0,
  win_rate numeric(5,2) not null default 0,
  r_value numeric(5,2) not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  breakeven integer not null default 0,

  -- Session-level aggregates (JSON for flexibility)
  session_data jsonb not null default '[]'::jsonb,
  day_data jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now(),

  unique(user_id, week_start)
);

alter table public.trading_performance enable row level security;

create policy "Users can view their own performance"
  on public.trading_performance for select
  using (auth.uid() = user_id);

create policy "Users can insert their own performance"
  on public.trading_performance for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own performance"
  on public.trading_performance for update
  using (auth.uid() = user_id);


-- ─── TRADE LOG ───────────────────────────────────────────────────────────────

create table public.trade_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trade_date date not null,
  pair text not null default 'EUR/USD',
  direction text not null check (direction in ('Long', 'Short')),
  entry_price numeric(10,5) not null,
  sl_price numeric(10,5) not null,
  tp_price numeric(10,5) not null,
  result text not null check (result in ('Win', 'Loss', 'BE')),
  pips numeric(8,1) not null default 0,
  risk_reward text not null default '0:0',
  session text not null default 'London',
  notes text not null default '',
  created_at timestamptz not null default now()
);

alter table public.trade_log enable row level security;

create policy "Users can view their own trades"
  on public.trade_log for select
  using (auth.uid() = user_id);

create policy "Users can insert their own trades"
  on public.trade_log for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own trades"
  on public.trade_log for update
  using (auth.uid() = user_id);

create policy "Users can delete their own trades"
  on public.trade_log for delete
  using (auth.uid() = user_id);


-- ─── WEEKLY BRIEFINGS ────────────────────────────────────────────────────────

create table public.weekly_briefings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_label text not null,
  week_start date not null,

  -- Last week review
  review_stats jsonb not null default '{}'::jsonb,
  what_went_well text not null default '',
  watch_out_for text not null default '',

  -- Market context
  articles_eurusd jsonb not null default '[]'::jsonb,
  articles_dxy jsonb not null default '[]'::jsonb,
  eurusd_bias text not null default 'neutral',
  dxy_bias text not null default 'neutral',
  key_insight text not null default '',

  -- Calendar & guidance
  calendar_events jsonb not null default '[]'::jsonb,
  daily_risk_ratings jsonb not null default '[]'::jsonb,
  no_trade_zones text not null default '',
  motivational_quote text not null default '',
  pre_session_checklist jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now(),

  unique(user_id, week_start)
);

alter table public.weekly_briefings enable row level security;

create policy "Users can view their own briefings"
  on public.weekly_briefings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own briefings"
  on public.weekly_briefings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own briefings"
  on public.weekly_briefings for update
  using (auth.uid() = user_id);


-- ─── PROP FIRM ACCOUNTS ─────────────────────────────────────────────────────

create table public.prop_firm_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_name text not null,
  status text not null default 'Active',
  progress numeric(5,2) not null default 0,
  pnl text not null default '$0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.prop_firm_accounts enable row level security;

create policy "Users can view their own accounts"
  on public.prop_firm_accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own accounts"
  on public.prop_firm_accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own accounts"
  on public.prop_firm_accounts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own accounts"
  on public.prop_firm_accounts for delete
  using (auth.uid() = user_id);


-- ─── COPILOT SETTINGS ────────────────────────────────────────────────────────

create table public.copilot_settings (
  id uuid primary key references auth.users(id) on delete cascade,

  -- Trading config
  primary_pair text not null default 'EUR/USD',
  confluence_chart text not null default 'DXY',
  timezone text not null default 'CET (Central European)',
  trading_session text not null default 'London Open (07:00–13:00)',
  risk_model text not null default 'Ladder (0.5%–1.5%)',
  max_daily_trades text not null default '2–3',

  -- Connections (JSON: {name, desc, connected})
  data_connections jsonb not null default '[]'::jsonb,

  -- News sources (JSON: {name, url, active})
  news_sources jsonb not null default '[]'::jsonb,

  -- Copilot skills (JSON: {name, desc, active})
  copilot_skills jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.copilot_settings enable row level security;

create policy "Users can view their own settings"
  on public.copilot_settings for select
  using (auth.uid() = id);

create policy "Users can update their own settings"
  on public.copilot_settings for update
  using (auth.uid() = id);

create policy "Users can insert their own settings"
  on public.copilot_settings for insert
  with check (auth.uid() = id);


-- ─── AUTO-CREATE SETTINGS ON SIGNUP ──────────────────────────────────────────

create or replace function public.handle_new_user_settings()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.copilot_settings (id)
  values (new.id);
  return new;
end;
$$;

create or replace trigger on_auth_user_created_settings
  after insert on auth.users
  for each row execute function public.handle_new_user_settings();


-- ─── INDEXES ─────────────────────────────────────────────────────────────────

create index idx_performance_user_week on public.trading_performance(user_id, week_start desc);
create index idx_trade_log_user_date on public.trade_log(user_id, trade_date desc);
create index idx_briefings_user_week on public.weekly_briefings(user_id, week_start desc);
create index idx_prop_accounts_user on public.prop_firm_accounts(user_id);
