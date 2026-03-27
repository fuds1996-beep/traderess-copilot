-- Enable Supabase Realtime on key tables
-- Run in Supabase SQL Editor

-- Add tables to the supabase_realtime publication
alter publication supabase_realtime add table public.trade_log;
alter publication supabase_realtime add table public.daily_journals;
