import { NextResponse } from "next/server";

/**
 * GET /api/sheets?spreadsheetId=...&range=...
 *
 * Fetches data from a public Google Sheet (or one shared via link)
 * using the Google Sheets API v4 with an API key.
 *
 * If no API key is configured, falls back to the Sheets CSV export URL
 * which works for any sheet with "Anyone with the link" access.
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

  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

  try {
    let rows: string[][];

    if (apiKey) {
      // Use official Sheets API v4
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;
      const res = await fetch(url, { next: { revalidate: 0 } });

      if (!res.ok) {
        const body = await res.text();
        return NextResponse.json(
          { error: `Google Sheets API error: ${res.status}`, details: body },
          { status: res.status },
        );
      }

      const json = await res.json();
      rows = json.values || [];
    } else {
      // Fallback: CSV export (works for public/link-shared sheets)
      const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(range)}`;
      const res = await fetch(csvUrl, { next: { revalidate: 0 } });

      if (!res.ok) {
        return NextResponse.json(
          {
            error: "Failed to fetch sheet. Make sure the sheet is shared with 'Anyone with the link'.",
          },
          { status: 400 },
        );
      }

      const csv = await res.text();
      rows = parseCsv(csv);
    }

    return NextResponse.json({ rows, count: rows.length });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch Google Sheet", details: String(err) },
      { status: 500 },
    );
  }
}

/** Simple CSV parser that handles quoted fields. */
function parseCsv(csv: string): string[][] {
  const lines: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    const next = csv[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        current.push(field.trim());
        field = "";
      } else if (ch === "\n" || (ch === "\r" && next === "\n")) {
        current.push(field.trim());
        field = "";
        if (current.some((c) => c !== "")) lines.push(current);
        current = [];
        if (ch === "\r") i++;
      } else {
        field += ch;
      }
    }
  }

  // Last field/line
  current.push(field.trim());
  if (current.some((c) => c !== "")) lines.push(current);

  return lines;
}
