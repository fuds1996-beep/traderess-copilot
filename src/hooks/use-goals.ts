"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TradingGoal } from "@/lib/types";

export function useGoals() {
  const [goals, setGoals] = useState<TradingGoal | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("trading_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("period_start", { ascending: false })
        .limit(1)
        .single();

      setGoals((data as TradingGoal) || null);
    } catch {
      setGoals(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  // Compute completion percentages
  const primaryPct = goals?.primary_goals?.length
    ? Math.round((goals.primary_goals.filter((g) => g.completed).length / goals.primary_goals.length) * 100)
    : 0;
  const processPct = goals?.process_goals?.length
    ? Math.round((goals.process_goals.filter((g) => g.completed).length / goals.process_goals.length) * 100)
    : 0;
  const psychPct = goals?.psychological_goals?.length
    ? Math.round((goals.psychological_goals.filter((g) => g.completed).length / goals.psychological_goals.length) * 100)
    : 0;

  return { goals, loading, hasData: goals !== null, primaryPct, processPct, psychPct, refresh: fetch };
}
