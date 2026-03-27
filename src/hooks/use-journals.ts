"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDateRange } from "@/contexts/DateRangeContext";
import type { DailyJournal } from "@/lib/types";

export function useJournals(weekStart?: string) {
  const [allJournals, setAllJournals] = useState<DailyJournal[]>([]);
  const [loading, setLoading] = useState(true);
  const { filterDates } = useDateRange();

  const fetch = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      let query = supabase
        .from("daily_journals")
        .select("*")
        .eq("user_id", user.id)
        .order("journal_date", { ascending: true });

      if (weekStart) {
        query = query.eq("week_start", weekStart);
      }

      const { data } = await query.limit(200);
      setAllJournals((data as DailyJournal[]) || []);
    } catch {
      setAllJournals([]);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => { fetch(); }, [fetch]);

  const journals = useMemo(() => filterDates(allJournals), [allJournals, filterDates]);

  return { journals, loading, hasData: journals.length > 0, refresh: fetch };
}
