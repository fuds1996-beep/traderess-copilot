"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDateRange } from "@/contexts/DateRangeContext";
import type { Trade } from "@/lib/types";

export function useTrades() {
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const { filterDates } = useDateRange();

  const fetchTrades = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("trade_log")
        .select("*")
        .eq("user_id", user.id)
        .order("trade_date", { ascending: false })
        .limit(500);

      setAllTrades((data as Trade[]) || []);
    } catch {
      setAllTrades([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  // Apply date range filter
  const trades = useMemo(() => filterDates(allTrades), [allTrades, filterDates]);
  const hasData = trades.length > 0;

  return { trades, loading, hasData, refresh: fetchTrades };
}
