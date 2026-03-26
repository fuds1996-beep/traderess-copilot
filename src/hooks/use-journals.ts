"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DailyJournal } from "@/lib/types";

export function useJournals(weekStart?: string) {
  const [journals, setJournals] = useState<DailyJournal[]>([]);
  const [loading, setLoading] = useState(true);

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

      const { data } = await query.limit(100);
      setJournals((data as DailyJournal[]) || []);
    } catch {
      setJournals([]);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => { fetch(); }, [fetch]);

  return { journals, loading, hasData: journals.length > 0, refresh: fetch };
}
