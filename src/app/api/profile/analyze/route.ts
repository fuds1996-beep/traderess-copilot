import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 300;

/**
 * POST /api/profile/analyze
 * Analyzes the student's recent trading data and journals,
 * then updates their trader profile with AI-generated scores.
 * Returns both the old and new scores for comparison.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 400 });

  try {
    // 1. Fetch current profile
    const { data: profile } = await supabase
      .from("trader_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) return NextResponse.json({ error: "No profile found" }, { status: 404 });

    // 2. Fetch last 4 weeks of trades
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const since = fourWeeksAgo.toISOString().split("T")[0];

    const { data: trades } = await supabase
      .from("trade_log")
      .select("trade_date,account_name,pair,session,direction,result,overall_pips,rs_gained,dollar_result,percent_risked,trade_evaluation,day")
      .eq("user_id", user.id)
      .gte("trade_date", since)
      .order("trade_date");

    // 3. Fetch last 4 weeks of journals
    const { data: journals } = await supabase
      .from("daily_journals")
      .select("journal_date,day_of_week,market_mood,emotion_before,emotion_during,emotion_after,effort_rating,journal_text,pips_overall")
      .eq("user_id", user.id)
      .gte("journal_date", since)
      .order("journal_date");

    // 4. Build trade summary for the AI
    const tradeList = (trades || []).map((t) =>
      `${t.trade_date} | ${t.account_name} | ${t.session} | ${t.direction} | ${t.result} | ${t.overall_pips}p | ${t.rs_gained}R | ${t.dollar_result} | ${t.percent_risked} | ${(t.trade_evaluation || "").slice(0, 200)}`
    ).join("\n");

    const journalList = (journals || []).map((j) =>
      `${j.journal_date} ${j.day_of_week} | Mood: ${j.market_mood} | Before: ${j.emotion_before} | During: ${j.emotion_during} | After: ${j.emotion_after} | Effort: ${j.effort_rating}/5 | Pips: ${j.pips_overall} | ${(j.journal_text || "").slice(0, 300)}`
    ).join("\n");

    // Save old scores for comparison
    const oldScores = {
      strengths: profile.strengths || [],
      weaknesses: profile.weaknesses || [],
      radar_scores: profile.radar_scores || [],
      space_method: profile.space_method || [],
      behavioural_patterns: profile.behavioural_patterns || [],
    };

    // 5. Ask Claude to analyze and generate new scores
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: `You are a trading psychology expert analyzing a student's recent performance to update their trader profile.

STUDENT: ${profile.full_name || "Unknown"}
TRADING STYLE: ${profile.bio || "N/A"}
PRIMARY PAIR: ${profile.primary_pair || "EUR/USD"}
SESSION: ${profile.session_focus || "London"}

CURRENT STRENGTHS (from self-assessment):
${JSON.stringify(profile.detailed_strengths?.map((s: { name: string }) => s.name) || profile.strengths?.map((s: { label: string }) => s.label) || [])}

CURRENT WEAKNESSES (from self-assessment):
${JSON.stringify(profile.detailed_weaknesses?.map((w: { name: string }) => w.name) || profile.weaknesses?.map((w: { label: string }) => w.label) || [])}

LAST 4 WEEKS OF TRADES (${(trades || []).length} total):
${tradeList || "No trades in this period"}

LAST 4 WEEKS OF JOURNAL ENTRIES (${(journals || []).length} total):
${journalList || "No journal entries in this period"}

Based on this ACTUAL data, generate updated profile scores. Base everything on EVIDENCE from the trades and journals, not generic assessments.

Return ONLY valid JSON:
{
  "strengths": [
    {"label": "description of strength based on evidence", "score": 0-100}
  ],
  "weaknesses": [
    {"label": "description of weakness based on evidence", "score": 0-100}
  ],
  "radar_scores": [
    {"trait": "Patience", "value": 0-100, "fullMark": 100},
    {"trait": "Discipline", "value": 0-100, "fullMark": 100},
    {"trait": "Risk Mgmt", "value": 0-100, "fullMark": 100},
    {"trait": "Fundamentals", "value": 0-100, "fullMark": 100},
    {"trait": "Technical", "value": 0-100, "fullMark": 100},
    {"trait": "Psychology", "value": 0-100, "fullMark": 100}
  ],
  "space_method": [
    {"letter": "S", "word": "Sleep", "status": "good"|"warning", "note": "evidence-based observation"},
    {"letter": "P", "word": "Psychology", "status": "good"|"warning", "note": "..."},
    {"letter": "A", "word": "Activity", "status": "good"|"warning", "note": "..."},
    {"letter": "C", "word": "Consumption", "status": "good"|"warning", "note": "..."},
    {"letter": "E", "word": "Environment", "status": "good"|"warning", "note": "..."}
  ],
  "behavioural_patterns": [
    {"pattern": "name", "frequency": "X times in Y weeks", "trigger": "what causes it", "severity": "high"|"medium"}
  ],
  "summary": "2-3 sentence summary of the analysis"
}

SCORING GUIDELINES:
- Patience: based on journal mentions of waiting, not rushing, vs impulsive entries
- Discipline: based on following the plan, not overtrading, sticking to rules
- Risk Mgmt: based on percent_risked consistency, drawdown patterns
- Fundamentals: based on fundamental_check frequency, market mood awareness
- Technical: based on win rate, setup quality, confirmation usage
- Psychology: based on emotion patterns, recovery from losses, self-awareness

- Strengths should be things the student is ACTUALLY doing well (not aspirational)
- Weaknesses should be specific patterns visible in the data
- SPACE method: infer from journal emotions and trading patterns
- Behavioural patterns: look for recurring mistakes or positive habits`,
      }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "AI analysis failed to produce results" }, { status: 500 });

    const newScores = JSON.parse(jsonMatch[0]);

    // 6. Update profile
    await supabase.from("trader_profiles").update({
      strengths: newScores.strengths || [],
      weaknesses: newScores.weaknesses || [],
      radar_scores: newScores.radar_scores || [],
      space_method: newScores.space_method || [],
      behavioural_patterns: newScores.behavioural_patterns || [],
    }).eq("id", user.id);

    return NextResponse.json({
      success: true,
      summary: newScores.summary || "",
      old: oldScores,
      new: {
        strengths: newScores.strengths,
        weaknesses: newScores.weaknesses,
        radar_scores: newScores.radar_scores,
        space_method: newScores.space_method,
        behavioural_patterns: newScores.behavioural_patterns,
      },
      tradeCount: (trades || []).length,
      journalCount: (journals || []).length,
    });
  } catch (err) {
    return NextResponse.json({ error: "Analysis failed", details: String(err) }, { status: 500 });
  }
}
