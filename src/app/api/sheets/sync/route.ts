import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchSheetRows } from "@/lib/sheets";
import { parseSheetWithAI } from "@/lib/ai-sheet-parser";
import { parseSheetComprehensive } from "@/lib/ai-comprehensive-parser";
import { parseSheetJournalsOnly } from "@/lib/ai-journal-parser";

// Allow up to 5 minutes for AI parsing on Vercel
export const maxDuration = 300;

/**
 * POST /api/sheets/sync
 * Body: { spreadsheetId, range?, mode?: "trades_only" | "comprehensive" | "journals_only", weekStart? }
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { spreadsheetId, range, mode = "trades_only", weekStart } = body as {
    spreadsheetId: string;
    range?: string;
    mode?: "trades_only" | "comprehensive" | "journals_only";
    weekStart?: string;
  };

  if (!spreadsheetId) {
    return NextResponse.json({ error: "Missing spreadsheetId" }, { status: 400 });
  }

  try {
    const rows = await fetchSheetRows(spreadsheetId, range || "Sheet1");
    if (rows.length < 2) {
      return NextResponse.json({ error: "Sheet has no data rows" }, { status: 400 });
    }

    // Compute week start from the weekStart param or first Monday of the data
    const ws = weekStart || new Date().toISOString().split("T")[0];

    if (mode === "comprehensive") {
      return await syncComprehensive(supabase, user.id, rows, ws);
    } else if (mode === "journals_only") {
      return await syncJournalsOnly(supabase, user.id, rows, ws);
    } else {
      return await syncTradesOnly(supabase, user.id, rows);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("ANTHROPIC_API_KEY")) {
      return NextResponse.json(
        { error: "AI parsing requires an Anthropic API key. Add ANTHROPIC_API_KEY to your environment variables." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Sync failed", details: msg }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncTradesOnly(supabase: any, userId: string, rows: string[][]) {
  const parsed = await parseSheetWithAI(rows);

  if (parsed.trades.length === 0) {
    return NextResponse.json({
      synced: { trades: 0 },
      confidence: parsed.confidence,
      message: "No trades found. " + (parsed.notes || ""),
    });
  }

  // Deduplicate: delete existing trades for the same dates before inserting
  const dateRange = getDateRange(parsed.trades);
  if (dateRange) {
    await supabase.from("trade_log")
      .delete()
      .eq("user_id", userId)
      .gte("trade_date", dateRange.minDate)
      .lte("trade_date", dateRange.maxDate);
  }

  const trades = parsed.trades.map((t) => ({ user_id: userId, ...t }));
  const { error } = await supabase.from("trade_log").insert(trades);
  if (error && !error.message.includes("duplicate") && error.code !== "23505") {
    throw new Error(error.message);
  }

  const rangeLabel = dateRange ? `${dateRange.minDate} to ${dateRange.maxDate}` : "unknown";
  return NextResponse.json({
    synced: { trades: parsed.trades.length },
    confidence: parsed.confidence,
    message: `Synced ${parsed.trades.length} trades (replaced existing for ${rangeLabel}). ${parsed.notes}`,
  });
}

// Helper to get min/max dates from parsed trades
function getDateRange(trades: { trade_date: string }[]): { minDate: string; maxDate: string } | null {
  const dates = trades.map((t) => t.trade_date).filter(Boolean).sort();
  if (dates.length === 0) return null;
  return { minDate: dates[0], maxDate: dates[dates.length - 1] };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncComprehensive(supabase: any, userId: string, rows: string[][], weekStart: string) {
  const parsed = await parseSheetComprehensive(rows, weekStart);
  const counts: Record<string, number> = {};

  // Run all inserts in parallel
  const promises: Promise<void>[] = [];

  // 1. Trades — delete existing for the date range first, then insert
  if (parsed.trades.length > 0) {
    counts.trades = parsed.trades.length;
    const dateRange = getDateRange(parsed.trades);
    promises.push(
      (async () => {
        // Delete existing trades for this date range to prevent duplicates
        if (dateRange) {
          await supabase.from("trade_log")
            .delete()
            .eq("user_id", userId)
            .gte("trade_date", dateRange.minDate)
            .lte("trade_date", dateRange.maxDate);
        }
        const { error } = await supabase.from("trade_log").insert(
          parsed.trades.map((t) => ({ user_id: userId, ...t })),
        );
        if (error && !error.message.includes("duplicate") && error.code !== "23505") {
          console.warn("trade_log insert:", error.message);
        }
      })(),
    );
  }

  // 2. Journals
  if (parsed.journals.length > 0) {
    counts.journals = parsed.journals.length;
    promises.push(
      supabase.from("daily_journals").upsert(
        parsed.journals.map((j) => ({
          user_id: userId,
          week_start: weekStart,
          ...j,
        })),
        { onConflict: "user_id,journal_date" },
      ).then(({ error }: { error: { message: string } | null }) => {
        if (error) console.warn("daily_journals upsert:", error.message);
      }),
    );
  }

  // 3. Chart time
  if (parsed.chart_time.length > 0) {
    counts.chart_time = parsed.chart_time.length;
    promises.push(
      supabase.from("chart_time_log").upsert(
        parsed.chart_time.map((c) => ({
          user_id: userId,
          week_start: weekStart,
          total_minutes: c.total_minutes,
          chart_time_minutes: c.total_minutes, // default: all counted as chart time
          logging_time_minutes: 0,
          education_time_minutes: 0,
          log_date: c.log_date,
          time_slots: c.time_slots,
        })),
        { onConflict: "user_id,log_date" },
      ).then(({ error }: { error: { message: string } | null }) => {
        if (error) console.warn("chart_time_log upsert:", error.message);
      }),
    );
  }

  // 4. Account balances
  if (parsed.account_balances.length > 0) {
    counts.account_balances = parsed.account_balances.length;
    promises.push(
      supabase.from("account_balances").upsert(
        parsed.account_balances.map((a) => ({
          user_id: userId,
          week_start: weekStart,
          ...a,
        })),
        { onConflict: "user_id,account_name,week_start" },
      ).then(({ error }: { error: { message: string } | null }) => {
        if (error) console.warn("account_balances upsert:", error.message);
      }),
    );
  }

  // 5. Missed trades
  if (parsed.missed_trades.length > 0) {
    counts.missed_trades = parsed.missed_trades.length;
    promises.push(
      supabase.from("missed_trades").insert(
        parsed.missed_trades.map((m) => ({ user_id: userId, ...m })),
      ).then(({ error }: { error: { message: string } | null }) => {
        if (error) console.warn("missed_trades insert:", error.message);
      }),
    );
  }

  // 6. Goals
  if (parsed.goals) {
    counts.goals = 1;
    promises.push(
      supabase.from("trading_goals").upsert(
        {
          user_id: userId,
          period_start: weekStart.slice(0, 7) + "-01", // first of month
          period_type: "monthly",
          ...parsed.goals,
        },
        { onConflict: "user_id,period_start,period_type" },
      ).then(({ error }: { error: { message: string } | null }) => {
        if (error) console.warn("trading_goals upsert:", error.message);
      }),
    );
  }

  // 7. Weekly summary
  if (parsed.weekly_summary) {
    counts.weekly_summary = 1;
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 4);
    promises.push(
      supabase.from("weekly_summaries").upsert(
        {
          user_id: userId,
          week_start: weekStart,
          week_end: weekEnd.toISOString().split("T")[0],
          week_label: `Week of ${weekStart}`,
          overall_summary: parsed.weekly_summary.overall_summary,
          trading_plan_text: parsed.weekly_summary.trading_plan_text,
          risk_ladder_config: parsed.weekly_summary.risk_ladder_config,
          total_trades: parsed.trades.length,
        },
        { onConflict: "user_id,week_start" },
      ).then(({ error }: { error: { message: string } | null }) => {
        if (error) console.warn("weekly_summaries upsert:", error.message);
      }),
    );
  }

  await Promise.all(promises);

  // Build summary message
  const parts = Object.entries(counts).map(([k, v]) => `${v} ${k.replace("_", " ")}`);
  const message = `Full sync complete: ${parts.join(", ")}. ${parsed.notes}`;

  return NextResponse.json({
    synced: counts,
    confidence: parsed.confidence,
    message,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncJournalsOnly(supabase: any, userId: string, rows: string[][], weekStart: string) {
  const parsed = await parseSheetJournalsOnly(rows, weekStart);
  const counts: Record<string, number> = {};
  const promises: Promise<void>[] = [];

  // 1. Upsert daily journals
  if (parsed.journals.length > 0) {
    counts.journals = parsed.journals.length;
    promises.push(
      supabase.from("daily_journals").upsert(
        parsed.journals.map((j) => ({
          user_id: userId,
          week_start: weekStart,
          ...j,
        })),
        { onConflict: "user_id,journal_date" },
      ).then(({ error }: { error: { message: string } | null }) => {
        if (error) console.warn("daily_journals upsert:", error.message);
      }),
    );
  }

  // 2. Match trade evaluations to existing trades and update them
  if (parsed.trade_updates.length > 0) {
    let matched = 0;
    for (const update of parsed.trade_updates) {
      // Find matching trade by date, pair, direction, and approximate entry price
      const { data: candidates } = await supabase.from("trade_log")
        .select("id, entry_price")
        .eq("user_id", userId)
        .eq("trade_date", update.trade_date)
        .eq("pair", update.pair)
        .eq("direction", update.direction);

      if (candidates && candidates.length > 0) {
        // Pick the closest match by entry price
        let best = candidates[0];
        let bestDiff = Math.abs(best.entry_price - update.entry_price);
        for (const c of candidates) {
          const diff = Math.abs(c.entry_price - update.entry_price);
          if (diff < bestDiff) { best = c; bestDiff = diff; }
        }

        const updateFields: Record<string, string> = {};
        if (update.trade_evaluation) updateFields.trade_evaluation = update.trade_evaluation;
        if (update.notes) updateFields.notes = update.notes;
        if (update.trade_quality) updateFields.trade_quality = update.trade_quality;

        if (Object.keys(updateFields).length > 0) {
          const { error } = await supabase.from("trade_log")
            .update(updateFields)
            .eq("id", best.id);
          if (!error) matched++;
          else console.warn("trade_log update:", error.message);
        }
      }
    }
    counts.trade_evaluations = matched;
  }

  await Promise.all(promises);

  const parts = Object.entries(counts).map(([k, v]) => `${v} ${k.replace("_", " ")}`);
  const message = `Journal sync complete: ${parts.join(", ")}. ${parsed.notes}`;

  return NextResponse.json({
    synced: counts,
    confidence: parsed.confidence,
    message,
  });
}
