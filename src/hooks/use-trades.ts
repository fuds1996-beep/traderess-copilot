"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDateRange } from "@/contexts/DateRangeContext";
import { useRealtimeSubscription } from "./use-realtime";
import { useToast } from "@/components/ui/Toast";
import type { Trade } from "@/lib/types";

export function useTrades() {
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const { filterDates } = useDateRange();
  const { toast } = useToast();
  const prevCountRef = useRef(0);
  const readyRef = useRef(false);
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; });

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

      const newTrades = (data as Trade[]) || [];

      // Toast on realtime update (not initial load)
      if (readyRef.current && newTrades.length !== prevCountRef.current) {
        const diff = newTrades.length - prevCountRef.current;
        if (diff > 0) toastRef.current(`${diff} new trade${diff > 1 ? "s" : ""} synced`, "success");
        else if (diff < 0) toastRef.current(`${Math.abs(diff)} trade${Math.abs(diff) > 1 ? "s" : ""} removed`, "info");
      }
      prevCountRef.current = newTrades.length;

      setAllTrades(newTrades);
    } catch {
      setAllTrades([]);
    } finally {
      setLoading(false);
      readyRef.current = true;
      setReady(true);
    }
  }, []); // No dependencies — stable callback

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  useRealtimeSubscription("trade_log", ready, fetchTrades);

  const trades = useMemo(() => filterDates(allTrades), [allTrades, filterDates]);
  const hasData = trades.length > 0;

  return { trades, loading, hasData, refresh: fetchTrades };
}
