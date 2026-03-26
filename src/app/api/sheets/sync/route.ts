import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchSheetRows } from "@/lib/sheets";
import { parseSheetWithAI } from "@/lib/ai-sheet-parser";

/**
 * POST /api/sheets/sync
 * Body: { spreadsheetId, range? }
 *
 * Fetches a Google Sheet, uses Claude AI to intelligently parse trades
 * regardless of format, and inserts into Supabase.
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
  const { spreadsheetId, range } = body as {
    spreadsheetId: string;
    range?: string;
  };

  if (!spreadsheetId) {
    return NextResponse.json(
      { error: "Missing spreadsheetId" },
      { status: 400 },
    );
  }

  try {
    // 1. Fetch raw sheet data
    const rows = await fetchSheetRows(spreadsheetId, range || "Sheet1");

    if (rows.length < 2) {
      return NextResponse.json(
        { error: "Sheet has no data rows" },
        { status: 400 },
      );
    }

    // 2. Use Claude to parse the messy spreadsheet into clean trades
    const parsed = await parseSheetWithAI(rows);

    if (parsed.trades.length === 0) {
      return NextResponse.json({
        synced: 0,
        confidence: parsed.confidence,
        message:
          "No trades could be extracted. " + (parsed.notes || "Check that the sheet contains trade data."),
      });
    }

    // 3. Insert into Supabase
    const tradesToInsert = parsed.trades.map((t) => ({
      user_id: user.id,
      ...t,
    }));

    const { error: dbError } = await supabase
      .from("trade_log")
      .insert(tradesToInsert);

    if (dbError) {
      // Duplicate key is OK — some trades may already exist
      if (
        dbError.message.includes("duplicate") ||
        dbError.code === "23505"
      ) {
        return NextResponse.json({
          synced: parsed.trades.length,
          confidence: parsed.confidence,
          message: `Found ${parsed.trades.length} trades (some may already exist). ${parsed.notes}`,
        });
      }
      throw new Error(dbError.message);
    }

    return NextResponse.json({
      synced: parsed.trades.length,
      confidence: parsed.confidence,
      message: `Synced ${parsed.trades.length} trades. ${parsed.notes}`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    if (msg.includes("ANTHROPIC_API_KEY")) {
      return NextResponse.json(
        {
          error:
            "AI parsing requires an Anthropic API key. Add ANTHROPIC_API_KEY to your environment variables.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Sync failed", details: msg },
      { status: 500 },
    );
  }
}
