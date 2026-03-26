-- Expand trader_profiles with detailed psychology data from Trader Profile CSV.
-- Run in Supabase SQL Editor after previous migrations.

alter table public.trader_profiles
  add column if not exists detailed_weaknesses jsonb not null default '[]'::jsonb,
  add column if not exists detailed_strengths jsonb not null default '[]'::jsonb,
  add column if not exists successes jsonb not null default '[]'::jsonb,
  add column if not exists fears jsonb not null default '[]'::jsonb,
  add column if not exists hobbies jsonb not null default '[]'::jsonb,
  add column if not exists expectations jsonb not null default '[]'::jsonb,
  add column if not exists experience jsonb not null default '{}'::jsonb,
  add column if not exists trader_type text not null default '',
  add column if not exists availability jsonb not null default '{}'::jsonb,
  add column if not exists responsibilities text not null default '';
