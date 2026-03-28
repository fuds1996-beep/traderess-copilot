"use client";

import { useMemo } from "react";
import {
  Target,
  Clock,
  Shield,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { DisciplineSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import { LazyDisciplineRadarChart as DisciplineRadarChart, LazyChartTimeBarChart as ChartTimeBarChart, LazyCorrelationDualAxisChart as CorrelationDualAxisChart } from "@/components/charts/lazy";
import { computeRiskAnalysis } from "@/lib/compute-risk-analysis";
import { createClient } from "@/lib/supabase/client";
import { useTrades } from "@/hooks/use-trades";
import { useJournals } from "@/hooks/use-journals";
import { useChartTime } from "@/hooks/use-chart-time";
import { useMissedTrades } from "@/hooks/use-missed-trades";
import { useGoals } from "@/hooks/use-goals";
import { useDiscipline } from "@/hooks/use-discipline";

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

function scoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

export default function DisciplinePage() {
  const { trades, loading: tL } = useTrades();
  const { journals, loading: jL } = useJournals();
  const { entries: chartTimeEntries, totalHours, avgPerDay, loading: cL } = useChartTime();
  const { trades: missedTrades, avoidedWins, avoidedLosses, loading: mL } = useMissedTrades();
  const { goals, loading: gL, refresh } = useGoals();
  const { scores, chartTimeVsPips, radarData } = useDiscipline(trades, journals, chartTimeEntries, missedTrades);
  const riskAnalysis = useMemo(() => computeRiskAnalysis(trades), [trades]);

  const loading = tL || jL || cL || mL || gL;

  if (loading) return <DisciplineSkeleton />;

  const hasAnyData = journals.length > 0 || chartTimeEntries.length > 0 || missedTrades.length > 0 || (goals !== null);

  if (!hasAnyData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discipline</h1>
          <p className="text-sm text-gray-500 mt-1">Track accountability, chart time, and goal progress</p>
        </div>
        <div className="glass rounded-2xl border border-brand-light/40">
          <EmptyState
            icon={Target}
            title="No discipline data yet"
            description="Use Full Sync on your Google Sheet to import journal entries, chart time logs, missed trades, and goals."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Discipline</h1>
        <p className="text-sm text-gray-500 mt-1">Accountability, chart time, and goal progress</p>
      </div>

      {/* Overall score + breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="lg:col-span-2 glass rounded-2xl p-5 border border-brand-light/40 flex flex-col items-center justify-center">
          <span className="text-xs text-gray-500 uppercase tracking-wide mb-2">Overall Discipline</span>
          <span className={`text-5xl font-bold ${scoreColor(scores.overall)}`}>{scores.overall}</span>
          <span className="text-xs text-gray-400 mt-1">out of 100</span>
        </div>
        {[
          { label: "Chart Time", value: scores.chartTime, icon: Clock },
          { label: "Emotional", value: scores.emotionalControl, icon: Shield },
          { label: "Risk", value: scores.riskDiscipline, icon: Target },
          { label: "Plan", value: scores.planAdherence, icon: CheckCircle },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4 border border-brand-light/40">
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={14} className={scoreColor(s.value)} />
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">{s.label}</span>
            </div>
            <div className={`text-2xl font-bold ${scoreColor(s.value)}`}>{s.value}</div>
            <ProgressBar value={s.value} color={scoreBg(s.value)} />
          </div>
        ))}
      </div>

      {/* Radar + Chart Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5 border border-brand-light/40">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Discipline Radar</h3>
          <DisciplineRadarChart data={radarData} />
        </div>

        <div className="glass rounded-2xl p-5 border border-brand-light/40">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Chart Time</h3>
            <div className="flex gap-3 text-xs text-gray-500">
              <span>{totalHours}h total</span>
              <span>{avgPerDay}m/day avg</span>
            </div>
          </div>
          {chartTimeEntries.length > 0 ? (
            <ChartTimeBarChart data={chartTimeEntries} />
          ) : (
            <p className="text-xs text-gray-400 py-16 text-center">No chart time data</p>
          )}
        </div>
      </div>

      {/* Chart time vs pips correlation */}
      {chartTimeVsPips.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-brand-light/40">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Chart Time vs Performance</h3>
          <CorrelationDualAxisChart data={chartTimeVsPips} />
        </div>
      )}

      {/* Missed trades summary — full list is on Performance tab */}
      {missedTrades.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-brand-light/40">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Missed & Avoided Trades</h3>
            <a href="/performance" className="text-[10px] text-brand hover:text-brand-dark transition-colors">
              View full details &rarr;
            </a>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/40 text-center">
              <div className="text-lg font-bold text-amber-600">{avoidedWins}</div>
              <div className="text-[10px] text-amber-500">Wins Missed</div>
            </div>
            <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200/40 text-center">
              <div className="text-lg font-bold text-emerald-600">{avoidedLosses}</div>
              <div className="text-[10px] text-emerald-500">Losses Avoided</div>
            </div>
            <div className="p-3 bg-brand-light/60 rounded-xl border border-brand-light/40 text-center">
              <div className="text-lg font-bold text-gray-900">{missedTrades.length}</div>
              <div className="text-[10px] text-gray-500">Total Missed</div>
            </div>
          </div>
        </div>
      )}

      {/* Goals — interactive checkboxes */}
      {goals && (
        <div className="glass rounded-2xl p-5 border border-brand-light/40">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Trading Goals</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <InteractiveGoalSection title="Primary Goals" goals={goals.primary_goals} field="primary_goals" goalId={goals.id} color="bg-brand" onRefresh={refresh} />
            <InteractiveGoalSection title="Process Goals" goals={goals.process_goals} field="process_goals" goalId={goals.id} color="bg-emerald-500" onRefresh={refresh} />
            <InteractiveGoalSection title="Psychological Goals" goals={goals.psychological_goals} field="psychological_goals" goalId={goals.id} color="bg-purple-500" onRefresh={refresh} />
          </div>

          {goals.improvement_items.length > 0 && (
            <div className="mt-4 pt-4 border-t border-brand-light/40">
              <h4 className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">What I Need to Improve</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {goals.improvement_items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-brand-light/80 rounded text-xs text-gray-600">
                    <span className="text-brand font-bold shrink-0">{i + 1}.</span>
                    {item.item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {goals.intention_text && (
            <div className="mt-4 p-3 bg-brand-light/80 border border-brand-light/30 rounded-lg">
              <p className="text-xs text-brand italic">{goals.intention_text}</p>
            </div>
          )}
        </div>
      )}

      {/* Risk Analysis */}
      {riskAnalysis && (
        <div className="glass rounded-2xl p-5 border border-brand-light/40">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900">Risk Analysis</h3>
            <span className="text-[10px] text-gray-400">Monte Carlo simulation (1,000 runs × 100 trades)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-3 bg-brand-light/60 rounded-xl text-center">
              <div className="text-[10px] text-gray-400 mb-1">Win Rate</div>
              <div className="text-lg font-bold text-gray-900">{riskAnalysis.winRate}%</div>
            </div>
            <div className="p-3 bg-brand-light/60 rounded-xl text-center">
              <div className="text-[10px] text-gray-400 mb-1">Avg Win</div>
              <div className="text-lg font-bold text-emerald-500">+{riskAnalysis.avgWinR}R</div>
            </div>
            <div className="p-3 bg-brand-light/60 rounded-xl text-center">
              <div className="text-[10px] text-gray-400 mb-1">Avg Loss</div>
              <div className="text-lg font-bold text-red-500">-{riskAnalysis.avgLossR}R</div>
            </div>
            <div className="p-3 bg-brand-light/60 rounded-xl text-center">
              <div className="text-[10px] text-gray-400 mb-1">Risk/Trade</div>
              <div className="text-lg font-bold text-gray-900">{riskAnalysis.riskPerTrade}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`p-4 rounded-xl border ${
              riskAnalysis.profitProbability >= 70 ? "bg-emerald-50/60 border-emerald-200/40" :
              riskAnalysis.profitProbability >= 50 ? "bg-amber-50/60 border-amber-200/40" :
              "bg-red-50/60 border-red-200/40"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className={riskAnalysis.profitProbability >= 70 ? "text-emerald-500" : riskAnalysis.profitProbability >= 50 ? "text-amber-500" : "text-red-500"} />
                <span className="text-xs text-gray-600">Probability of Profit</span>
              </div>
              <div className={`text-3xl font-bold ${riskAnalysis.profitProbability >= 70 ? "text-emerald-500" : riskAnalysis.profitProbability >= 50 ? "text-amber-500" : "text-red-500"}`}>
                {riskAnalysis.profitProbability}%
              </div>
              <ProgressBar
                value={riskAnalysis.profitProbability}
                color={riskAnalysis.profitProbability >= 70 ? "bg-emerald-500" : riskAnalysis.profitProbability >= 50 ? "bg-amber-500" : "bg-red-500"}
              />
              <p className="text-[10px] text-gray-400 mt-1">After 100 trades at current stats</p>
            </div>

            <div className={`p-4 rounded-xl border ${
              riskAnalysis.drawdown20Probability < 15 ? "bg-emerald-50/60 border-emerald-200/40" :
              riskAnalysis.drawdown20Probability < 30 ? "bg-amber-50/60 border-amber-200/40" :
              "bg-red-50/60 border-red-200/40"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className={riskAnalysis.drawdown20Probability < 15 ? "text-emerald-500" : riskAnalysis.drawdown20Probability < 30 ? "text-amber-500" : "text-red-500"} />
                <span className="text-xs text-gray-600">Risk of 20% Drawdown</span>
              </div>
              <div className={`text-3xl font-bold ${riskAnalysis.drawdown20Probability < 15 ? "text-emerald-500" : riskAnalysis.drawdown20Probability < 30 ? "text-amber-500" : "text-red-500"}`}>
                {riskAnalysis.drawdown20Probability}%
              </div>
              <ProgressBar
                value={riskAnalysis.drawdown20Probability}
                color={riskAnalysis.drawdown20Probability < 15 ? "bg-emerald-500" : riskAnalysis.drawdown20Probability < 30 ? "bg-amber-500" : "bg-red-500"}
              />
              <p className="text-[10px] text-gray-400 mt-1">Chance of hitting 20% max drawdown</p>
            </div>
          </div>

          <p className="text-[9px] text-gray-300 mt-3 italic">
            For educational simulation purposes only — based on historical data patterns. Not financial advice.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Interactive Goal Section with checkbox persistence ──────────────────────

function InteractiveGoalSection({
  title,
  goals,
  field,
  goalId,
  color,
  onRefresh,
}: {
  title: string;
  goals: { goal: string; completed: boolean }[];
  field: string;
  goalId: string;
  color: string;
  onRefresh: () => void;
}) {
  if (!goals || goals.length === 0) return null;

  const completed = goals.filter((g) => g.completed).length;
  const pct = Math.round((completed / goals.length) * 100);

  async function toggleGoal(idx: number) {
    const updated = [...goals];
    updated[idx] = { ...updated[idx], completed: !updated[idx].completed };

    const supabase = createClient();
    await supabase.from("trading_goals").update({ [field]: updated }).eq("id", goalId);
    onRefresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 font-medium">{title}</span>
        <span className="text-xs text-gray-400">{pct}%</span>
      </div>
      <ProgressBar value={pct} color={color} />
      <div className="mt-2 space-y-1">
        {goals.map((g, i) => (
          <button
            key={i}
            onClick={() => toggleGoal(i)}
            className="flex items-start gap-2 text-[11px] w-full text-left hover:bg-brand-light/40 rounded p-0.5 transition-colors"
          >
            {g.completed ? (
              <CheckCircle size={12} className="text-emerald-400 mt-0.5 shrink-0" />
            ) : (
              <XCircle size={12} className="text-gray-300 mt-0.5 shrink-0" />
            )}
            <span className={g.completed ? "text-gray-500 line-through" : "text-gray-600"}>{g.goal}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
