import Anthropic from "@anthropic-ai/sdk";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ParsedJournalOnly {
  journal_date: string;
  day_of_week: string;
  market_mood: string;
  fundamentals_summary: string;
  emotion_before: string;
  emotion_during: string;
  emotion_after: string;
  effort_rating: number;
  journal_text: string;
  category_ratings: Record<string, number>;
  daily_checklist: { task: string; done: boolean; time?: string; notes?: string }[];
}

export interface ParsedTradeUpdate {
  trade_date: string;
  pair: string;
  direction: "Long" | "Short";
  entry_price: number;
  trade_evaluation: string;
  notes: string;
  trade_quality: string;
}

export interface JournalParseResult {
  journals: ParsedJournalOnly[];
  trade_updates: ParsedTradeUpdate[];
  confidence: "high" | "medium" | "low";
  notes: string;
}

// ─── Parser ──────────────────────────────────────────────────────────────────

/**
 * Lightweight AI parser that extracts ONLY journal entries and trade evaluations.
 * Much faster and cheaper than the comprehensive parser since it skips trade extraction.
 */
export async function parseSheetJournalsOnly(
  rows: string[][],
  weekStart: string,
): Promise<JournalParseResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

  const client = new Anthropic({ apiKey });

  const sheetText = rows
    .map((row, i) => `Row ${i}: ${row.join(" | ")}`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `You are a trading journal extraction expert. Below is raw data from a trader's weekly Google Sheets journal for week starting ${weekStart}.

Your job: extract ONLY journal entries and trade evaluations. Do NOT extract full trade data (prices, pips, R's, etc.) — those were already synced separately.

## 1. JOURNALS (array) — one per day that has a journal entry
- journal_date (YYYY-MM-DD), day_of_week
- market_mood (e.g. "Overall bearish", "Bullish")
- fundamentals_summary (e.g. "Medium (1 red report)")
- emotion_before, emotion_during, emotion_after (exact text like "Neutral", "Stressed", "Confident")
- effort_rating (count the stars ⭐, 1-5)
- journal_text: the COMPLETE daily summary/reflection text. Preserve EVERY word and paragraph. This is critical for AI pattern analysis.
- category_ratings: object with per-category scores if present (e.g. {"forecasting": 4, "psychology": 3, "execution": 4, "journalling": 3}). Different students rate different categories. Empty {} if none.
- daily_checklist: array of daily tasks if a structured tracker exists (e.g. [{"task": "HTF bias reviewed", "done": true, "time": "11:31", "notes": "Yes uncertainty"}]). Empty [] if none.

## 2. TRADE_UPDATES (array) — evaluation/notes for each trade found
For each trade row that has evaluation text or notes, extract just enough to identify the trade and its evaluation:
- trade_date (YYYY-MM-DD)
- pair (e.g. "EUR/USD")
- direction ("Long" or "Short")
- entry_price (decimal number — just for matching, doesn't need to be perfect)
- trade_evaluation: the FULL evaluation text. Preserve EVERY word. Never truncate.
- notes: the FULL notes text. Preserve EVERY word.
- trade_quality: e.g. "⭐⭐⭐" or "3/5" (empty string if not found)

IMPORTANT RULES:
- NEVER truncate or summarize journal_text or trade_evaluation — these are critical for AI coaching.
- Dates should be YYYY-MM-DD. If year isn't clear, use 2026.
- Skip decorative rows, motivational quotes (unless part of a journal), empty rows.
- Map star ratings: ⭐ = 1, ⭐⭐ = 2, ⭐⭐⭐ = 3, ⭐⭐⭐⭐ = 4, ⭐⭐⭐⭐⭐ = 5

Respond with ONLY valid JSON:
{
  "journals": [...],
  "trade_updates": [...],
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
  if (!jsonMatch) throw new Error("AI could not parse the journal data");

  const parsed = JSON.parse(jsonMatch[0]) as JournalParseResult;

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
      category_ratings: j.category_ratings && typeof j.category_ratings === "object" ? j.category_ratings : {},
      daily_checklist: Array.isArray(j.daily_checklist) ? j.daily_checklist : [],
    }));

  // Clean trade updates
  parsed.trade_updates = (parsed.trade_updates || [])
    .filter((t) => t.trade_date && (t.trade_evaluation || t.notes))
    .map((t) => ({
      trade_date: t.trade_date || "",
      pair: t.pair || "",
      direction: t.direction === "Short" ? "Short" : "Long",
      entry_price: Number(t.entry_price) || 0,
      trade_evaluation: t.trade_evaluation || "",
      notes: t.notes || "",
      trade_quality: t.trade_quality || "",
    }));

  return parsed;
}
