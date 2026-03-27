"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDateRange } from "@/contexts/DateRangeContext";
import type { ChartTimeEntry } from "@/lib/types";

export function useChartTime() {
  const [allEntries, setAllEntries] = useState<ChartTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { filterDates } = useDateRange();

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
        .limit(200);

      setAllEntries((data as ChartTimeEntry[]) || []);
    } catch {
      setAllEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const entries = useMemo(() => filterDates(allEntries), [allEntries, filterDates]);

  const totalMinutes = entries.reduce((s, e) => s + e.total_minutes, 0);
  const totalHours = Math.round(totalMinutes / 6) / 10;
  const avgPerDay = entries.length > 0 ? Math.round(totalMinutes / entries.length) : 0;

  return {
    entries, loading, hasData: entries.length > 0,
    totalMinutes, totalHours, avgPerDay, refresh: fetch,
  };
}
