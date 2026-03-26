"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ChartTimeEntry } from "@/lib/types";

export function useChartTime() {
  const [entries, setEntries] = useState<ChartTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("chart_time_log")
        .select("*")
        .eq("user_id", user.id)
        .order("log_date", { ascending: true })
        .limit(100);

      setEntries((data as ChartTimeEntry[]) || []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  // Computed
  const totalMinutes = entries.reduce((s, e) => s + e.total_minutes, 0);
  const totalHours = Math.round(totalMinutes / 6) / 10; // 1 decimal
  const avgPerDay = entries.length > 0 ? Math.round(totalMinutes / entries.length) : 0;

  return {
    entries,
    loading,
    hasData: entries.length > 0,
    totalMinutes,
    totalHours,
    avgPerDay,
    refresh: fetch,
  };
}
