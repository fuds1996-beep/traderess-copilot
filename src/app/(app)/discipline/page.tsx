"use client";

import {
  Target,
  Clock,
  Shield,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import DisciplineRadarChart from "@/components/charts/DisciplineRadarChart";
import ChartTimeBarChart from "@/components/charts/ChartTimeBarChart";
import CorrelationDualAxisChart from "@/components/charts/CorrelationDualAxisChart";
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
  const { goals, primaryPct, processPct, psychPct, loading: gL } = useGoals();
  const { scores, chartTimeVsPips, radarData } = useDiscipline(trades, journals, chartTimeEntries, missedTrades);

  const loading = tL || jL || cL || mL || gL;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-40" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="bg-slate-800 rounded-xl h-24 border border-slate-700" />)}
        </div>
      </div>
    );
  }

  const hasAnyData = journals.length > 0 || chartTimeEntries.length > 0 || missedTrades.length > 0 || (goals !== null);

  if (!hasAnyData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Discipline</h1>
          <p className="text-sm text-slate-400 mt-1">Track accountability, chart time, and goal progress</p>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700">
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
        <h1 className="text-2xl font-bold text-white">Discipline</h1>
        <p className="text-sm text-slate-400 mt-1">Accountability, chart time, and goal progress</p>
      </div>

      {/* Overall score + breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="lg:col-span-2 bg-slate-800 rounded-xl p-5 border border-slate-700 flex flex-col items-center justify-center">
          <span className="text-xs text-slate-400 uppercase tracking-wide mb-2">Overall Discipline</span>
          <span className={`text-5xl font-bold ${scoreColor(scores.overall)}`}>{scores.overall}</span>
          <span className="text-xs text-slate-500 mt-1">out of 100</span>
        </div>
        {[
          { label: "Chart Time", value: scores.chartTime, icon: Clock },
          { label: "Emotional", value: scores.emotionalControl, icon: Shield },
          { label: "Risk", value: scores.riskDiscipline, icon: Target },
          { label: "Plan", value: scores.planAdherence, icon: CheckCircle },
        ].map((s) => (
          <div key={s.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={14} className={scoreColor(s.value)} />
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">{s.label}</span>
            </div>
            <div className={`text-2xl font-bold ${scoreColor(s.value)}`}>{s.value}</div>
            <ProgressBar value={s.value} color={scoreBg(s.value)} />
          </div>
        ))}
      </div>

      {/* Radar + Chart Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4">Discipline Radar</h3>
          <DisciplineRadarChart data={radarData} />
        </div>

        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Chart Time</h3>
            <div className="flex gap-3 text-xs text-slate-400">
              <span>{totalHours}h total</span>
              <span>{avgPerDay}m/day avg</span>
            </div>
          </div>
          {chartTimeEntries.length > 0 ? (
            <ChartTimeBarChart data={chartTimeEntries} />
          ) : (
            <p className="text-xs text-slate-500 py-16 text-center">No chart time data</p>
          )}
        </div>
      </div>

      {/* Chart time vs pips correlation */}
      {chartTimeVsPips.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4">Chart Time vs Performance</h3>
          <CorrelationDualAxisChart data={chartTimeVsPips} />
        </div>
      )}

      {/* Missed trades */}
      {missedTrades.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Missed & Avoided Trades</h3>
            <div className="flex gap-2 text-xs">
              <span className="text-emerald-400">{avoidedLosses} losses avoided</span>
              <span className="text-amber-400">{avoidedWins} wins missed</span>
            </div>
          </div>
          <div className="space-y-2">
            {missedTrades.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-16">{m.trade_date.slice(5)}</span>
                  <span className="text-xs text-white font-medium">{m.pair}</span>
                  <span className={`flex items-center gap-1 text-xs ${m.direction === "Long" ? "text-emerald-400" : "text-red-400"}`}>
                    {m.direction === "Long" ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                    {m.direction}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {m.would_have_result && (
                    <Badge variant={m.would_have_result === "Win" ? "success" : m.would_have_result === "Loss" ? "danger" : "warning"}>
                      Would: {m.would_have_result}
                    </Badge>
                  )}
                  {m.reason_missed && (
                    <span className="text-[10px] text-slate-500 max-w-[200px] truncate">{m.reason_missed}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goals */}
      {goals && (
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4">Trading Goals</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <GoalSection title="Primary Goals" goals={goals.primary_goals} pct={primaryPct} color="bg-indigo-500" />
            <GoalSection title="Process Goals" goals={goals.process_goals} pct={processPct} color="bg-emerald-500" />
            <GoalSection title="Psychological Goals" goals={goals.psychological_goals} pct={psychPct} color="bg-purple-500" />
          </div>

          {goals.improvement_items.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <h4 className="text-xs text-slate-400 font-semibold mb-2 uppercase tracking-wide">What I Need to Improve</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {goals.improvement_items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-slate-700/30 rounded text-xs text-slate-300">
                    <span className="text-indigo-400 font-bold shrink-0">{i + 1}.</span>
                    {item.item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {goals.intention_text && (
            <div className="mt-4 p-3 bg-indigo-900/20 border border-indigo-800/30 rounded-lg">
              <p className="text-xs text-indigo-300 italic">{goals.intention_text}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GoalSection({
  title,
  goals,
  pct,
  color,
}: {
  title: string;
  goals: { goal: string; completed: boolean }[];
  pct: number;
  color: string;
}) {
  if (!goals || goals.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400 font-medium">{title}</span>
        <span className="text-xs text-slate-500">{pct}%</span>
      </div>
      <ProgressBar value={pct} color={color} />
      <div className="mt-2 space-y-1">
        {goals.map((g, i) => (
          <div key={i} className="flex items-start gap-2 text-[11px]">
            {g.completed ? (
              <CheckCircle size={12} className="text-emerald-400 mt-0.5 shrink-0" />
            ) : (
              <XCircle size={12} className="text-slate-600 mt-0.5 shrink-0" />
            )}
            <span className={g.completed ? "text-slate-400 line-through" : "text-slate-300"}>{g.goal}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
