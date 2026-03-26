"use client";

import { useSupabaseQuery } from "./use-supabase-query";
import type { Trade } from "@/lib/types";
import { TRADE_LOG } from "@/lib/mock-data";

const MOCK_TRADES: Trade[] = TRADE_LOG.map((t) => ({
  id: String(t.id),
  user_id: "",
  trade_date: t.date,
  pair: t.pair,
  direction: t.direction,
  entry_price: t.entry,
  sl_price: t.sl,
  tp_price: t.tp,
  result: t.result,
  pips: t.pips,
  risk_reward: t.rr,
  session: t.session,
  notes: t.notes,
}));

export function useTrades() {
  const { data, loading } = useSupabaseQuery<Trade[]>(
    async (supabase) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: null };
      const { data, error } = await supabase
        .from("trade_log")
        .select("*")
        .eq("user_id", user.id)
        .order("trade_date", { ascending: false })
        .limit(50);
      return { data: data as Trade[] | null, error };
    },
    MOCK_TRADES,
  );

  return { trades: data, loading };
}
