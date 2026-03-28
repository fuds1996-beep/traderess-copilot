-- ══════════════════════════════════════════════════════════════════════
-- TRADERESS COPILOT — Run ALL migrations
-- Paste this entire block into Supabase SQL Editor and click Run.
-- Safe to re-run — uses IF NOT EXISTS / IF EXISTS throughout.
-- ══════════════════════════════════════════════════════════════════════

-- 002: Expand trade_log with full tracker columns
ALTER TABLE public.trade_log
  ADD COLUMN IF NOT EXISTS day text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS scenario text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS time_of_entry text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS time_of_exit text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS entry_strategy text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sl_strategy text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tp_strategy text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS entry_conf_1 text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS entry_conf_2 text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS entry_conf_3 text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS fundamental_check boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS event_within_2h boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS safe_window boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS overall_pips numeric(8,1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rs_gained numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dollar_result text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS percent_risked text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS before_picture text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS after_picture text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS trade_quality text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS forecasted text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS trade_evaluation text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS account_name text NOT NULL DEFAULT '';

-- 003: Comprehensive tracker tables
CREATE TABLE IF NOT EXISTS public.daily_journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journal_date date NOT NULL,
  day_of_week text NOT NULL DEFAULT '',
  week_start date NOT NULL DEFAULT current_date,
  market_mood text NOT NULL DEFAULT '',
  fundamentals_summary text NOT NULL DEFAULT '',
  emotion_before text NOT NULL DEFAULT '',
  emotion_during text NOT NULL DEFAULT '',
  emotion_after text NOT NULL DEFAULT '',
  effort_rating integer NOT NULL DEFAULT 0,
  journal_text text NOT NULL DEFAULT '',
  trades_taken integer NOT NULL DEFAULT 0,
  pips_positive numeric(8,1) NOT NULL DEFAULT 0,
  pips_negative numeric(8,1) NOT NULL DEFAULT 0,
  pips_overall numeric(8,1) NOT NULL DEFAULT 0,
  rs_total numeric(5,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, journal_date)
);

CREATE TABLE IF NOT EXISTS public.chart_time_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  week_start date NOT NULL DEFAULT current_date,
  chart_time_minutes integer NOT NULL DEFAULT 0,
  logging_time_minutes integer NOT NULL DEFAULT 0,
  education_time_minutes integer NOT NULL DEFAULT 0,
  total_minutes integer NOT NULL DEFAULT 0,
  time_slots jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, log_date)
);

CREATE TABLE IF NOT EXISTS public.weekly_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_end date NOT NULL DEFAULT current_date,
  week_label text NOT NULL DEFAULT '',
  overall_summary text NOT NULL DEFAULT '',
  total_chart_time_minutes integer NOT NULL DEFAULT 0,
  total_trades integer NOT NULL DEFAULT 0,
  total_pips numeric(8,1) NOT NULL DEFAULT 0,
  total_rs numeric(5,2) NOT NULL DEFAULT 0,
  trading_plan_text text NOT NULL DEFAULT '',
  risk_ladder_config jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

CREATE TABLE IF NOT EXISTS public.account_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_name text NOT NULL,
  week_start date NOT NULL,
  balance_start numeric(12,2) NOT NULL DEFAULT 0,
  balance_end numeric(12,2) NOT NULL DEFAULT 0,
  weekly_result numeric(12,2) NOT NULL DEFAULT 0,
  account_status text NOT NULL DEFAULT 'Active',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, account_name, week_start)
);

CREATE TABLE IF NOT EXISTS public.missed_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_date date NOT NULL,
  pair text NOT NULL DEFAULT 'EUR/USD',
  direction text NOT NULL DEFAULT 'Long',
  session text NOT NULL DEFAULT '',
  scenario text NOT NULL DEFAULT '',
  reason_missed text NOT NULL DEFAULT '',
  would_have_result text NOT NULL DEFAULT '',
  would_have_pips numeric(8,1) NOT NULL DEFAULT 0,
  entry_price numeric(10,5) NOT NULL DEFAULT 0,
  sl_price numeric(10,5) NOT NULL DEFAULT 0,
  tp_price numeric(10,5) NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trading_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_type text NOT NULL DEFAULT 'monthly',
  primary_goals jsonb NOT NULL DEFAULT '[]'::jsonb,
  process_goals jsonb NOT NULL DEFAULT '[]'::jsonb,
  psychological_goals jsonb NOT NULL DEFAULT '[]'::jsonb,
  improvement_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  core_focus jsonb NOT NULL DEFAULT '[]'::jsonb,
  intention_text text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_start, period_type)
);

-- 004: Expand trader_profiles
ALTER TABLE public.trader_profiles
  ADD COLUMN IF NOT EXISTS detailed_weaknesses jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS detailed_strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS successes jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS fears jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS hobbies jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS expectations jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS experience jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS trader_type text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS availability jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS responsibilities text NOT NULL DEFAULT '';

-- 005: Sync history
CREATE TABLE IF NOT EXISTS public.sync_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sync_mode text NOT NULL DEFAULT 'trades_only',
  sheet_name text NOT NULL DEFAULT '',
  week_start text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'success',
  confidence text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  synced jsonb NOT NULL DEFAULT '{}'::jsonb,
  duration_seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 009: Custom fields
ALTER TABLE public.trade_log
  ADD COLUMN IF NOT EXISTS custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.daily_journals
  ADD COLUMN IF NOT EXISTS category_ratings jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS daily_checklist jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.trader_profiles
  ADD COLUMN IF NOT EXISTS risk_plan jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ══════════════════════════════════════════════════════════════════════
-- RLS POLICIES (safe to re-run — will error on duplicates, that's OK)
-- ══════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  -- daily_journals
  ALTER TABLE public.daily_journals ENABLE ROW LEVEL SECURITY;
  BEGIN CREATE POLICY "dj_select" ON public.daily_journals FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "dj_insert" ON public.daily_journals FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "dj_update" ON public.daily_journals FOR UPDATE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "dj_delete" ON public.daily_journals FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- chart_time_log
  ALTER TABLE public.chart_time_log ENABLE ROW LEVEL SECURITY;
  BEGIN CREATE POLICY "ct_select" ON public.chart_time_log FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "ct_insert" ON public.chart_time_log FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "ct_update" ON public.chart_time_log FOR UPDATE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "ct_delete" ON public.chart_time_log FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- weekly_summaries
  ALTER TABLE public.weekly_summaries ENABLE ROW LEVEL SECURITY;
  BEGIN CREATE POLICY "ws_select" ON public.weekly_summaries FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "ws_insert" ON public.weekly_summaries FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "ws_update" ON public.weekly_summaries FOR UPDATE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "ws_delete" ON public.weekly_summaries FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- account_balances
  ALTER TABLE public.account_balances ENABLE ROW LEVEL SECURITY;
  BEGIN CREATE POLICY "ab_select" ON public.account_balances FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "ab_insert" ON public.account_balances FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "ab_update" ON public.account_balances FOR UPDATE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "ab_delete" ON public.account_balances FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- missed_trades
  ALTER TABLE public.missed_trades ENABLE ROW LEVEL SECURITY;
  BEGIN CREATE POLICY "mt_select" ON public.missed_trades FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "mt_insert" ON public.missed_trades FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "mt_update" ON public.missed_trades FOR UPDATE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "mt_delete" ON public.missed_trades FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- trading_goals
  ALTER TABLE public.trading_goals ENABLE ROW LEVEL SECURITY;
  BEGIN CREATE POLICY "tg_select" ON public.trading_goals FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "tg_insert" ON public.trading_goals FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "tg_update" ON public.trading_goals FOR UPDATE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "tg_delete" ON public.trading_goals FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- sync_history
  ALTER TABLE public.sync_history ENABLE ROW LEVEL SECURITY;
  BEGIN CREATE POLICY "sh_select" ON public.sync_history FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "sh_insert" ON public.sync_history FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "sh_delete" ON public.sync_history FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Indexes (safe to re-run)
CREATE INDEX IF NOT EXISTS idx_journals_user_date ON public.daily_journals(user_id, journal_date DESC);
CREATE INDEX IF NOT EXISTS idx_chart_time_user_date ON public.chart_time_log(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_summaries_user_week ON public.weekly_summaries(user_id, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_balances_user_account ON public.account_balances(user_id, account_name, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_missed_user_date ON public.missed_trades(user_id, trade_date DESC);
CREATE INDEX IF NOT EXISTS idx_goals_user_period ON public.trading_goals(user_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_sync_history_user ON public.sync_history(user_id, created_at DESC);

-- Realtime (safe to re-run)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_log;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_journals;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════════════
-- DONE — All migrations applied successfully
-- ══════════════════════════════════════════════════════════════════════
