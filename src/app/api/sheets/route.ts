import { NextResponse } from "next/server";
import { fetchSheetRows, findHeaderRow } from "@/lib/sheets";

/**
 * GET /api/sheets?spreadsheetId=...&range=...
 *
 * Fetches data from a Google Sheet and returns rows + detected headers.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const spreadsheetId = searchParams.get("spreadsheetId");
  const range = searchParams.get("range") || "Sheet1";

  if (!spreadsheetId) {
    return NextResponse.json(
      { error: "Missing spreadsheetId parameter" },
      { status: 400 },
    );
  }

  try {
    const rows = await fetchSheetRows(spreadsheetId, range);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Sheet is empty or inaccessible" },
        { status: 400 },
      );
    }

    // Auto-detect the header row
    const { headerIdx, headers } = findHeaderRow(rows);

    return NextResponse.json({
      rows,
      headerIdx,
      headers,
      count: rows.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 },
    );
  }
}
