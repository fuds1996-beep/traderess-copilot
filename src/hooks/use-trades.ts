"use client";

import { useSupabaseQuery } from "./use-supabase-query";
import type { Trade } from "@/lib/types";

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
    [],
  );

  const hasData = data.length > 0;

  return { trades: data, loading, hasData };
}
