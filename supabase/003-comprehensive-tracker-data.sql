-- Comprehensive tracker data — extends the schema with journals, chart time,
-- account balances, missed trades, weekly summaries, and goals.
-- Run this in Supabase SQL Editor after schema.sql and 002-expand-trade-log.sql.

-- ─── DAILY JOURNALS ──────────────────────────────────────────────────────────
-- Rich daily journal entries with emotions, market mood, and full text.

create table public.daily_journals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journal_date date not null,
  day_of_week text not null default '',
  week_start date not null,
  market_mood text not null default '',
  fundamentals_summary text not null default '',
  emotion_before text not null default '',
  emotion_during text not null default '',
  emotion_after text not null default '',
  effort_rating integer not null default 0,
  journal_text text not null default '',
  trades_taken integer not null default 0,
  pips_positive numeric(8,1) not null default 0,
  pips_negative numeric(8,1) not null default 0,
  pips_overall numeric(8,1) not null default 0,
  rs_total numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  unique(user_id, journal_date)
);

alter table public.daily_journals enable row level security;
create policy "Users can view own journals" on public.daily_journals for select using (auth.uid() = user_id);
create policy "Users can insert own journals" on public.daily_journals for insert with check (auth.uid() = user_id);
create policy "Users can update own journals" on public.daily_journals for update using (auth.uid() = user_id);
create policy "Users can delete own journals" on public.daily_journals for delete using (auth.uid() = user_id);
create index idx_journals_user_date on public.daily_journals(user_id, journal_date desc);


-- ─── CHART TIME LOG ──────────────────────────────────────────────────────────
-- Tracks time spent on chart analysis, journaling, and education per day.

create table public.chart_time_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  week_start date not null,
  chart_time_minutes integer not null default 0,
  logging_time_minutes integer not null default 0,
  education_time_minutes integer not null default 0,
  total_minutes integer not null default 0,
  time_slots jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, log_date)
);

alter table public.chart_time_log enable row level security;
create policy "Users can view own chart time" on public.chart_time_log for select using (auth.uid() = user_id);
create policy "Users can insert own chart time" on public.chart_time_log for insert with check (auth.uid() = user_id);
create policy "Users can update own chart time" on public.chart_time_log for update using (auth.uid() = user_id);
create index idx_chart_time_user_date on public.chart_time_log(user_id, log_date desc);


-- ─── WEEKLY SUMMARIES ────────────────────────────────────────────────────────
-- Aggregated weekly data: overall summary, trading plan, risk config.

create table public.weekly_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  week_label text not null default '',
  overall_summary text not null default '',
  total_chart_time_minutes integer not null default 0,
  total_trades integer not null default 0,
  total_pips numeric(8,1) not null default 0,
  total_rs numeric(5,2) not null default 0,
  trading_plan_text text not null default '',
  risk_ladder_config jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, week_start)
);

alter table public.weekly_summaries enable row level security;
create policy "Users can view own summaries" on public.weekly_summaries for select using (auth.uid() = user_id);
create policy "Users can insert own summaries" on public.weekly_summaries for insert with check (auth.uid() = user_id);
create policy "Users can update own summaries" on public.weekly_summaries for update using (auth.uid() = user_id);
create index idx_summaries_user_week on public.weekly_summaries(user_id, week_start desc);


-- ─── ACCOUNT BALANCES ────────────────────────────────────────────────────────
-- Weekly balance snapshots per prop firm account.

create table public.account_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_name text not null,
  week_start date not null,
  balance_start numeric(12,2) not null default 0,
  balance_end numeric(12,2) not null default 0,
  weekly_result numeric(12,2) not null default 0,
  account_status text not null default 'Active',
  created_at timestamptz not null default now(),
  unique(user_id, account_name, week_start)
);

alter table public.account_balances enable row level security;
create policy "Users can view own balances" on public.account_balances for select using (auth.uid() = user_id);
create policy "Users can insert own balances" on public.account_balances for insert with check (auth.uid() = user_id);
create policy "Users can update own balances" on public.account_balances for update using (auth.uid() = user_id);
create index idx_balances_user_account on public.account_balances(user_id, account_name, week_start desc);


-- ─── MISSED TRADES ───────────────────────────────────────────────────────────
-- Trades the student chose not to take — critical for discipline analysis.

create table public.missed_trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trade_date date not null,
  pair text not null default 'EUR/USD',
  direction text not null check (direction in ('Long', 'Short')),
  session text not null default '',
  scenario text not null default '',
  reason_missed text not null default '',
  would_have_result text not null default '',
  would_have_pips numeric(8,1) not null default 0,
  entry_price numeric(10,5) not null default 0,
  sl_price numeric(10,5) not null default 0,
  tp_price numeric(10,5) not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now()
);

alter table public.missed_trades enable row level security;
create policy "Users can view own missed trades" on public.missed_trades for select using (auth.uid() = user_id);
create policy "Users can insert own missed trades" on public.missed_trades for insert with check (auth.uid() = user_id);
create policy "Users can update own missed trades" on public.missed_trades for update using (auth.uid() = user_id);
create policy "Users can delete own missed trades" on public.missed_trades for delete using (auth.uid() = user_id);
create index idx_missed_user_date on public.missed_trades(user_id, trade_date desc);


-- ─── TRADING GOALS ───────────────────────────────────────────────────────────
-- Monthly/weekly goals and intentions.

create table public.trading_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  period_type text not null default 'monthly',
  primary_goals jsonb not null default '[]'::jsonb,
  process_goals jsonb not null default '[]'::jsonb,
  psychological_goals jsonb not null default '[]'::jsonb,
  improvement_items jsonb not null default '[]'::jsonb,
  core_focus jsonb not null default '[]'::jsonb,
  intention_text text not null default '',
  created_at timestamptz not null default now(),
  unique(user_id, period_start, period_type)
);

alter table public.trading_goals enable row level security;
create policy "Users can view own goals" on public.trading_goals for select using (auth.uid() = user_id);
create policy "Users can insert own goals" on public.trading_goals for insert with check (auth.uid() = user_id);
create policy "Users can update own goals" on public.trading_goals for update using (auth.uid() = user_id);
create index idx_goals_user_period on public.trading_goals(user_id, period_start desc);
