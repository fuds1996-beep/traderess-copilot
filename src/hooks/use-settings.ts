"use client";

import { useCallback } from "react";
import { useSupabaseQuery } from "./use-supabase-query";
import { createClient } from "@/lib/supabase/client";
import type { CopilotSettings } from "@/lib/types";
import {
  TRADING_CONFIG,
  DATA_CONNECTIONS,
  NEWS_SOURCES,
  COPILOT_SKILLS,
} from "@/lib/mock-data";

const MOCK_SETTINGS: CopilotSettings = {
  id: "",
  primary_pair: TRADING_CONFIG[0].value,
  confluence_chart: TRADING_CONFIG[1].value,
  timezone: TRADING_CONFIG[2].value,
  trading_session: TRADING_CONFIG[3].value,
  risk_model: TRADING_CONFIG[4].value,
  max_daily_trades: TRADING_CONFIG[5].value,
  data_connections: DATA_CONNECTIONS,
  news_sources: NEWS_SOURCES,
  copilot_skills: COPILOT_SKILLS,
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
    MOCK_SETTINGS,
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

  // Derived: trading config as label/value pairs for the UI
  const tradingConfig = [
    { label: "Primary Pair", value: data.primary_pair },
    { label: "Confluence Chart", value: data.confluence_chart },
    { label: "Timezone", value: data.timezone },
    { label: "Trading Session", value: data.trading_session },
    { label: "Risk Model", value: data.risk_model },
    { label: "Max Daily Trades", value: data.max_daily_trades },
  ];

  return {
    settings: data,
    tradingConfig,
    loading,
    updateSettings,
  };
}
