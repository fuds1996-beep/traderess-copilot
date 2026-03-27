import Anthropic from "@anthropic-ai/sdk";

export interface ParsedTrade {
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

export interface ParseResult {
  trades: ParsedTrade[];
  confidence: "high" | "medium" | "low";
  notes: string;
}

/**
 * Uses Claude to intelligently parse raw spreadsheet rows into structured trades.
 * Works regardless of column order, naming, or spreadsheet layout.
 */
export async function parseSheetWithAI(
  rows: string[][],
): Promise<ParseResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const client = new Anthropic({ apiKey });

  // Send all rows — we need full evaluations, not truncated summaries
  const sampleRows = rows.slice(0, 150);
  const sheetText = sampleRows
    .map((row, i) => `Row ${i}: ${row.join(" | ")}`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 16384,
    messages: [
      {
        role: "user",
        content: `You are a trading data extraction expert. Below is raw data from a trader's Google Sheets trading journal. The spreadsheet may have:
- Decorative rows, merged cells, account labels, motivational quotes
- Headers that are NOT on row 0 — they could be anywhere
- Multiple account sections (10K, 50K, etc.) with trades under each
- Non-standard column names
- Dates in various formats (23/3/26, Mar 10, 2026-03-10)
- Empty rows, section dividers, psychology notes

Your job: extract ONLY the actual trade entries. Each trade must have ALL of these fields:

- account_name: which account (e.g. "10K Funded", "50K Funded") — look for labels like "Account 1", "10K", "50K" above the trade rows
- day: day of week (e.g. "Monday", "Tuesday")
- trade_date: ISO format YYYY-MM-DD
- scenario: e.g. "Primary", "Secondary" (empty string if not found)
- pair: e.g. "EUR/USD"
- session: e.g. "London", "NY Open", "Asia Close"
- time_of_entry: e.g. "8:49" (empty string if not found)
- time_of_exit: e.g. "9:11" (empty string if not found)
- entry_price: decimal number
- sl_price: stop loss price (0 if not found)
- tp_price: take profit price (0 if not found)
- entry_strategy: how they entered (empty string if not found)
- sl_strategy: how SL was set (empty string if not found)
- tp_strategy: how TP was set (empty string if not found)
- direction: "Long" or "Short"
- entry_conf_1: first confirmation (e.g. "Session high/low") — empty string if not found
- entry_conf_2: second confirmation (e.g. "RSI 15") — empty string if not found
- entry_conf_3: third confirmation — empty string if not found
- fundamental_check: boolean — did they check fundamentals?
- event_within_2h: boolean — was there a news event within 2 hours?
- safe_window: boolean — was it a safe trading window?
- result: "Win", "Loss", or "BE"
- overall_pips: the "Overall Pips" column — total pips gained or lost (number, negative for losses, e.g. 10.0, -42.0)
- pips: same value as overall_pips
- rs_gained: the "R's Gained/Lost" column — R-multiple value (number, e.g. 1.0, -1.0, 0.9). This is NOT the same as R2R. Look for a column with header containing "R's" or "R gained" or "R lost". If the trade was a loss, this should be NEGATIVE (e.g. -1.0). If a win, POSITIVE (e.g. 1.0, 0.5).
- risk_reward: the "R2R of Trade" column — ratio as string (e.g. "1:1", "2:1"). This is the risk-to-reward RATIO, not the R's gained.
- dollar_result: CRITICAL — this is the "$ Lost or Gained" column. Contains dollar amounts like "$125", "$1,474", "-$50", "$(1,368.00)". You MUST extract this value as a string with the dollar sign. Commas in numbers like "$1,474" should be preserved. Parentheses like $(500) mean negative. If the column header says "$ Lost or Gained" or "$ Result" or similar, map it here. This is one of the most important fields — do NOT leave it empty if the data exists.
- percent_risked: the "% Risked" column (NOT "% Gained/lost" which is a different column). e.g. "1.00%", "2%", "3.60%". Some spreadsheets have both "% Risked" and "% Gained/lost" — only map "% Risked" here, put "% Gained/lost" in custom_fields.
- before_picture: URL to before screenshot (empty string if not found)
- after_picture: URL to after screenshot (empty string if not found)
- trade_quality: e.g. "⭐⭐⭐" or "3/5" (empty string if not found)
- forecasted: e.g. "Trade was not forecasted", "Yes" (empty string if not found)
- trade_evaluation: the FULL trade evaluation/journal text — preserve every word, do NOT summarize or truncate. This is critical for pattern analysis. Empty string if not found.
- notes: the FULL notes text — preserve every word. Empty string if not found.
- custom_fields: an object containing ANY other columns from the spreadsheet that don't map to the fields above. For example: {"rsi_rate": 40, "tp_conf_1": "Session high/low", "dxy_conf": "Yes", "dxy_conf_1": "DXY SH&L", "pct_gained_lost": "2.10%"}. IMPORTANT: Different students have different extra columns. Capture ALL of them here. Use snake_case keys. Empty object {} if no extra columns.

Respond with ONLY valid JSON in this exact format, no other text:
{
  "trades": [...],
  "confidence": "high" | "medium" | "low",
  "notes": "brief description of what you found and any issues"
}

CRITICAL RULES:
- Skip rows that are clearly not trades (headers, labels, summaries, empty rows, psychology notes).
- Each physical trade entry in the spreadsheet should produce EXACTLY ONE trade object. Do NOT create duplicates.
- If the same trade appears under multiple account sections, each account's version IS a separate trade (different account_name).
- But the SAME row should NEVER produce two identical trades with the same account, date, and entry price.

Here is the spreadsheet data:

${sheetText}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI could not parse the spreadsheet data");
  }

  const parsed = JSON.parse(jsonMatch[0]) as ParseResult;

  // Validate and clean each trade
  parsed.trades = parsed.trades
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
      custom_fields: t.custom_fields && typeof t.custom_fields === "object" ? t.custom_fields : {},
    }));

  return parsed;
}
