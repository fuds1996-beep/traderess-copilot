"use client";

import { useSupabaseQuery } from "./use-supabase-query";
import type { WeeklyBriefing } from "@/lib/types";

export function useBriefing() {
  const { data, loading } = useSupabaseQuery<WeeklyBriefing | null>(
    async (supabase) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: null };
      const { data, error } = await supabase
        .from("weekly_briefings")
        .select("*")
        .eq("user_id", user.id)
        .order("week_start", { ascending: false })
        .limit(1)
        .single();
      return { data: data as WeeklyBriefing | null, error };
    },
    null,
  );

  const hasData = data !== null;

  return { briefing: data, loading, hasData };
}
