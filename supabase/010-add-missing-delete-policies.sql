-- Add missing DELETE policies for tables that need them
-- Safe to re-run — skips if policy already exists

DO $$ BEGIN
  -- chart_time_log
  BEGIN CREATE POLICY "ct_delete" ON public.chart_time_log FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- weekly_summaries
  BEGIN CREATE POLICY "ws_delete" ON public.weekly_summaries FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- account_balances
  BEGIN CREATE POLICY "ab_delete" ON public.account_balances FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- trading_goals
  BEGIN CREATE POLICY "tg_delete" ON public.trading_goals FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- trading_accounts (if missing)
  BEGIN CREATE POLICY "ta_delete" ON public.trading_accounts FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- account_payouts (if missing)
  BEGIN CREATE POLICY "ap_delete" ON public.account_payouts FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
