"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDateRange } from "@/contexts/DateRangeContext";
import type { MissedTrade } from "@/lib/types";

export function useMissedTrades() {
  const [allTrades, setAllTrades] = useState<MissedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const { filterDates } = useDateRange();

  const fetch = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("missed_trades")
        .select("*")
        .eq("user_id", user.id)
        .order("trade_date", { ascending: false })
        .limit(100);

      setAllTrades((data as MissedTrade[]) || []);
    } catch {
      setAllTrades([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const trades = useMemo(() => filterDates(allTrades), [allTrades, filterDates]);
  const avoidedWins = trades.filter((t) => t.would_have_result === "Win").length;
  const avoidedLosses = trades.filter((t) => t.would_have_result === "Loss").length;

  return { trades, loading, hasData: trades.length > 0, avoidedWins, avoidedLosses, refresh: fetch };
}
