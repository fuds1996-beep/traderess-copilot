import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchSheetRows,
  findHeaderRow,
  col,
  cellStr,
  cellNum,
  parseDate,
  isTradeRow,
} from "@/lib/sheets";

/**
 * POST /api/sheets/sync
 * Body: { spreadsheetId, range?, sheetType: "trades" | "performance" }
 *
 * Fetches a Google Sheet, auto-detects headers, parses trade/performance
 * rows, and inserts into Supabase.
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

  try {
    const rows = await fetchSheetRows(spreadsheetId, range || "Sheet1");

    if (rows.length < 2) {
      return NextResponse.json(
        { error: "Sheet has no data rows" },
        { status: 400 },
      );
    }

    // Auto-detect the header row
    const { headerIdx, headers } = findHeaderRow(rows);
    const dataRows = rows.slice(headerIdx + 1);

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncTrades(supabase: any, userId: string, headers: string[], rows: string[][]) {
  // Map columns with wide aliases to handle various spreadsheet formats
  const iDate = col(headers, "date", "day");
  const iPair = col(headers, "major pair", "pair", "symbol", "instrument");
  const iDir = col(headers, "direction", "dir", "side", "type");
  const iEntry = col(headers, "entry", "open", "entry price", "entry strategy");
  const iSl = col(headers, "sl", "sl strategy", "stop loss", "stop");
  const iTp = col(headers, "tp", "tp strategy", "tp rate", "take profit", "target");
  const iResult = col(headers, "outcome", "result", "win/loss");
  const iPips = col(headers, "pips", "pip");
  const iRr = col(headers, "r2r", "r:r", "rr", "risk reward", "r/r", "r2r of trade");
  const iSession = col(headers, "session");
  const iNotes = col(headers, "trade evaluation", "notes", "note", "comment", "summary");
  const iScenario = col(headers, "scenario");
  const iRsGained = col(headers, "r's gained", "rs gained", "r gained");

  const trades = rows
    .filter((r) => isTradeRow(r, iDate, iEntry))
    .map((r) => {
      // Direction: check direction column, or infer from scenario
      let dirRaw = cellStr(r, iDir).toLowerCase();
      if (!dirRaw && iScenario >= 0) {
        dirRaw = cellStr(r, iScenario).toLowerCase();
      }
      const direction =
        dirRaw.includes("short") || dirRaw === "sell" || dirRaw === "s"
          ? "Short"
          : "Long";

      // Result
      const resultRaw = cellStr(r, iResult).toLowerCase();
      const result =
        resultRaw.includes("loss") || resultRaw === "l" || resultRaw === "sl"
          ? "Loss"
          : resultRaw.includes("be") || resultRaw.includes("break")
            ? "BE"
            : "Win";

      // Pips — try pips column, fall back to R's gained
      let pips = cellNum(r, iPips);
      if (pips === 0 && iRsGained >= 0) {
        pips = cellNum(r, iRsGained) * 10; // rough estimate
      }

      // R:R
      let rr = cellStr(r, iRr);
      if (!rr && iRsGained >= 0) {
        const rVal = cellNum(r, iRsGained);
        rr = rVal !== 0 ? `${Math.abs(rVal)}:1` : "0:0";
      }

      return {
        user_id: userId,
        trade_date: parseDate(cellStr(r, iDate)),
        pair: cellStr(r, iPair) || "EUR/USD",
        direction,
        entry_price: cellNum(r, iEntry),
        sl_price: cellNum(r, iSl),
        tp_price: cellNum(r, iTp),
        result,
        pips,
        risk_reward: rr || "0:0",
        session: cellStr(r, iSession) || "London",
        notes: cellStr(r, iNotes).slice(0, 500),
      };
    })
    // Filter out rows with no entry price (section headers, empty rows)
    .filter((t) => t.entry_price > 0);

  if (trades.length === 0) {
    return {
      synced: 0,
      message: "No valid trade rows found. Check that your sheet has Date and Entry price columns.",
    };
  }

  // Insert trades, skipping any that conflict
  const { error } = await supabase.from("trade_log").insert(trades);
  if (error) {
    // If duplicate key error, that's OK — some trades already exist
    if (error.message.includes("duplicate") || error.code === "23505") {
      return {
        synced: trades.length,
        message: `Found ${trades.length} trades (some may already exist)`,
      };
    }
    throw new Error(error.message);
  }

  return { synced: trades.length, message: `Synced ${trades.length} trades` };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncPerformance(supabase: any, userId: string, headers: string[], rows: string[][]) {
  const iWeek = col(headers, "week");
  const iPnl = col(headers, "pnl", "p/l", "profit", "weekly result");
  const iTrades = col(headers, "trades", "total trades", "# trades", "trades taken");
  const iWr = col(headers, "win rate", "wr", "win%", "winrate");
  const iR = col(headers, "r value", "r-value", "rvalue", "overall r", "r");

  const weeks = rows
    .filter((r) => {
      const weekVal = cellStr(r, iWeek);
      return weekVal !== "" && !weekVal.toLowerCase().includes("week") && weekVal.length > 2;
    })
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

  const { error } = await supabase.from("trading_performance").insert(weeks);
  if (error && !error.message.includes("duplicate") && error.code !== "23505") {
    throw new Error(error.message);
  }

  return { synced: weeks.length, message: `Synced ${weeks.length} weeks` };
}
