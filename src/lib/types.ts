// ─── Database row types (match supabase/schema.sql) ──────────────────────────

export type Sentiment = "bullish" | "bearish" | "neutral";

// trader_profiles
export interface ProfileWeakness {
  name: string;
  real_life_example: string;
  affects_learning: string;
  affects_planning: string;
  affects_execution: string;
  affects_results: string;
  affects_evaluation: string;
}

export interface ProfileStrength {
  name: string;
  real_life_example: string;
  affects_learning: string;
  affects_planning: string;
  affects_execution: string;
  affects_results: string;
  affects_evaluation: string;
}

export interface ProfileSuccess {
  title: string;
  description: string;
  how_benefited: string;
  how_achieved: string;
  time_taken: string;
}

export interface ProfileFear {
  title: string;
  description: string;
  how_affected: string;
  how_overcome: string;
  plan_to_overcome: string;
}

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
  // Simple scored lists (from weekly tracker)
  strengths: { label: string; score: number }[];
  weaknesses: { label: string; score: number }[];
  radar_scores: { trait: string; value: number; fullMark: number }[];
  space_method: { letter: string; word: string; status: "good" | "warning"; note: string }[];
  behavioural_patterns: { pattern: string; frequency: string; trigger: string; severity: "high" | "medium" }[];
  trading_plan: { label: string; value: string }[];
  // Deep psychology data (from profile tracker)
  detailed_weaknesses: ProfileWeakness[];
  detailed_strengths: ProfileStrength[];
  successes: ProfileSuccess[];
  fears: ProfileFear[];
  hobbies: string[];
  expectations: string[];
  experience: Record<string, string>;
  trader_type: string;
  availability: { slot1: string; slot2: string; slot3: string };
  responsibilities: string;
  risk_plan: Record<string, unknown>;
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

// trade_log — matches the student's full trading tracker
export interface Trade {
  id: string;
  user_id: string;
  account_name: string;
  day: string;
  trade_date: string;
  scenario: string;
  pair: string;
  session: string;
  time_of_entry: string;
  time_of_exit: string;
  entry_price: number;
  sl_price: number;
  tp_price: number;
  entry_strategy: string;
  sl_strategy: string;
  tp_strategy: string;
  direction: "Long" | "Short";
  entry_conf_1: string;
  entry_conf_2: string;
  entry_conf_3: string;
  fundamental_check: boolean;
  event_within_2h: boolean;
  safe_window: boolean;
  result: "Win" | "Loss" | "BE";
  overall_pips: number;
  pips: number;
  rs_gained: number;
  risk_reward: string;
  dollar_result: string;
  percent_risked: string;
  before_picture: string;
  after_picture: string;
  trade_quality: string;
  forecasted: string;
  trade_evaluation: string;
  notes: string;
  custom_fields: Record<string, string | number | boolean>;
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

// daily_journals
export interface DailyJournal {
  id: string;
  user_id: string;
  journal_date: string;
  day_of_week: string;
  week_start: string;
  market_mood: string;
  fundamentals_summary: string;
  emotion_before: string;
  emotion_during: string;
  emotion_after: string;
  effort_rating: number;
  journal_text: string;
  trades_taken: number;
  pips_positive: number;
  pips_negative: number;
  pips_overall: number;
  rs_total: number;
  category_ratings: Record<string, number>;
  daily_checklist: { task: string; done: boolean; time?: string; notes?: string }[];
}

// chart_time_log
export interface ChartTimeEntry {
  id: string;
  user_id: string;
  log_date: string;
  week_start: string;
  chart_time_minutes: number;
  logging_time_minutes: number;
  education_time_minutes: number;
  total_minutes: number;
  time_slots: { start: string; end: string; category: string }[];
}

// weekly_summaries
export interface WeeklySummary {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  week_label: string;
  overall_summary: string;
  total_chart_time_minutes: number;
  total_trades: number;
  total_pips: number;
  total_rs: number;
  trading_plan_text: string;
  risk_ladder_config: { account: string; sl_pips: number; tp_pips: number; r_value: number; risk_pct: number }[];
}

// account_balances
export interface AccountBalance {
  id: string;
  user_id: string;
  account_name: string;
  week_start: string;
  balance_start: number;
  balance_end: number;
  weekly_result: number;
  account_status: string;
}

// missed_trades
export interface MissedTrade {
  id: string;
  user_id: string;
  trade_date: string;
  pair: string;
  direction: "Long" | "Short";
  session: string;
  scenario: string;
  reason_missed: string;
  would_have_result: string;
  would_have_pips: number;
  entry_price: number;
  sl_price: number;
  tp_price: number;
  notes: string;
}

// trading_goals
export interface TradingGoal {
  id: string;
  user_id: string;
  period_start: string;
  period_type: "monthly" | "weekly";
  primary_goals: { goal: string; completed: boolean }[];
  process_goals: { goal: string; completed: boolean }[];
  psychological_goals: { goal: string; completed: boolean }[];
  improvement_items: { item: string; progress: string }[];
  core_focus: string[];
  intention_text: string;
}

// trading_accounts
export interface TradingAccount {
  id: string;
  user_id: string;
  account_name: string;
  firm_name: string;
  account_size: number;
  account_type: "challenge" | "verification" | "funded";
  status: "active" | "passed" | "failed" | "completed";
  profit_target_pct: number;
  max_drawdown_pct: number;
  current_balance: number;
  starting_balance: number;
  current_pnl: number;
  profit_split_pct: number;
  phase: string;
  notes: string;
  started_at: string | null;
  ended_at: string | null;
}

// account_payouts
export interface AccountPayout {
  id: string;
  user_id: string;
  account_id: string;
  payout_date: string;
  gross_amount: number;
  profit_split_pct: number;
  net_amount: number;
  status: "pending" | "paid" | "rejected";
  notes: string;
}

// ─── Computed / view types ───────────────────────────────────────────────────

export interface DashboardStats {
  totalPnl: number;
  totalTrades: number;
  avgWinRate: string;
  cumPnl: { week: string; pnl: number }[];
  winLossData: { name: string; value: number }[];
  sessionData?: { session: string; trades: number; winRate: number; pips: number }[];
  dayData?: { day: string; trades: number; winRate: number }[];
}
