"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MissedTrade } from "@/lib/types";

export function useMissedTrades() {
  const [trades, setTrades] = useState<MissedTrade[]>([]);
  const [loading, setLoading] = useState(true);

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
        .limit(50);

      setTrades((data as MissedTrade[]) || []);
    } catch {
      setTrades([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  // Discipline stats
  const avoidedWins = trades.filter((t) => t.would_have_result === "Win").length;
  const avoidedLosses = trades.filter((t) => t.would_have_result === "Loss").length;

  return { trades, loading, hasData: trades.length > 0, avoidedWins, avoidedLosses, refresh: fetch };
}
