import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 300;

/**
 * POST /api/briefing/generate
 * Body: { weekStart: string } — Monday of the week to generate for
 *
 * Generates a comprehensive weekly briefing from the student's trade
 * and journal data using Claude AI, then saves to weekly_briefings.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 400 });

  const body = await request.json();
  const { weekStart } = body as { weekStart: string };
  if (!weekStart) return NextResponse.json({ error: "Missing weekStart" }, { status: 400 });

  // Compute week end (Sunday)
  const wsDate = new Date(weekStart);
  const weDate = new Date(wsDate);
  weDate.setDate(weDate.getDate() + 6);
  const weekEnd = weDate.toISOString().split("T")[0];

  try {
    // 1. Fetch student's profile
    const { data: profile } = await supabase
      .from("trader_profiles")
      .select("full_name, bio, primary_pair, session_focus, risk_model, strengths, weaknesses, detailed_weaknesses, detailed_strengths")
      .eq("id", user.id)
      .single();

    // 2. Fetch trades for the week
    const { data: trades } = await supabase
      .from("trade_log")
      .select("trade_date, account_name, pair, session, direction, result, overall_pips, rs_gained, dollar_result, percent_risked, entry_conf_1, entry_conf_2, trade_evaluation, day")
      .eq("user_id", user.id)
      .gte("trade_date", weekStart)
      .lte("trade_date", weekEnd)
      .order("trade_date");

    // 3. Fetch journals for the week
    const { data: journals } = await supabase
      .from("daily_journals")
      .select("journal_date, day_of_week, market_mood, emotion_before, emotion_during, emotion_after, effort_rating, journal_text, pips_overall, rs_total")
      .eq("user_id", user.id)
      .gte("journal_date", weekStart)
      .lte("journal_date", weekEnd)
      .order("journal_date");

    // 4. Fetch previous week's briefing for continuity
    const prevWeekStart = new Date(wsDate);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const { data: prevBriefing } = await supabase
      .from("weekly_briefings")
      .select("what_went_well, watch_out_for, motivational_quote")
      .eq("user_id", user.id)
      .eq("week_start", prevWeekStart.toISOString().split("T")[0])
      .single();

    // Build summaries
    const tradesSummary = (trades || []).map((t) =>
      `${t.trade_date} | ${t.account_name} | ${t.session} | ${t.direction} | ${t.result} | ${t.overall_pips}p | ${t.rs_gained}R | ${t.dollar_result} | ${t.percent_risked} | Conf: ${t.entry_conf_1}, ${t.entry_conf_2} | ${(t.trade_evaluation || "").slice(0, 200)}`
    ).join("\n");

    const journalsSummary = (journals || []).map((j) =>
      `${j.journal_date} ${j.day_of_week} | Mood: ${j.market_mood} | Emotions: ${j.emotion_before}→${j.emotion_during}→${j.emotion_after} | Effort: ${j.effort_rating}/5 | Pips: ${j.pips_overall} | ${(j.journal_text || "").slice(0, 300)}`
    ).join("\n");

    const tradeCount = (trades || []).length;
    const wins = (trades || []).filter((t) => t.result === "Win").length;
    const losses = (trades || []).filter((t) => t.result === "Loss").length;
    const totalPips = (trades || []).reduce((s, t) => s + (t.overall_pips || 0), 0);
    const totalRs = (trades || []).reduce((s, t) => s + (t.rs_gained || 0), 0);
    const winRate = tradeCount > 0 ? Math.round((wins / tradeCount) * 100) : 0;
    const totalDollars = (trades || []).reduce((s, t) => {
      const v = parseFloat((t.dollar_result || "").replace(/[^0-9.\-]/g, ""));
      return s + (isNaN(v) ? 0 : v);
    }, 0);

    // 5. Generate briefing with Claude
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      messages: [{
        role: "user",
        content: `You are a trading coach preparing a weekly briefing for a student trader.

STUDENT: ${profile?.full_name || "Trader"}
STYLE: ${profile?.bio || "N/A"}
PRIMARY PAIR: ${profile?.primary_pair || "EUR/USD"}
SESSION: ${profile?.session_focus || "London"}

KNOWN WEAKNESSES: ${JSON.stringify(profile?.detailed_weaknesses?.map((w: { name: string }) => w.name) || profile?.weaknesses?.map((w: { label: string }) => w.label) || [])}
KNOWN STRENGTHS: ${JSON.stringify(profile?.detailed_strengths?.map((s: { name: string }) => s.name) || profile?.strengths?.map((s: { label: string }) => s.label) || [])}

WEEK: ${weekStart} to ${weekEnd}
TRADES THIS WEEK (${tradeCount} total, ${wins}W/${losses}L, ${winRate}% WR, ${totalPips}p, ${Math.round(totalRs * 100) / 100}R, $${Math.round(totalDollars)}):
${tradesSummary || "No trades taken this week"}

JOURNALS THIS WEEK:
${journalsSummary || "No journal entries this week"}

${prevBriefing ? `PREVIOUS WEEK'S BRIEFING:
What went well: ${prevBriefing.what_went_well}
Watch out for: ${prevBriefing.watch_out_for}` : "No previous briefing available."}

Generate a comprehensive weekly briefing. Return ONLY valid JSON:
{
  "week_label": "Mar 23–27, 2026",
  "review_stats": [
    {"value": "${winRate}%", "label": "Win Rate", "color": "text-emerald-400"},
    {"value": "${tradeCount}", "label": "Trades Taken", "color": "text-gray-900"},
    {"value": "${totalPips > 0 ? '+' : ''}$${Math.round(totalDollars)}", "label": "Net P/L", "color": "${totalDollars >= 0 ? 'text-emerald-400' : 'text-red-400'}"},
    {"value": "${totalRs > 0 ? '+' : ''}${Math.round(totalRs * 100) / 100}R", "label": "R-Value", "color": "${totalRs >= 0 ? 'text-brand' : 'text-red-400'}"}
  ],
  "what_went_well": "2-4 sentences about what the student did well this week based on ACTUAL trades and journals. Reference specific trades and decisions. Be genuine, not generic.",
  "watch_out_for": "2-4 sentences about patterns to watch, based on ACTUAL journal emotions and trade mistakes. Reference the student's known weaknesses if they appeared this week.",
  "articles_eurusd": [],
  "articles_dxy": [],
  "eurusd_bias": "neutral",
  "dxy_bias": "neutral",
  "key_insight": "One key insight from this week's trading data — what pattern stands out most?",
  "calendar_events": [],
  "daily_risk_ratings": [
    {"day": "Mon", "risk": "low", "note": "Personalized advice for next Monday based on this week's patterns", "color": "bg-emerald-50/60 border-emerald-200/30"},
    {"day": "Tue", "risk": "medium", "note": "...", "color": "bg-amber-50/60 border-amber-200/30"},
    {"day": "Wed", "risk": "medium", "note": "...", "color": "bg-amber-50/60 border-amber-200/30"},
    {"day": "Thu", "risk": "low", "note": "...", "color": "bg-emerald-50/60 border-emerald-200/30"},
    {"day": "Fri", "risk": "low", "note": "...", "color": "bg-emerald-50/60 border-emerald-200/30"}
  ],
  "no_trade_zones": "Specific situations this student should NOT trade in next week, based on their patterns (reference their actual weaknesses and journal entries).",
  "motivational_quote": "A personalized motivational message for this specific student. Reference their progress, name specific improvements, acknowledge struggles. 2-3 sentences.",
  "pre_session_checklist": [
    "Personalized checklist item based on their weaknesses",
    "Another based on patterns seen this week",
    "Check economic calendar",
    "Mark session highs and lows",
    "Confirm risk rules before entry",
    "Full confirmation stack required",
    "SL set before entry — no exceptions",
    "One more personalized to their specific situation"
  ]
}

IMPORTANT:
- what_went_well and watch_out_for must reference ACTUAL trades and journal entries, not generic advice
- motivational_quote should be deeply personal to this student
- daily_risk_ratings should reflect the student's actual trading patterns (e.g. if they always lose on Wednesdays, rate Wed as high risk)
- no_trade_zones should name specific situations from their data
- pre_session_checklist should include items targeting their specific weaknesses
- If no trades were taken, focus the briefing on the journal entries and preparation quality`,
      }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "AI failed to generate briefing" }, { status: 500 });

    const briefing = JSON.parse(jsonMatch[0]);

    // 6. Save to weekly_briefings
    const { error: dbError } = await supabase.from("weekly_briefings").upsert({
      user_id: user.id,
      week_start: weekStart,
      week_label: briefing.week_label || `Week of ${weekStart}`,
      review_stats: briefing.review_stats || [],
      what_went_well: briefing.what_went_well || "",
      watch_out_for: briefing.watch_out_for || "",
      articles_eurusd: briefing.articles_eurusd || [],
      articles_dxy: briefing.articles_dxy || [],
      eurusd_bias: briefing.eurusd_bias || "neutral",
      dxy_bias: briefing.dxy_bias || "neutral",
      key_insight: briefing.key_insight || "",
      calendar_events: briefing.calendar_events || [],
      daily_risk_ratings: briefing.daily_risk_ratings || [],
      no_trade_zones: briefing.no_trade_zones || "",
      motivational_quote: briefing.motivational_quote || "",
      pre_session_checklist: briefing.pre_session_checklist || [],
    }, { onConflict: "user_id,week_start" });

    if (dbError) console.warn("Briefing save error:", dbError.message);

    return NextResponse.json({
      success: true,
      briefing,
      stats: { tradeCount, wins, losses, winRate, totalPips, totalRs: Math.round(totalRs * 100) / 100 },
    });
  } catch (err) {
    return NextResponse.json({ error: "Briefing generation failed", details: String(err) }, { status: 500 });
  }
}
