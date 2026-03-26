// ─── Database row types (match supabase/schema.sql) ──────────────────────────

export type Sentiment = "bullish" | "bearish" | "neutral";

// trader_profiles
export interface TraderProfile {
  id: string;
  full_name: string;
  avatar_initial: string;
  bio: string;
  stage: string;
  funded_status: string;
  tracking_since: string;
  primary_pair: string;
  confluence_pair: string;
  session_focus: string;
  risk_model: string;
  strengths: { label: string; score: number }[];
  weaknesses: { label: string; score: number }[];
  radar_scores: { trait: string; value: number; fullMark: number }[];
  space_method: { letter: string; word: string; status: "good" | "warning"; note: string }[];
  behavioural_patterns: { pattern: string; frequency: string; trigger: string; severity: "high" | "medium" }[];
  trading_plan: { label: string; value: string }[];
}

// trading_performance
export interface WeeklyPerformance {
  id: string;
  user_id: string;
  week_label: string;
  week_start: string;
  week_end: string;
  pnl: number;
  trades: number;
  win_rate: number;
  r_value: number;
  wins: number;
  losses: number;
  breakeven: number;
  session_data: { session: string; trades: number; winRate: number; pips: number }[];
  day_data: { day: string; trades: number; winRate: number }[];
}

// trade_log
export interface Trade {
  id: string;
  user_id: string;
  trade_date: string;
  pair: string;
  direction: "Long" | "Short";
  entry_price: number;
  sl_price: number;
  tp_price: number;
  result: "Win" | "Loss" | "BE";
  pips: number;
  risk_reward: string;
  session: string;
  notes: string;
}

// weekly_briefings
export interface WeeklyBriefing {
  id: string;
  user_id: string;
  week_label: string;
  week_start: string;
  review_stats: { value: string; label: string; color: string }[];
  what_went_well: string;
  watch_out_for: string;
  articles_eurusd: { source: string; title: string; time: string; sentiment: Sentiment }[];
  articles_dxy: { source: string; title: string; time: string; sentiment: Sentiment }[];
  eurusd_bias: Sentiment;
  dxy_bias: Sentiment;
  key_insight: string;
  calendar_events: { day: string; time: string; event: string; impact: "high" | "medium" | "low"; currency: string }[];
  daily_risk_ratings: { day: string; risk: string; note: string; color: string }[];
  no_trade_zones: string;
  motivational_quote: string;
  pre_session_checklist: string[];
}

// prop_firm_accounts
export interface PropFirmAccount {
  id: string;
  user_id: string;
  account_name: string;
  status: string;
  progress: number;
  pnl: string;
}

// copilot_settings
export interface CopilotSettings {
  id: string;
  primary_pair: string;
  confluence_chart: string;
  timezone: string;
  trading_session: string;
  risk_model: string;
  max_daily_trades: string;
  data_connections: { name: string; desc: string; connected: boolean }[];
  news_sources: { name: string; url: string; active: boolean }[];
  copilot_skills: { name: string; desc: string; active: boolean }[];
}

// ─── Computed / view types ───────────────────────────────────────────────────

export interface DashboardStats {
  totalPnl: number;
  totalTrades: number;
  avgWinRate: string;
  cumPnl: { week: string; pnl: number }[];
  winLossData: { name: string; value: number }[];
}
