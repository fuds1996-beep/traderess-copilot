"use client";

import { useMemo } from "react";
import type { DailyJournal, Trade } from "@/lib/types";

// Map emotion text to numeric for charting
const EMOTION_MAP: Record<string, number> = {
  confident: 5, excited: 5,
  focused: 4, calm: 4, observant: 4,
  neutral: 3,
  anxious: 2, stressed: 2, doubt: 2, tense: 2,
  frustrated: 1, angry: 1, fear: 1, panic: 1,
};

function emotionToNumber(emotion: string): number {
  const lower = emotion.toLowerCase().trim();
  for (const [key, val] of Object.entries(EMOTION_MAP)) {
    if (lower.includes(key)) return val;
  }
  return 3; // default to neutral
}

export interface EmotionDataPoint {
  date: string;
  day: string;
  before: number;
  during: number;
  after: number;
  beforeLabel: string;
  duringLabel: string;
  afterLabel: string;
  pips: number;
  effort: number;
}

export interface PsychologyStats {
  emotionTimeline: EmotionDataPoint[];
  avgEmotionBefore: number;
  avgEmotionDuring: number;
  avgEmotionAfter: number;
  emotionPnlCorrelation: { emotion: string; avgPips: number; count: number }[];
  effortVsResults: { effort: number; pips: number; date: string }[];
}

export function usePsychology(journals: DailyJournal[], trades: Trade[]): PsychologyStats {
  return useMemo(() => {
    if (journals.length === 0) {
      return {
        emotionTimeline: [],
        avgEmotionBefore: 0,
        avgEmotionDuring: 0,
        avgEmotionAfter: 0,
        emotionPnlCorrelation: [],
        effortVsResults: [],
      };
    }

    // Build daily pips map from trades
    const dailyPips = new Map<string, number>();
    for (const t of trades) {
      const date = t.trade_date;
      dailyPips.set(date, (dailyPips.get(date) || 0) + (t.overall_pips || t.pips || 0));
    }

    // Timeline
    const emotionTimeline: EmotionDataPoint[] = journals.map((j) => ({
      date: j.journal_date,
      day: j.day_of_week.slice(0, 3) || j.journal_date.slice(5),
      before: emotionToNumber(j.emotion_before),
      during: emotionToNumber(j.emotion_during),
      after: emotionToNumber(j.emotion_after),
      beforeLabel: j.emotion_before,
      duringLabel: j.emotion_during,
      afterLabel: j.emotion_after,
      pips: dailyPips.get(j.journal_date) || 0,
      effort: j.effort_rating,
    }));

    // Averages
    const avgBefore = emotionTimeline.reduce((s, e) => s + e.before, 0) / emotionTimeline.length;
    const avgDuring = emotionTimeline.reduce((s, e) => s + e.during, 0) / emotionTimeline.length;
    const avgAfter = emotionTimeline.reduce((s, e) => s + e.after, 0) / emotionTimeline.length;

    // Emotion vs P/L correlation: group by "during" emotion
    const emotionGroups = new Map<string, { totalPips: number; count: number }>();
    for (const j of journals) {
      const emotion = j.emotion_during || "Neutral";
      const pips = dailyPips.get(j.journal_date) || 0;
      const existing = emotionGroups.get(emotion) || { totalPips: 0, count: 0 };
      existing.totalPips += pips;
      existing.count++;
      emotionGroups.set(emotion, existing);
    }

    const emotionPnlCorrelation = [...emotionGroups.entries()].map(([emotion, d]) => ({
      emotion,
      avgPips: Math.round((d.totalPips / d.count) * 10) / 10,
      count: d.count,
    }));

    // Effort vs results
    const effortVsResults = journals
      .filter((j) => j.effort_rating > 0)
      .map((j) => ({
        effort: j.effort_rating,
        pips: dailyPips.get(j.journal_date) || 0,
        date: j.journal_date,
      }));

    return {
      emotionTimeline,
      avgEmotionBefore: Math.round(avgBefore * 10) / 10,
      avgEmotionDuring: Math.round(avgDuring * 10) / 10,
      avgEmotionAfter: Math.round(avgAfter * 10) / 10,
      emotionPnlCorrelation,
      effortVsResults,
    };
  }, [journals, trades]);
}
