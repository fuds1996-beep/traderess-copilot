"use client";

import { useMemo } from "react";
import type { Trade, DailyJournal, ChartTimeEntry, MissedTrade } from "@/lib/types";

export interface DisciplineScores {
  overall: number;
  chartTime: number;
  emotionalControl: number;
  riskDiscipline: number;
  planAdherence: number;
  missedTradeScore: number;
}

export interface DisciplineData {
  scores: DisciplineScores;
  chartTimeVsPips: { date: string; minutes: number; pips: number }[];
  radarData: { trait: string; value: number; fullMark: number }[];
}

// Target: 5 hours per week = ~60 min per trading day
const TARGET_DAILY_MINUTES = 60;

export function useDiscipline(
  trades: Trade[],
  journals: DailyJournal[],
  chartTime: ChartTimeEntry[],
  missedTrades: MissedTrade[],
): DisciplineData {
  return useMemo(() => {
    // ── Chart Time Score (0-100) ──
    const avgMinutes = chartTime.length > 0
      ? chartTime.reduce((s, c) => s + c.total_minutes, 0) / chartTime.length
      : 0;
    const chartTimeScore = Math.min(100, Math.round((avgMinutes / TARGET_DAILY_MINUTES) * 100));

    // ── Emotional Control (0-100) ──
    // Lower score if negative emotions correlate with trades taken
    let emotionalControl = 100;
    const stressedDays = journals.filter((j) => {
      const during = j.emotion_during.toLowerCase();
      return during.includes("stress") || during.includes("frustrat") || during.includes("fear") || during.includes("panic");
    });
    if (journals.length > 0) {
      const negPct = stressedDays.length / journals.length;
      emotionalControl = Math.round((1 - negPct) * 100);
    }

    // ── Risk Discipline (0-100) ──
    // Check if percent_risked stays within limits (<=3.6%)
    let riskDiscipline = 100;
    if (trades.length > 0) {
      const overRisked = trades.filter((t) => {
        const pct = parseFloat((t.percent_risked || "").replace(/[^0-9.]/g, ""));
        return !isNaN(pct) && pct > 3.6;
      });
      riskDiscipline = Math.round(((trades.length - overRisked.length) / trades.length) * 100);
    }

    // ── Plan Adherence (0-100) ──
    // Check if trades have all required fields filled (confirmations, fundamental check, etc.)
    let planAdherence = 100;
    if (trades.length > 0) {
      const wellDocumented = trades.filter((t) =>
        t.entry_conf_1 && t.before_picture && t.trade_evaluation,
      );
      planAdherence = Math.round((wellDocumented.length / trades.length) * 100);
    }

    // ── Missed Trade Score (0-100) ──
    // Higher is better — avoiding bad trades shows discipline
    let missedTradeScore = 50; // neutral if no data
    if (missedTrades.length > 0) {
      const avoidedLosses = missedTrades.filter((m) => m.would_have_result === "Loss").length;
      missedTradeScore = Math.min(100, 50 + avoidedLosses * 15);
    }

    // ── Overall ──
    const overall = Math.round(
      chartTimeScore * 0.15 +
      emotionalControl * 0.25 +
      riskDiscipline * 0.25 +
      planAdherence * 0.20 +
      missedTradeScore * 0.15,
    );

    const scores: DisciplineScores = {
      overall,
      chartTime: chartTimeScore,
      emotionalControl,
      riskDiscipline,
      planAdherence,
      missedTradeScore,
    };

    // Chart time vs pips correlation data
    const dailyPips = new Map<string, number>();
    for (const t of trades) {
      dailyPips.set(t.trade_date, (dailyPips.get(t.trade_date) || 0) + (t.overall_pips || t.pips || 0));
    }

    const chartTimeVsPips = chartTime.map((c) => ({
      date: c.log_date,
      minutes: c.total_minutes,
      pips: dailyPips.get(c.log_date) || 0,
    }));

    // Radar chart data
    const radarData = [
      { trait: "Chart Time", value: chartTimeScore, fullMark: 100 },
      { trait: "Emotional Control", value: emotionalControl, fullMark: 100 },
      { trait: "Risk Discipline", value: riskDiscipline, fullMark: 100 },
      { trait: "Plan Adherence", value: planAdherence, fullMark: 100 },
      { trait: "Trade Selection", value: missedTradeScore, fullMark: 100 },
    ];

    return { scores, chartTimeVsPips, radarData };
  }, [trades, journals, chartTime, missedTrades]);
}
