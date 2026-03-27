import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseProfileWithAI } from "@/lib/ai-profile-parser";

export const maxDuration = 300;

/**
 * POST /api/profile
 * Body: { text: string } — raw CSV/pasted text of the trader profile
 *
 * Parses the profile with AI and updates the trader_profiles table.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { text } = body as { text: string };

  if (!text || text.trim().length < 50) {
    return NextResponse.json(
      { error: "Please provide the trader profile text (CSV or pasted content)" },
      { status: 400 },
    );
  }

  try {
    const parsed = await parseProfileWithAI(text);

    // Update the profile
    const { error: dbError } = await supabase
      .from("trader_profiles")
      .update({
        full_name: parsed.full_name || undefined,
        avatar_initial: parsed.full_name ? parsed.full_name.charAt(0).toUpperCase() : undefined,
        detailed_weaknesses: parsed.detailed_weaknesses,
        detailed_strengths: parsed.detailed_strengths,
        successes: parsed.successes,
        fears: parsed.fears,
        hobbies: parsed.hobbies,
        expectations: parsed.expectations,
        experience: parsed.experience,
        trader_type: parsed.trader_type,
        availability: parsed.availability,
        responsibilities: parsed.responsibilities,
      })
      .eq("id", user.id);

    if (dbError) {
      console.warn("Profile update error:", dbError.message);
    }

    return NextResponse.json({
      success: true,
      confidence: parsed.confidence,
      message: `Extracted ${parsed.detailed_weaknesses.length} weaknesses, ${parsed.detailed_strengths.length} strengths, ${parsed.successes.length} successes, ${parsed.fears.length} fears. ${parsed.notes}`,
      data: {
        weaknesses: parsed.detailed_weaknesses.length,
        strengths: parsed.detailed_strengths.length,
        successes: parsed.successes.length,
        fears: parsed.fears.length,
        hobbies: parsed.hobbies.length,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("ANTHROPIC_API_KEY")) {
      return NextResponse.json(
        { error: "AI parsing requires an Anthropic API key." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Parse failed", details: msg }, { status: 500 });
  }
}
