import Anthropic from "@anthropic-ai/sdk";
import type { ParsedTrade } from "./ai-sheet-parser";

// ─── Types for comprehensive extraction ──────────────────────────────────────

export interface ParsedJournalEntry {
  journal_date: string;
  day_of_week: string;
  market_mood: string;
  fundamentals_summary: string;
  emotion_before: string;
  emotion_during: string;
  emotion_after: string;
  effort_rating: number;
  journal_text: string;
}

export interface ParsedChartTime {
  log_date: string;
  day_of_week: string;
  total_minutes: number;
  time_slots: { start: string; end: string }[];
}

export interface ParsedAccountBalance {
  account_name: string;
  balance_start: number;
  balance_end: number;
  weekly_result: number;
  account_status: string;
}

export interface ParsedMissedTrade {
  trade_date: string;
  pair: string;
  direction: "Long" | "Short";
  session: string;
  reason_missed: string;
  would_have_result: string;
  would_have_pips: number;
  entry_price: number;
  sl_price: number;
  tp_price: number;
  notes: string;
}

export interface ParsedGoals {
  primary_goals: { goal: string; completed: boolean }[];
  process_goals: { goal: string; completed: boolean }[];
  psychological_goals: { goal: string; completed: boolean }[];
  improvement_items: { item: string; progress: string }[];
  core_focus: string[];
  intention_text: string;
}

export interface ParsedWeeklySummary {
  overall_summary: string;
  trading_plan_text: string;
  risk_ladder_config: { account: string; sl_pips: number; tp_pips: number; risk_pct: number }[];
}

export interface ComprehensiveParseResult {
  trades: ParsedTrade[];
  journals: ParsedJournalEntry[];
  chart_time: ParsedChartTime[];
  account_balances: ParsedAccountBalance[];
  missed_trades: ParsedMissedTrade[];
  goals: ParsedGoals | null;
  weekly_summary: ParsedWeeklySummary | null;
  confidence: "high" | "medium" | "low";
  notes: string;
}

// ─── Main parser ─────────────────────────────────────────────────────────────

export async function parseSheetComprehensive(
  rows: string[][],
  weekStart: string,
): Promise<ComprehensiveParseResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

  const client = new Anthropic({ apiKey });

  // Build the full sheet text — send everything
  const sheetText = rows
    .map((row, i) => `Row ${i}: ${row.join(" | ")}`)
    .join("\n");

  // Single comprehensive extraction — the spreadsheet is one coherent document
  // and Claude can understand the full context better in one pass
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 16384,
    messages: [
      {
        role: "user",
        content: `You are a trading data extraction expert. Below is the COMPLETE raw data from a trader's weekly Google Sheets trading journal for week starting ${weekStart}.

This spreadsheet contains multiple sections. Extract ALL of the following data types:

## 1. TRADES (array)
For each actual trade entry:
- account_name, day, trade_date (YYYY-MM-DD), scenario, pair, session
- time_of_entry, time_of_exit, entry_price, sl_price, tp_price
- entry_strategy, sl_strategy, tp_strategy, direction ("Long"/"Short")
- entry_conf_1, entry_conf_2, entry_conf_3
- fundamental_check (bool), event_within_2h (bool), safe_window (bool)
- result ("Win"/"Loss"/"BE")
- overall_pips: the "Overall Pips" column (number, negative for losses)
- pips: same as overall_pips
- rs_gained: the "R's Gained/Lost" column — R-multiple value (number, e.g. 1.0, -1.0). NEGATIVE for losses. NOT the same as R2R ratio.
- risk_reward: the "R2R of Trade" column — ratio string like "1:1"
- dollar_result: the "$ Lost or Gained" column — parse numbers, parentheses $(500) = negative
- percent_risked: the "% Risked" column
- before_picture, after_picture: TradingView screenshot URLs
- trade_quality, forecasted, trade_evaluation (FULL text, never truncate), notes

## 2. JOURNALS (array) — one per day that has a journal entry
- journal_date (YYYY-MM-DD), day_of_week
- market_mood (e.g. "Overall bearish")
- fundamentals_summary (e.g. "Medium (1 red report)")
- emotion_before, emotion_during, emotion_after (the exact text like "Neutral", "Stressed")
- effort_rating (count the stars ⭐, 1-5)
- journal_text: the COMPLETE daily summary text. Preserve EVERY word and paragraph.

## 3. CHART_TIME (array) — one per day that has time tracking
- log_date (YYYY-MM-DD), day_of_week
- total_minutes: total chart/study time in minutes
- time_slots: array of {start, end} strings

## 4. ACCOUNT_BALANCES (array) — one per account found
- account_name (e.g. "10K Challenge", "10K Funded", "50K Verification")
- balance_start: start of week balance (number)
- balance_end: end of week balance (number, 0 if not stated)
- weekly_result: balance_end - balance_start
- account_status: "Active", "Disqualified", "Blown", "Passed" etc.

## 5. MISSED_TRADES (array) — from the "Missed/Avoided trades" section
- trade_date, pair, direction, session, reason_missed, would_have_result, would_have_pips, entry_price, sl_price, tp_price, notes

## 6. GOALS (object or null) — from "Goals & Intentions" section
- primary_goals: [{goal, completed: false}]
- process_goals: [{goal, completed: false}]
- psychological_goals: [{goal, completed: false}]
- improvement_items: [{item, progress: ""}]
- core_focus: [string]
- intention_text: the main intention statement

## 7. WEEKLY_SUMMARY (object or null)
- overall_summary: the FULL "Overall Week" summary text (preserve every word)
- trading_plan_text: the full weekly trading plan text block (preserve every word)
- risk_ladder_config: [{account, sl_pips, tp_pips, risk_pct}]

IMPORTANT RULES:
- NEVER truncate or summarize journal_text, trade_evaluation, overall_summary, or trading_plan_text. These are critical for AI pattern analysis.
- Dates should be YYYY-MM-DD format. If the year isn't clear, use 2026.
- Skip decorative rows, motivational quotes (unless they're part of a journal), empty rows.
- For account names, look for labels like "10K", "50K", "Account 1/2/3" near the trades.
- Map star ratings: ⭐ = 1, ⭐⭐ = 2, ⭐⭐⭐ = 3, ⭐⭐⭐⭐ = 4, ⭐⭐⭐⭐⭐ = 5
- If a section doesn't exist in the data, return empty array or null.

Respond with ONLY valid JSON:
{
  "trades": [...],
  "journals": [...],
  "chart_time": [...],
  "account_balances": [...],
  "missed_trades": [...],
  "goals": {...} or null,
  "weekly_summary": {...} or null,
  "confidence": "high"|"medium"|"low",
  "notes": "brief description of what was found"
}

Here is the spreadsheet data:

${sheetText}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI could not parse the spreadsheet data");

  const parsed = JSON.parse(jsonMatch[0]) as ComprehensiveParseResult;

  // Clean trades (same validation as existing parser)
  parsed.trades = (parsed.trades || [])
    .filter((t) => t.trade_date && t.entry_price > 0)
    .map((t) => ({
      account_name: t.account_name || "",
      day: t.day || "",
      trade_date: t.trade_date,
      scenario: t.scenario || "",
      pair: t.pair || "EUR/USD",
      session: t.session || "London",
      time_of_entry: t.time_of_entry || "",
      time_of_exit: t.time_of_exit || "",
      entry_price: Number(t.entry_price) || 0,
      sl_price: Number(t.sl_price) || 0,
      tp_price: Number(t.tp_price) || 0,
      entry_strategy: t.entry_strategy || "",
      sl_strategy: t.sl_strategy || "",
      tp_strategy: t.tp_strategy || "",
      direction: t.direction === "Short" ? "Short" : "Long",
      entry_conf_1: t.entry_conf_1 || "",
      entry_conf_2: t.entry_conf_2 || "",
      entry_conf_3: t.entry_conf_3 || "",
      fundamental_check: !!t.fundamental_check,
      event_within_2h: !!t.event_within_2h,
      safe_window: t.safe_window !== false,
      result: t.result === "Loss" ? "Loss" : t.result === "BE" ? "BE" : "Win",
      overall_pips: Number(t.overall_pips) || Number(t.pips) || 0,
      pips: Number(t.pips) || Number(t.overall_pips) || 0,
      rs_gained: Number(t.rs_gained) || 0,
      risk_reward: t.risk_reward || "0:0",
      dollar_result: t.dollar_result || "",
      percent_risked: t.percent_risked || "",
      before_picture: t.before_picture || "",
      after_picture: t.after_picture || "",
      trade_quality: t.trade_quality || "",
      forecasted: t.forecasted || "",
      trade_evaluation: t.trade_evaluation || "",
      notes: t.notes || "",
    }));

  // Clean journals
  parsed.journals = (parsed.journals || [])
    .filter((j) => j.journal_date || j.day_of_week)
    .map((j) => ({
      journal_date: j.journal_date || "",
      day_of_week: j.day_of_week || "",
      market_mood: j.market_mood || "",
      fundamentals_summary: j.fundamentals_summary || "",
      emotion_before: j.emotion_before || "",
      emotion_during: j.emotion_during || "",
      emotion_after: j.emotion_after || "",
      effort_rating: Number(j.effort_rating) || 0,
      journal_text: j.journal_text || "",
    }));

  // Clean chart time
  parsed.chart_time = (parsed.chart_time || []).map((c) => ({
    log_date: c.log_date || "",
    day_of_week: c.day_of_week || "",
    total_minutes: Number(c.total_minutes) || 0,
    time_slots: c.time_slots || [],
  }));

  // Clean account balances
  parsed.account_balances = (parsed.account_balances || [])
    .filter((a) => a.account_name)
    .map((a) => ({
      account_name: a.account_name || "",
      balance_start: Number(a.balance_start) || 0,
      balance_end: Number(a.balance_end) || 0,
      weekly_result: Number(a.weekly_result) || 0,
      account_status: a.account_status || "Active",
    }));

  // Clean missed trades
  parsed.missed_trades = (parsed.missed_trades || []).map((m) => ({
    trade_date: m.trade_date || "",
    pair: m.pair || "EUR/USD",
    direction: m.direction === "Short" ? "Short" : "Long",
    session: m.session || "",
    reason_missed: m.reason_missed || "",
    would_have_result: m.would_have_result || "",
    would_have_pips: Number(m.would_have_pips) || 0,
    entry_price: Number(m.entry_price) || 0,
    sl_price: Number(m.sl_price) || 0,
    tp_price: Number(m.tp_price) || 0,
    notes: m.notes || "",
  }));

  return parsed;
}
