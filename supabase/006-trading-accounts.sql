-- Trading Accounts — tracks prop firm accounts lifecycle, goals, and payouts
-- Run in Supabase SQL Editor after previous migrations.

create table public.trading_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_name text not null,
  firm_name text not null default '',
  account_size numeric(12,2) not null default 0,
  account_type text not null check (account_type in ('challenge', 'verification', 'funded')),
  status text not null default 'active' check (status in ('active', 'passed', 'failed', 'completed')),
  profit_target_pct numeric(5,2) not null default 0,
  max_drawdown_pct numeric(5,2) not null default 0,
  current_balance numeric(12,2) not null default 0,
  starting_balance numeric(12,2) not null default 0,
  current_pnl numeric(12,2) not null default 0,
  profit_split_pct numeric(5,2) not null default 80,
  phase text not null default '',
  notes text not null default '',
  started_at date,
  ended_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trading_accounts enable row level security;
create policy "Users can view own accounts" on public.trading_accounts for select using (auth.uid() = user_id);
create policy "Users can insert own accounts" on public.trading_accounts for insert with check (auth.uid() = user_id);
create policy "Users can update own accounts" on public.trading_accounts for update using (auth.uid() = user_id);
create policy "Users can delete own accounts" on public.trading_accounts for delete using (auth.uid() = user_id);
create index idx_trading_accounts_user on public.trading_accounts(user_id);

-- Payouts table
create table public.account_payouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.trading_accounts(id) on delete cascade,
  payout_date date not null,
  gross_amount numeric(12,2) not null default 0,
  profit_split_pct numeric(5,2) not null default 80,
  net_amount numeric(12,2) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'paid', 'rejected')),
  notes text not null default '',
  created_at timestamptz not null default now()
);

alter table public.account_payouts enable row level security;
create policy "Users can view own payouts" on public.account_payouts for select using (auth.uid() = user_id);
create policy "Users can insert own payouts" on public.account_payouts for insert with check (auth.uid() = user_id);
create policy "Users can update own payouts" on public.account_payouts for update using (auth.uid() = user_id);
create index idx_payouts_user on public.account_payouts(user_id);
create index idx_payouts_account on public.account_payouts(account_id);
