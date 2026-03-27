"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WeeklyBriefing } from "@/lib/types";

export function useBriefing() {
  const [briefing, setBriefing] = useState<WeeklyBriefing | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("weekly_briefings")
        .select("*")
        .eq("user_id", user.id)
        .order("week_start", { ascending: false })
        .limit(1)
        .single();

      setBriefing((data as WeeklyBriefing) || null);
    } catch {
      setBriefing(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { briefing, loading, hasData: briefing !== null, refresh: fetch };
}
