import type { Trade } from "./types";

export interface RiskAnalysis {
  winRate: number;
  avgWinR: number;
  avgLossR: number;
  riskPerTrade: number;
  profitProbability: number;
  drawdown20Probability: number;
  expectedReturn: number;
}

/**
 * Simplified Monte Carlo simulation for risk of ruin analysis.
 * Runs 1000 simulations of 100 trades each based on historical stats.
 */
export function computeRiskAnalysis(
  trades: Trade[],
  riskPerTrade: number = 1,
): RiskAnalysis | null {
  if (trades.length < 5) return null;

  const wins = trades.filter((t) => t.result === "Win");
  const losses = trades.filter((t) => t.result === "Loss");

  if (wins.length === 0 || losses.length === 0) return null;

  const winRate = wins.length / trades.length;

  const winRs = wins.map((t) => Math.abs(t.rs_gained || 1));
  const lossRs = losses.map((t) => Math.abs(t.rs_gained || 1));

  const avgWinR = winRs.reduce((s, r) => s + r, 0) / winRs.length;
  const avgLossR = lossRs.reduce((s, r) => s + r, 0) / lossRs.length;

  // Monte Carlo: 1000 simulations, 100 trades each
  const SIMS = 1000;
  const TRADES_PER_SIM = 100;
  let profitCount = 0;
  let drawdown20Count = 0;
  let totalReturn = 0;

  for (let sim = 0; sim < SIMS; sim++) {
    let balance = 100; // start at 100%
    let peak = 100;
    let maxDrawdown = 0;

    for (let trade = 0; trade < TRADES_PER_SIM; trade++) {
      const isWin = Math.random() < winRate;

      if (isWin) {
        // Random win size around average
        const r = avgWinR * (0.5 + Math.random());
        balance += riskPerTrade * r;
      } else {
        const r = avgLossR * (0.5 + Math.random());
        balance -= riskPerTrade * r;
      }

      if (balance > peak) peak = balance;
      const dd = ((peak - balance) / peak) * 100;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    if (balance > 100) profitCount++;
    if (maxDrawdown >= 20) drawdown20Count++;
    totalReturn += balance - 100;
  }

  return {
    winRate: Math.round(winRate * 100),
    avgWinR: Math.round(avgWinR * 100) / 100,
    avgLossR: Math.round(avgLossR * 100) / 100,
    riskPerTrade,
    profitProbability: Math.round((profitCount / SIMS) * 100),
    drawdown20Probability: Math.round((drawdown20Count / SIMS) * 100),
    expectedReturn: Math.round((totalReturn / SIMS) * 100) / 100,
  };
}
