import type { Trade } from "./types";
import type { LucideIcon } from "lucide-react";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  AlertTriangle,
  Zap,
  Target,
  Award,
} from "lucide-react";

export interface Insight {
  icon: LucideIcon;
  headline: string;
  body: string;
  variant: "positive" | "neutral" | "warning";
}

export function computeInsights(trades: Trade[]): Insight[] {
  if (trades.length < 3) return [];

  const insights: (Insight & { priority: number })[] = [];

  // ── Day of week analysis ──────────────────────────────────────────────────
  const dayMap = new Map<string, { wins: number; total: number }>();
  for (const t of trades) {
    const day = t.day || getDayName(t.trade_date);
    if (!day) continue;
    const d = dayMap.get(day) || { wins: 0, total: 0 };
    d.total++;
    if (t.result === "Win") d.wins++;
    dayMap.set(day, d);
  }

  const dayRates = [...dayMap.entries()]
    .filter(([, d]) => d.total >= 2)
    .map(([day, d]) => ({ day, wr: Math.round((d.wins / d.total) * 100), total: d.total }))
    .sort((a, b) => b.wr - a.wr);

  if (dayRates.length >= 2) {
    const best = dayRates[0];
    const worst = dayRates[dayRates.length - 1];
    if (best.wr - worst.wr >= 15) {
      insights.push({
        icon: Calendar,
        headline: `Best day: ${best.day} (${best.wr}% WR)`,
        body: `Your win rate is highest on ${best.day}s (${best.wr}%) and lowest on ${worst.day}s (${worst.wr}%). Consider being more selective on ${worst.day}s.`,
        variant: "neutral",
        priority: 8,
      });
    }
  }

  // ── Session analysis ──────────────────────────────────────────────────────
  const sessionMap = new Map<string, { wins: number; total: number }>();
  for (const t of trades) {
    const s = t.session || "Other";
    const d = sessionMap.get(s) || { wins: 0, total: 0 };
    d.total++;
    if (t.result === "Win") d.wins++;
    sessionMap.set(s, d);
  }

  const sessionRates = [...sessionMap.entries()]
    .filter(([, d]) => d.total >= 2)
    .map(([session, d]) => ({ session, wr: Math.round((d.wins / d.total) * 100), total: d.total }))
    .sort((a, b) => b.wr - a.wr);

  if (sessionRates.length >= 2) {
    const best = sessionRates[0];
    const worst = sessionRates[sessionRates.length - 1];
    insights.push({
      icon: Clock,
      headline: `${best.session}: ${best.wr}% win rate`,
      body: `You perform best during ${best.session} (${best.wr}% across ${best.total} trades) vs ${worst.session} (${worst.wr}%). Focus on your strongest sessions.`,
      variant: best.wr >= 60 ? "positive" : "neutral",
      priority: 7,
    });
  }

  // ── Streak detection ──────────────────────────────────────────────────────
  const sorted = [...trades].sort((a, b) => b.trade_date.localeCompare(a.trade_date));
  let streakType: "Win" | "Loss" | null = null;
  let streakCount = 0;

  for (const t of sorted) {
    if (t.result === "BE") continue;
    if (!streakType) {
      streakType = t.result as "Win" | "Loss";
      streakCount = 1;
    } else if (t.result === streakType) {
      streakCount++;
    } else {
      break;
    }
  }

  if (streakCount >= 3 && streakType === "Win") {
    insights.push({
      icon: Zap,
      headline: `${streakCount}-trade winning streak`,
      body: `You're on a ${streakCount}-trade winning streak. Stay disciplined and don't let overconfidence affect your next entry.`,
      variant: "positive",
      priority: 9,
    });
  } else if (streakCount >= 2 && streakType === "Loss") {
    insights.push({
      icon: AlertTriangle,
      headline: `${streakCount} consecutive losses`,
      body: `You've had ${streakCount} losing trades in a row. Consider pausing, reviewing your journal, and ensuring your next trade has full confirmation.`,
      variant: "warning",
      priority: 10,
    });
  }

  // ── Risk/reward analysis ──────────────────────────────────────────────────
  const winPips = trades.filter((t) => t.result === "Win").map((t) => Math.abs(t.overall_pips || t.pips || 0));
  const lossPips = trades.filter((t) => t.result === "Loss").map((t) => Math.abs(t.overall_pips || t.pips || 0));

  if (winPips.length >= 2 && lossPips.length >= 1) {
    const avgWin = Math.round((winPips.reduce((s, p) => s + p, 0) / winPips.length) * 10) / 10;
    const avgLoss = Math.round((lossPips.reduce((s, p) => s + p, 0) / lossPips.length) * 10) / 10;
    const ratio = avgLoss > 0 ? Math.round((avgWin / avgLoss) * 10) / 10 : 0;

    if (ratio >= 1.5) {
      insights.push({
        icon: TrendingUp,
        headline: `R:R ratio ${ratio}:1`,
        body: `Your average winner (+${avgWin}p) is ${ratio}x your average loser (-${avgLoss}p). Your risk/reward profile is healthy.`,
        variant: "positive",
        priority: 6,
      });
    } else if (ratio > 0 && ratio < 1) {
      insights.push({
        icon: TrendingDown,
        headline: `R:R needs work (${ratio}:1)`,
        body: `Your average winner (+${avgWin}p) is less than your average loser (-${avgLoss}p). Consider tightening stops or letting winners run longer.`,
        variant: "warning",
        priority: 8,
      });
    }
  }

  // ── Account performance comparison ────────────────────────────────────────
  const accountMap = new Map<string, { wins: number; total: number }>();
  for (const t of trades) {
    if (!t.account_name) continue;
    const d = accountMap.get(t.account_name) || { wins: 0, total: 0 };
    d.total++;
    if (t.result === "Win") d.wins++;
    accountMap.set(t.account_name, d);
  }

  const accountRates = [...accountMap.entries()]
    .filter(([, d]) => d.total >= 3)
    .map(([name, d]) => ({ name, wr: Math.round((d.wins / d.total) * 100), total: d.total }))
    .sort((a, b) => b.wr - a.wr);

  if (accountRates.length >= 2) {
    const best = accountRates[0];
    const worst = accountRates[accountRates.length - 1];
    if (best.wr - worst.wr >= 10) {
      insights.push({
        icon: Target,
        headline: `${best.name}: strongest account`,
        body: `${best.wr}% win rate on ${best.name} (${best.total} trades) vs ${worst.wr}% on ${worst.name}. Focus on what's working differently.`,
        variant: "neutral",
        priority: 5,
      });
    }
  }

  // ── Overall win rate assessment ───────────────────────────────────────────
  const totalWins = trades.filter((t) => t.result === "Win").length;
  const overallWr = Math.round((totalWins / trades.length) * 100);
  if (overallWr >= 65) {
    insights.push({
      icon: Award,
      headline: `${overallWr}% overall win rate`,
      body: `Your win rate of ${overallWr}% exceeds the 65% target. Keep executing your plan with discipline.`,
      variant: "positive",
      priority: 4,
    });
  }

  // Sort by priority (highest first) and return top 4
  return insights
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4)
    .map(({ priority: _, ...rest }) => rest);
}

function getDayName(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { weekday: "long" });
  } catch {
    return "";
  }
}
