-- Sync history — tracks every Google Sheet sync run
-- Run in Supabase SQL Editor after previous migrations.

create table public.sync_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sync_mode text not null default 'trades_only',
  sheet_name text not null default '',
  week_start text not null default '',
  status text not null default 'success',
  confidence text not null default '',
  message text not null default '',
  synced jsonb not null default '{}'::jsonb,
  duration_seconds integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.sync_history enable row level security;
create policy "Users can view own sync history" on public.sync_history for select using (auth.uid() = user_id);
create policy "Users can insert own sync history" on public.sync_history for insert with check (auth.uid() = user_id);
create index idx_sync_history_user on public.sync_history(user_id, created_at desc);
