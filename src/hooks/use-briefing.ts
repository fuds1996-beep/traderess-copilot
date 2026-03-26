"use client";

import { useSupabaseQuery } from "./use-supabase-query";
import type { WeeklyBriefing } from "@/lib/types";
import {
  ARTICLES_EURUSD,
  ARTICLES_DXY,
  WEEK_REVIEW_STATS,
  CALENDAR_EVENTS,
  DAILY_RISK_RATINGS,
  PRE_SESSION_CHECKLIST,
} from "@/lib/mock-data";

const MOCK_BRIEFING: WeeklyBriefing = {
  id: "",
  user_id: "",
  week_label: "Mar 16–20, 2026",
  week_start: "2026-03-16",
  review_stats: WEEK_REVIEW_STATS,
  what_went_well:
    "Tuesday and Thursday trades were textbook session high/low patient entries. Recovered from Sunday\u2019s loss within 48 hours. Avoided 2 sub-par setups that would have been losses \u2014 saving you money. Win rate 80% vs your 69% average.",
  watch_out_for:
    "The Sunday wine trade happened again \u2014 second consecutive weekend. Both times: home after wine \u2192 RSI alert \u2192 impulsive gap trade \u2192 immediate SL hit. Chart time at all-time low (3hrs) for 2nd week in a row.",
  articles_eurusd: ARTICLES_EURUSD,
  articles_dxy: ARTICLES_DXY,
  eurusd_bias: "bearish",
  dxy_bias: "bullish",
  key_insight:
    "Rabobank cut their 1-month EUR/USD forecast to 1.04 (from 1.16). ING flagged peripheral Euro sovereign spreads widening (Greece-to-Germany). New calculation: every $10 oil rise adds 0.2% to US inflation \u2014 at $100/bbl that\u2019s 0.8% headline CPI. Fed rate cut expectations slashed from 50bps to just 25bps this year.",
  calendar_events: CALENDAR_EVENTS,
  daily_risk_ratings: DAILY_RISK_RATINGS,
  no_trade_zones:
    "No trading within 2 hours of FOMC (Wed 19:00 CET). No trading during or within 2 hours of ECB decision (Wed 15:15 CET). Single account only \u2014 this is not the week for multi-account scaling.",
  motivational_quote:
    "You\u2019re 11 weeks in with a funded account and a 50K verification running. Your win rate is 69.2% with positive R. The quiet market is testing your patience. If you feel the urge to trade during the storm \u2014 remember your best weeks had 1\u20132 trades. Patience IS the strategy.",
  pre_session_checklist: PRE_SESSION_CHECKLIST,
};

export function useBriefing() {
  const { data, loading } = useSupabaseQuery<WeeklyBriefing>(
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
    MOCK_BRIEFING,
  );

  return { briefing: data, loading };
}
