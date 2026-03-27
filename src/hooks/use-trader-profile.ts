"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TraderProfile, PropFirmAccount } from "@/lib/types";

const EMPTY_PROFILE: TraderProfile = {
  id: "", full_name: "", avatar_initial: "T", bio: "",
  stage: "Stage 1", funded_status: "Challenge", tracking_since: "",
  primary_pair: "EUR/USD", confluence_pair: "DXY", session_focus: "London Open", risk_model: "",
  strengths: [], weaknesses: [], radar_scores: [], space_method: [],
  behavioural_patterns: [], trading_plan: [],
  detailed_weaknesses: [], detailed_strengths: [], successes: [], fears: [],
  hobbies: [], expectations: [], experience: {}, trader_type: "",
  availability: { slot1: "", slot2: "", slot3: "" }, responsibilities: "", risk_plan: {},
};

export function useTraderProfile() {
  const [profile, setProfile] = useState<TraderProfile>(EMPTY_PROFILE);
  const [propAccounts, setPropAccounts] = useState<PropFirmAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [profileRes, accountsRes] = await Promise.all([
        supabase.from("trader_profiles").select("*").eq("id", user.id).single(),
        supabase.from("prop_firm_accounts").select("*").eq("user_id", user.id).order("created_at"),
      ]);

      if (profileRes.data) setProfile(profileRes.data as TraderProfile);
      setPropAccounts((accountsRes.data as PropFirmAccount[]) || []);
    } catch {
      // silently use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const hasData = profile.full_name !== "";

  return { profile, propAccounts, loading, hasData, refresh: fetch };
}
