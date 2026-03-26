import Anthropic from "@anthropic-ai/sdk";
import type {
  ProfileWeakness,
  ProfileStrength,
  ProfileSuccess,
  ProfileFear,
} from "./types";

export interface ParsedProfile {
  full_name: string;
  detailed_weaknesses: ProfileWeakness[];
  detailed_strengths: ProfileStrength[];
  successes: ProfileSuccess[];
  fears: ProfileFear[];
  hobbies: string[];
  expectations: string[];
  experience: Record<string, string>;
  trader_type: string;
  availability: { slot1: string; slot2: string; slot3: string };
  responsibilities: string;
  confidence: "high" | "medium" | "low";
  notes: string;
}

export async function parseProfileWithAI(text: string): Promise<ParsedProfile> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 16384,
    messages: [
      {
        role: "user",
        content: `You are a trading psychology data extraction expert. Below is raw CSV/text data from a trader's personal profile document. Extract ALL of the following:

## 1. DETAILED_WEAKNESSES (array)
Each weakness has:
- name: the weakness title (e.g. "Perfectionism")
- real_life_example: full text of the real-life situation
- affects_learning: full text of how it affects learning to trade
- affects_planning: full text of how it affects planning
- affects_execution: full text of how it affects execution
- affects_results: full text of how it affects results
- affects_evaluation: full text of how it affects evaluation
PRESERVE THE FULL TEXT of each field — never summarize.

## 2. DETAILED_STRENGTHS (array)
Same structure as weaknesses:
- name, real_life_example, affects_learning, affects_planning, affects_execution, affects_results, affects_evaluation
PRESERVE THE FULL TEXT.

## 3. SUCCESSES (array)
- title: what was the success
- description: full description
- how_benefited: full text of how it benefited them
- how_achieved: full text of how they achieved it
- time_taken: how long it took

## 4. FEARS (array)
- title: the fear
- description: how it affected them (full text)
- how_affected: same as description if not separate
- how_overcome: full text of how they overcame it (or empty)
- plan_to_overcome: how they plan to overcome it (or empty)

## 5. HOBBIES (string array)
List of hobbies/interests mentioned.

## 6. EXPECTATIONS (string array)
What they expect from the course / their goals.

## 7. EXPERIENCE (object)
Key-value pairs of their trading experience, e.g.:
- "attended_other_course": "yes/no"
- "babypips_completed": "yes/no"
- "understands_forex": "yes/no"
- "knows_mt4": "yes/no"
- "knows_tradingview": "yes/no"
- "knows_support_resistance": "yes/no"
- "kept_trading_journal": "yes/no"
- "kept_diary": "yes/no"
- "employment": "fulltime/parttime/etc"
etc.

## 8. TRADER_TYPE (string)
What type of trader they want to be — preserve full text.

## 9. AVAILABILITY (object)
- slot1, slot2, slot3: their time slots

## 10. RESPONSIBILITIES (string)
Level of responsibility at home — preserve full text.

## 11. FULL_NAME (string)
Extract from filename or any mention in the data.

Respond with ONLY valid JSON:
{
  "full_name": "...",
  "detailed_weaknesses": [...],
  "detailed_strengths": [...],
  "successes": [...],
  "fears": [...],
  "hobbies": [...],
  "expectations": [...],
  "experience": {...},
  "trader_type": "...",
  "availability": {"slot1":"","slot2":"","slot3":""},
  "responsibilities": "...",
  "confidence": "high"|"medium"|"low",
  "notes": "..."
}

Here is the profile data:

${text}`,
      },
    ],
  });

  const responseText =
    response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI could not parse the profile data");

  const parsed = JSON.parse(jsonMatch[0]) as ParsedProfile;

  // Clean arrays
  parsed.detailed_weaknesses = (parsed.detailed_weaknesses || []).map((w) => ({
    name: w.name || "",
    real_life_example: w.real_life_example || "",
    affects_learning: w.affects_learning || "",
    affects_planning: w.affects_planning || "",
    affects_execution: w.affects_execution || "",
    affects_results: w.affects_results || "",
    affects_evaluation: w.affects_evaluation || "",
  }));

  parsed.detailed_strengths = (parsed.detailed_strengths || []).map((s) => ({
    name: s.name || "",
    real_life_example: s.real_life_example || "",
    affects_learning: s.affects_learning || "",
    affects_planning: s.affects_planning || "",
    affects_execution: s.affects_execution || "",
    affects_results: s.affects_results || "",
    affects_evaluation: s.affects_evaluation || "",
  }));

  parsed.successes = (parsed.successes || []).map((s) => ({
    title: s.title || "",
    description: s.description || "",
    how_benefited: s.how_benefited || "",
    how_achieved: s.how_achieved || "",
    time_taken: s.time_taken || "",
  }));

  parsed.fears = (parsed.fears || []).map((f) => ({
    title: f.title || "",
    description: f.description || "",
    how_affected: f.how_affected || "",
    how_overcome: f.how_overcome || "",
    plan_to_overcome: f.plan_to_overcome || "",
  }));

  return parsed;
}
