-- Expand trade_log with all columns from the student's trading tracker.
-- Run this in Supabase SQL Editor after the initial schema.

-- Add new columns (all optional with defaults so existing rows aren't broken)
alter table public.trade_log
  add column if not exists day text not null default '',
  add column if not exists scenario text not null default '',
  add column if not exists time_of_entry text not null default '',
  add column if not exists time_of_exit text not null default '',
  add column if not exists entry_strategy text not null default '',
  add column if not exists sl_strategy text not null default '',
  add column if not exists tp_strategy text not null default '',
  add column if not exists entry_conf_1 text not null default '',
  add column if not exists entry_conf_2 text not null default '',
  add column if not exists entry_conf_3 text not null default '',
  add column if not exists fundamental_check boolean not null default false,
  add column if not exists event_within_2h boolean not null default false,
  add column if not exists safe_window boolean not null default true,
  add column if not exists overall_pips numeric(8,1) not null default 0,
  add column if not exists rs_gained numeric(5,2) not null default 0,
  add column if not exists dollar_result text not null default '',
  add column if not exists percent_risked text not null default '',
  add column if not exists before_picture text not null default '',
  add column if not exists after_picture text not null default '',
  add column if not exists trade_quality text not null default '',
  add column if not exists forecasted text not null default '',
  add column if not exists trade_evaluation text not null default '',
  add column if not exists account_name text not null default '';

-- Drop the old check constraint on direction to allow more values
alter table public.trade_log drop constraint if exists trade_log_direction_check;
alter table public.trade_log add constraint trade_log_direction_check
  check (direction in ('Long', 'Short'));

-- Drop the old check constraint on result to allow BE
alter table public.trade_log drop constraint if exists trade_log_result_check;
alter table public.trade_log add constraint trade_log_result_check
  check (result in ('Win', 'Loss', 'BE'));
