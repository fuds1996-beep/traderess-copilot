"use client";

import { useMemo } from "react";
import {
  DollarSign,
  Hash,
  Percent,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";
import type { Trade } from "@/lib/types";

interface BestWorstTrade {
  pair: string;
  dollars: number;
  date: string;
}

interface PeriodStats {
  totalTrades: number;
  wins: number;
  losses: number;
  be: number;
  winRate: string;
  totalPips: number;
  totalRs: number;
  totalDollars: number;
  bestTrade: BestWorstTrade;
  worstTrade: BestWorstTrade;
  avgPipsPerTrade: number;
}

function parseDollars(t: Trade): number {
  const v = parseFloat((t.dollar_result || "").replace(/[^0-9.\-]/g, ""));
  return isNaN(v) ? 0 : v;
}

function computeStats(trades: Trade[]): PeriodStats {
  const wins = trades.filter((t) => t.result === "Win").length;
  const losses = trades.filter((t) => t.result === "Loss").length;
  const be = trades.filter((t) => t.result === "BE").length;
  const totalTrades = trades.length;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : "0";

  const totalPips = trades.reduce((s, t) => s + (t.overall_pips || t.pips || 0), 0);
  const totalRs = trades.reduce((s, t) => s + (t.rs_gained || 0), 0);
  const totalDollars = trades.reduce((s, t) => s + parseDollars(t), 0);

  // Best/worst by dollar amount
  let bestTrade: BestWorstTrade = { pair: "—", dollars: 0, date: "" };
  let worstTrade: BestWorstTrade = { pair: "—", dollars: 0, date: "" };

  for (const t of trades) {
    const d = parseDollars(t);
    if (d > bestTrade.dollars) bestTrade = { pair: t.pair, dollars: d, date: t.trade_date };
    if (d < worstTrade.dollars) worstTrade = { pair: t.pair, dollars: d, date: t.trade_date };
  }

  const avgPipsPerTrade = totalTrades > 0 ? Math.round((totalPips / totalTrades) * 10) / 10 : 0;

  return {
    totalTrades, wins, losses, be, winRate,
    totalPips: Math.round(totalPips * 10) / 10,
    totalRs: Math.round(totalRs * 100) / 100,
    totalDollars: Math.round(totalDollars * 100) / 100,
    bestTrade, worstTrade, avgPipsPerTrade,
  };
}

export default function PeriodSummary({
  label,
  trades,
}: {
  label: string;
  trades: Trade[];
}) {
  const stats = useMemo(() => computeStats(trades), [trades]);

  if (trades.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-5 border border-pink-200/40">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{label}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MiniStat icon={Hash} label="Trades" value={stats.totalTrades} />
        <MiniStat
          icon={Percent}
          label="Win Rate"
          value={`${stats.winRate}%`}
          color={Number(stats.winRate) >= 60 ? "text-emerald-500" : Number(stats.winRate) >= 40 ? "text-amber-500" : "text-red-500"}
        />
        <MiniStat
          icon={DollarSign}
          label="P/L"
          value={`$${stats.totalDollars.toLocaleString()}`}
          color={stats.totalDollars >= 0 ? "text-emerald-500" : "text-red-500"}
        />
        <MiniStat
          icon={Activity}
          label="Total Pips"
          value={stats.totalPips}
          color={stats.totalPips >= 0 ? "text-emerald-500" : "text-red-500"}
        />
        <MiniStat
          icon={TrendingUp}
          label="Best Trade"
          value={`$${Math.abs(stats.bestTrade.dollars).toLocaleString()}`}
          sub={stats.bestTrade.pair}
          color="text-emerald-500"
        />
        <MiniStat
          icon={TrendingDown}
          label="Worst Trade"
          value={`-$${Math.abs(stats.worstTrade.dollars).toLocaleString()}`}
          sub={stats.worstTrade.pair}
          color="text-red-500"
        />
      </div>

      {/* Win/Loss bar */}
      <div className="mt-4 flex items-center gap-2">
        <div className="flex-1 flex h-3 rounded-full overflow-hidden bg-gray-100">
          {stats.wins > 0 && (
            <div className="bg-emerald-400 transition-all" style={{ width: `${(stats.wins / stats.totalTrades) * 100}%` }} />
          )}
          {stats.be > 0 && (
            <div className="bg-amber-300 transition-all" style={{ width: `${(stats.be / stats.totalTrades) * 100}%` }} />
          )}
          {stats.losses > 0 && (
            <div className="bg-red-400 transition-all" style={{ width: `${(stats.losses / stats.totalTrades) * 100}%` }} />
          )}
        </div>
        <div className="flex gap-3 text-[10px] text-gray-400 shrink-0">
          <span>{stats.wins}W</span>
          <span>{stats.losses}L</span>
          {stats.be > 0 && <span>{stats.be}BE</span>}
        </div>
      </div>

      <div className="mt-3 flex gap-4 text-[10px] text-gray-400">
        <span>Avg pips/trade: <strong className="text-gray-600">{stats.avgPipsPerTrade}</strong></span>
        <span>Total R&apos;s: <strong className={stats.totalRs >= 0 ? "text-emerald-500" : "text-red-500"}>{stats.totalRs > 0 ? "+" : ""}{stats.totalRs}R</strong></span>
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-gray-900",
}: {
  icon: typeof DollarSign;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="p-2.5 bg-pink-50/60 rounded-xl">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} className="text-pink-400" />
        <span className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-gray-400">{sub}</div>}
    </div>
  );
}
