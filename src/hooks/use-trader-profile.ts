"use client";

import { useSupabaseQuery } from "./use-supabase-query";
import type { TraderProfile, PropFirmAccount } from "@/lib/types";
import {
  STRENGTHS,
  WEAKNESSES,
  RADAR_DATA,
  SPACE_METHOD,
  BEHAVIOURAL_PATTERNS,
  TRADING_PLAN,
  PROFILE_META,
  PROP_ACCOUNTS,
} from "@/lib/mock-data";

const MOCK_PROFILE: TraderProfile = {
  id: "",
  full_name: "Marlena",
  avatar_initial: "M",
  bio: "EUR/USD level-based trader — London session specialist — Ladder risk management",
  stage: "Stage 2",
  funded_status: "Funded",
  tracking_since: "2026-01-01",
  primary_pair: PROFILE_META[1].value,
  confluence_pair: "DXY",
  session_focus: PROFILE_META[2].value,
  risk_model: PROFILE_META[3].value,
  strengths: STRENGTHS,
  weaknesses: WEAKNESSES,
  radar_scores: RADAR_DATA,
  space_method: SPACE_METHOD,
  behavioural_patterns: BEHAVIOURAL_PATTERNS,
  trading_plan: TRADING_PLAN,
};

const MOCK_PROP_ACCOUNTS: PropFirmAccount[] = PROP_ACCOUNTS.map((a, i) => ({
  id: String(i),
  user_id: "",
  account_name: a.name,
  status: a.status,
  progress: a.progress,
  pnl: a.pnl,
}));

export function useTraderProfile() {
  const profile = useSupabaseQuery<TraderProfile>(
    async (supabase) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: null };
      const { data, error } = await supabase
        .from("trader_profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      return { data: data as TraderProfile | null, error };
    },
    MOCK_PROFILE,
  );

  const propAccounts = useSupabaseQuery<PropFirmAccount[]>(
    async (supabase) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: null };
      const { data, error } = await supabase
        .from("prop_firm_accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at");
      return { data: data as PropFirmAccount[] | null, error };
    },
    MOCK_PROP_ACCOUNTS,
  );

  return {
    profile: profile.data,
    propAccounts: propAccounts.data,
    loading: profile.loading || propAccounts.loading,
  };
}
