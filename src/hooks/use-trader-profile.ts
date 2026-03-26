"use client";

import { useSupabaseQuery } from "./use-supabase-query";
import type { TraderProfile, PropFirmAccount } from "@/lib/types";

const EMPTY_PROFILE: TraderProfile = {
  id: "",
  full_name: "",
  avatar_initial: "T",
  bio: "",
  stage: "Stage 1",
  funded_status: "Challenge",
  tracking_since: "",
  primary_pair: "EUR/USD",
  confluence_pair: "DXY",
  session_focus: "London Open",
  risk_model: "",
  strengths: [],
  weaknesses: [],
  radar_scores: [],
  space_method: [],
  behavioural_patterns: [],
  trading_plan: [],
};

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
    EMPTY_PROFILE,
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
    [],
  );

  const hasData = profile.data.full_name !== "";

  return {
    profile: profile.data,
    propAccounts: propAccounts.data,
    loading: profile.loading || propAccounts.loading,
    hasData,
  };
}
