import Anthropic from "@anthropic-ai/sdk";

// ─── Types ───────────────────────────────────────────────────────────────────

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

export interface ExtrasParseResult {
  chart_time: ParsedChartTime[];
  account_balances: ParsedAccountBalance[];
  missed_trades: ParsedMissedTrade[];
  goals: ParsedGoals | null;
  weekly_summary: ParsedWeeklySummary | null;
  confidence: "high" | "medium" | "low";
  notes: string;
}

// ─── Parser ──────────────────────────────────────────────────────────────────

/**
 * Lightweight AI parser for the non-trade, non-journal data:
 * chart time, account balances, missed trades, goals, weekly summary.
 * Fast because it skips the heavy trade/journal extraction.
 */
export async function parseSheetExtras(
  rows: string[][],
  weekStart: string,
): Promise<ExtrasParseResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

  const client = new Anthropic({ apiKey });

  const sheetText = rows
    .map((row, i) => `Row ${i}: ${row.join(" | ")}`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are a trading data extraction expert. Below is raw data from a trader's weekly Google Sheets journal for week starting ${weekStart}.

SKIP all trade rows and daily journal text — those are handled separately. Extract ONLY these remaining sections:

## 1. CHART_TIME (array) — one per day with time tracking
- log_date (YYYY-MM-DD), day_of_week
- total_minutes: total chart/study time in minutes
- time_slots: array of {start, end} time strings

## 2. ACCOUNT_BALANCES (array) — one per account
- account_name (e.g. "10K Challenge", "50K Funded")
- balance_start: start-of-week balance (number)
- balance_end: end-of-week balance (number, 0 if not stated)
- weekly_result: balance_end - balance_start
- account_status: "Active", "Disqualified", "Blown", "Passed" etc.

## 3. MISSED_TRADES (array) — from "Missed/Avoided trades" section
- trade_date, pair, direction ("Long"/"Short"), session, reason_missed
- would_have_result, would_have_pips, entry_price, sl_price, tp_price, notes

## 4. GOALS (object or null) — from goals/intentions section
- primary_goals: [{goal, completed: false}]
- process_goals: [{goal, completed: false}]
- psychological_goals: [{goal, completed: false}]
- improvement_items: [{item, progress: ""}]
- core_focus: [string]
- intention_text: the main intention statement

## 5. WEEKLY_SUMMARY (object or null)
- overall_summary: the FULL "Overall Week" summary text (preserve every word, never truncate)
- trading_plan_text: the full weekly trading plan text (preserve every word)
- risk_ladder_config: [{account, sl_pips, tp_pips, risk_pct}]

RULES:
- Dates in YYYY-MM-DD. If year unclear, use 2026.
- If a section doesn't exist, return empty array or null.
- NEVER truncate overall_summary or trading_plan_text.

Respond with ONLY valid JSON:
{
  "chart_time": [...],
  "account_balances": [...],
  "missed_trades": [...],
  "goals": {...} or null,
  "weekly_summary": {...} or null,
  "confidence": "high"|"medium"|"low",
  "notes": "brief description"
}

Here is the spreadsheet data:

${sheetText}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Not finding extras is non-fatal — sheet may just not have these sections
    return {
      chart_time: [],
      account_balances: [],
      missed_trades: [],
      goals: null,
      weekly_summary: null,
      confidence: "low",
      notes: "Could not extract extras from sheet",
    };
  }

  const parsed = JSON.parse(jsonMatch[0]) as ExtrasParseResult;

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
