import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/sheets/sync
 * Body: { spreadsheetId, range?, sheetType: "trades" | "performance" }
 *
 * Fetches data from the connected Google Sheet via /api/sheets,
 * parses rows into the correct table format, and upserts into Supabase.
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
  const { spreadsheetId, range, sheetType } = body as {
    spreadsheetId: string;
    range?: string;
    sheetType: "trades" | "performance";
  };

  if (!spreadsheetId || !sheetType) {
    return NextResponse.json(
      { error: "Missing spreadsheetId or sheetType" },
      { status: 400 },
    );
  }

  // Fetch sheet data via our own API route
  const origin = request.headers.get("origin") || request.headers.get("host") || "";
  const protocol = origin.startsWith("localhost") ? "http" : "https";
  const base = origin.startsWith("http") ? origin : `${protocol}://${origin}`;
  const sheetUrl = `${base}/api/sheets?spreadsheetId=${spreadsheetId}&range=${encodeURIComponent(range || "Sheet1")}`;

  const sheetRes = await fetch(sheetUrl);
  if (!sheetRes.ok) {
    const err = await sheetRes.json();
    return NextResponse.json(
      { error: "Failed to fetch sheet", details: err },
      { status: 400 },
    );
  }

  const { rows } = (await sheetRes.json()) as { rows: string[][] };

  if (!rows || rows.length < 2) {
    return NextResponse.json(
      { error: "Sheet has no data rows (need header + at least 1 row)" },
      { status: 400 },
    );
  }

  const headers = rows[0].map((h) => h.toLowerCase().trim());
  const dataRows = rows.slice(1);

  try {
    if (sheetType === "trades") {
      const result = await syncTrades(supabase, user.id, headers, dataRows);
      return NextResponse.json(result);
    } else {
      const result = await syncPerformance(supabase, user.id, headers, dataRows);
      return NextResponse.json(result);
    }
  } catch (err) {
    return NextResponse.json(
      { error: "Sync failed", details: String(err) },
      { status: 500 },
    );
  }
}

/**
 * Finds the index of a header, trying multiple aliases.
 */
function col(headers: string[], ...aliases: string[]): number {
  for (const alias of aliases) {
    const idx = headers.findIndex((h) => h.includes(alias));
    if (idx >= 0) return idx;
  }
  return -1;
}

function cellStr(row: string[], idx: number): string {
  return idx >= 0 && idx < row.length ? row[idx].trim() : "";
}

function cellNum(row: string[], idx: number): number {
  const raw = cellStr(row, idx).replace(/[^0-9.\-]/g, "");
  return parseFloat(raw) || 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncTrades(supabase: any, userId: string, headers: string[], rows: string[][]) {
  const iDate = col(headers, "date");
  const iPair = col(headers, "pair", "symbol", "instrument");
  const iDir = col(headers, "dir", "direction", "side", "type");
  const iEntry = col(headers, "entry", "open", "entry price");
  const iSl = col(headers, "sl", "stop", "stop loss");
  const iTp = col(headers, "tp", "take profit", "target");
  const iResult = col(headers, "result", "outcome", "win/loss");
  const iPips = col(headers, "pips", "pip");
  const iRr = col(headers, "r:r", "rr", "risk reward", "r/r");
  const iSession = col(headers, "session");
  const iNotes = col(headers, "notes", "note", "comment");

  const trades = rows
    .filter((r) => cellStr(r, iDate) !== "")
    .map((r) => {
      const dirRaw = cellStr(r, iDir).toLowerCase();
      const direction = dirRaw.includes("short") || dirRaw === "sell" || dirRaw === "s" ? "Short" : "Long";

      const resultRaw = cellStr(r, iResult).toLowerCase();
      const result = resultRaw.includes("loss") || resultRaw === "l"
        ? "Loss"
        : resultRaw.includes("be") || resultRaw.includes("break")
          ? "BE"
          : "Win";

      return {
        user_id: userId,
        trade_date: parseDate(cellStr(r, iDate)),
        pair: cellStr(r, iPair) || "EUR/USD",
        direction,
        entry_price: cellNum(r, iEntry),
        sl_price: cellNum(r, iSl),
        tp_price: cellNum(r, iTp),
        result,
        pips: cellNum(r, iPips),
        risk_reward: cellStr(r, iRr) || "0:0",
        session: cellStr(r, iSession) || "London",
        notes: cellStr(r, iNotes),
      };
    });

  if (trades.length === 0) {
    return { synced: 0, message: "No valid trade rows found" };
  }

  const { error } = await supabase.from("trade_log").upsert(trades, {
    onConflict: "user_id,trade_date,pair,entry_price",
    ignoreDuplicates: true,
  });

  if (error) {
    // Upsert may fail on conflict config — fall back to insert
    const { error: insertErr } = await supabase.from("trade_log").insert(trades);
    if (insertErr) throw new Error(insertErr.message);
  }

  return { synced: trades.length, message: `Synced ${trades.length} trades` };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncPerformance(supabase: any, userId: string, headers: string[], rows: string[][]) {
  const iWeek = col(headers, "week");
  const iPnl = col(headers, "pnl", "p/l", "profit");
  const iTrades = col(headers, "trades", "total trades", "# trades");
  const iWr = col(headers, "win rate", "wr", "win%", "winrate");
  const iR = col(headers, "r value", "r-value", "rvalue", "r");

  const weeks = rows
    .filter((r) => cellStr(r, iWeek) !== "")
    .map((r) => {
      const weekLabel = cellStr(r, iWeek);
      return {
        user_id: userId,
        week_label: weekLabel,
        week_start: parseDate(weekLabel.split(/[-–]/)[0]?.trim() || weekLabel),
        week_end: parseDate(weekLabel.split(/[-–]/)[1]?.trim() || weekLabel),
        pnl: cellNum(r, iPnl),
        trades: Math.round(cellNum(r, iTrades)),
        win_rate: cellNum(r, iWr),
        r_value: cellNum(r, iR),
        wins: 0,
        losses: 0,
        breakeven: 0,
        session_data: [],
        day_data: [],
      };
    });

  if (weeks.length === 0) {
    return { synced: 0, message: "No valid performance rows found" };
  }

  // Insert (skip duplicates via unique constraint)
  const { error } = await supabase.from("trading_performance").insert(weeks);
  if (error && !error.message.includes("duplicate")) {
    throw new Error(error.message);
  }

  return { synced: weeks.length, message: `Synced ${weeks.length} weeks` };
}

/** Best-effort date parser — handles "Mar 10", "2026-03-10", "10/03/2026", etc. */
function parseDate(raw: string): string {
  if (!raw) return new Date().toISOString().split("T")[0];

  // ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);

  // Try native Date
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];

  // Fallback
  return new Date().toISOString().split("T")[0];
}
