import type { DailyJournal } from "./types";

export interface JournalPattern {
  keyword: string;
  avgPipsWithKeyword: number;
  avgPipsWithout: number;
  daysWithKeyword: number;
  daysWithout: number;
  impact: number; // positive = keyword correlates with better pips
  variant: "positive" | "negative" | "neutral";
}

const TRACKED_KEYWORDS = [
  { word: "patient", aliases: ["patience", "waited", "patient"] },
  { word: "disciplined", aliases: ["discipline", "disciplined", "followed my plan", "followed the plan"] },
  { word: "frustrated", aliases: ["frustrat", "angry", "anger"] },
  { word: "anxious", aliases: ["anxious", "anxiety", "nervous", "fear", "afraid"] },
  { word: "confident", aliases: ["confident", "confidence", "in control"] },
  { word: "rushed", aliases: ["rushed", "rushing", "impulsive", "impulse", "too early", "too fast"] },
  { word: "revenge", aliases: ["revenge", "get back", "make up for"] },
  { word: "FOMO", aliases: ["fomo", "missing out", "missed out", "fear of missing"] },
  { word: "hesitated", aliases: ["hesitat", "second-guess", "second guess", "doubt", "unsure"] },
  { word: "calm", aliases: ["calm", "peaceful", "relaxed", "grounded"] },
  { word: "tired", aliases: ["tired", "exhausted", "fatigue", "low energy", "didn't sleep"] },
  { word: "overtraded", aliases: ["overtrad", "too many", "three accounts", "all accounts", "multiple accounts"] },
  { word: "confirmation", aliases: ["confirmation", "confirmed", "candle confirm", "rsi confirm"] },
  { word: "focused", aliases: ["focused", "focus", "clear mind", "sharp"] },
  { word: "stress", aliases: ["stress", "stressed", "tension", "pressure", "overwhelm"] },
];

export function computeJournalPatterns(journals: DailyJournal[]): JournalPattern[] {
  if (journals.length < 3) return [];

  const results: JournalPattern[] = [];

  for (const kw of TRACKED_KEYWORDS) {
    let withPips = 0, withCount = 0;
    let withoutPips = 0, withoutCount = 0;

    for (const j of journals) {
      const text = (j.journal_text || "").toLowerCase() +
        " " + (j.emotion_before || "").toLowerCase() +
        " " + (j.emotion_during || "").toLowerCase() +
        " " + (j.emotion_after || "").toLowerCase();

      const found = kw.aliases.some((a) => text.includes(a));
      const pips = j.pips_overall || 0;

      if (found) {
        withPips += pips;
        withCount++;
      } else {
        withoutPips += pips;
        withoutCount++;
      }
    }

    if (withCount >= 1 && withoutCount >= 1) {
      const avgWith = Math.round((withPips / withCount) * 10) / 10;
      const avgWithout = Math.round((withoutPips / withoutCount) * 10) / 10;
      const impact = avgWith - avgWithout;

      results.push({
        keyword: kw.word,
        avgPipsWithKeyword: avgWith,
        avgPipsWithout: avgWithout,
        daysWithKeyword: withCount,
        daysWithout: withoutCount,
        impact,
        variant: Math.abs(impact) < 2 ? "neutral" : impact > 0 ? "positive" : "negative",
      });
    }
  }

  // Sort by absolute impact, return top 5
  return results
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 5);
}
