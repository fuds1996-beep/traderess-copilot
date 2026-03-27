-- Add custom_fields to trade_log for student-specific extra columns
-- Add category_ratings + daily_checklist to daily_journals
-- Run in Supabase SQL Editor

ALTER TABLE public.trade_log
  ADD COLUMN IF NOT EXISTS custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.daily_journals
  ADD COLUMN IF NOT EXISTS category_ratings jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS daily_checklist jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Add risk_plan to trader_profiles for student-specific risk rules
ALTER TABLE public.trader_profiles
  ADD COLUMN IF NOT EXISTS risk_plan jsonb NOT NULL DEFAULT '{}'::jsonb;
