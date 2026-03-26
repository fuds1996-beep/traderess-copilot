"use client";

import { useCallback } from "react";
import { useSupabaseQuery } from "./use-supabase-query";
import { createClient } from "@/lib/supabase/client";
import type { CopilotSettings } from "@/lib/types";

const EMPTY_SETTINGS: CopilotSettings = {
  id: "",
  primary_pair: "EUR/USD",
  confluence_chart: "DXY",
  timezone: "CET (Central European)",
  trading_session: "London Open (07:00\u201313:00)",
  risk_model: "",
  max_daily_trades: "2\u20133",
  data_connections: [],
  news_sources: [],
  copilot_skills: [],
};

export function useSettings() {
  const { data, loading } = useSupabaseQuery<CopilotSettings>(
    async (supabase) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: null };
      const { data, error } = await supabase
        .from("copilot_settings")
        .select("*")
        .eq("id", user.id)
        .single();
      return { data: data as CopilotSettings | null, error };
    },
    EMPTY_SETTINGS,
  );

  const updateSettings = useCallback(
    async (updates: Partial<CopilotSettings>) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("copilot_settings")
        .update(updates)
        .eq("id", user.id);
    },
    [],
  );

  const tradingConfig = [
    { label: "Primary Pair", value: data.primary_pair },
    { label: "Confluence Chart", value: data.confluence_chart },
    { label: "Timezone", value: data.timezone },
    { label: "Trading Session", value: data.trading_session },
    { label: "Risk Model", value: data.risk_model || "Not set" },
    { label: "Max Daily Trades", value: data.max_daily_trades },
  ];

  return { settings: data, tradingConfig, loading, updateSettings };
}
