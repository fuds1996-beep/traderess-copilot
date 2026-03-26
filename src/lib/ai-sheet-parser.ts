import Anthropic from "@anthropic-ai/sdk";

export interface ParsedTrade {
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

  // Send a reasonable chunk — first 60 rows should capture headers + trades
  // but cap the total text size to avoid huge token usage
  const sampleRows = rows.slice(0, 60);
  const sheetText = sampleRows
    .map((row, i) => `Row ${i}: ${row.join(" | ")}`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are a trading data extraction expert. Below is raw data from a trader's Google Sheets trading journal. The spreadsheet may have:
- Decorative rows, merged cells, account labels, motivational quotes
- Headers that are NOT on row 0 — they could be anywhere
- Multiple account sections (10K, 50K, etc.) with trades under each
- Non-standard column names (e.g. "Major Pair" instead of "Pair", "Outcome" instead of "Result")
- Dates in various formats (23/3/26, Mar 10, 2026-03-10)
- Empty rows, section dividers, psychology notes

Your job: extract ONLY the actual trade entries. Each trade should have:
- trade_date: ISO format YYYY-MM-DD
- pair: e.g. "EUR/USD"
- direction: "Long" or "Short"
- entry_price: decimal number
- sl_price: stop loss price (0 if not found)
- tp_price: take profit price (0 if not found)
- result: "Win", "Loss", or "BE"
- pips: number (negative for losses, 0 if not found)
- risk_reward: e.g. "2:1" or "1:1" (use "0:0" if not found)
- session: e.g. "London", "NY", "Asian" (use "London" if not found)
- notes: brief trade notes/evaluation (max 200 chars, empty string if not found)

Respond with ONLY valid JSON in this exact format, no other text:
{
  "trades": [...],
  "confidence": "high" | "medium" | "low",
  "notes": "brief description of what you found and any issues"
}

If a field is ambiguous, make your best guess. If you see "Long" direction indicators (like price going up, buy signals), use "Long". If the result isn't explicit but pips are positive, assume "Win".

Skip rows that are clearly not trades (headers, labels, summaries, empty rows, psychology notes).

Here is the spreadsheet data:

${sheetText}`,
      },
    ],
  });

  // Extract the text response
  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Parse the JSON — Claude might wrap it in markdown code blocks
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI could not parse the spreadsheet data");
  }

  const parsed = JSON.parse(jsonMatch[0]) as ParseResult;

  // Validate and clean each trade
  parsed.trades = parsed.trades
    .filter((t) => t.trade_date && t.entry_price > 0)
    .map((t) => ({
      trade_date: t.trade_date,
      pair: t.pair || "EUR/USD",
      direction: t.direction === "Short" ? "Short" : "Long",
      entry_price: Number(t.entry_price) || 0,
      sl_price: Number(t.sl_price) || 0,
      tp_price: Number(t.tp_price) || 0,
      result:
        t.result === "Loss" ? "Loss" : t.result === "BE" ? "BE" : "Win",
      pips: Number(t.pips) || 0,
      risk_reward: t.risk_reward || "0:0",
      session: t.session || "London",
      notes: (t.notes || "").slice(0, 500),
    }));

  return parsed;
}
