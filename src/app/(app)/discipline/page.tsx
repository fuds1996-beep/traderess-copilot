"use client";

import { useMemo, useState } from "react";
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
  Database,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Plus,
  Save,
  X,
  BookOpen,
  Activity,
  EyeOff,
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
  const { trades, loading: tL, refresh: refreshTrades } = useTrades();
  const { journals, loading: jL, refresh: refreshJournals } = useJournals();
  const { entries: chartTimeEntries, totalHours, avgPerDay, loading: cL, refresh: refreshChartTime } = useChartTime();
  const { trades: missedTrades, avoidedWins, avoidedLosses, loading: mL, refresh: refreshMissed } = useMissedTrades();
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

      {/* Data Sources — shows raw data feeding each score */}
      <DataSourcesSection
        trades={trades}
        journals={journals}
        chartTimeEntries={chartTimeEntries}
        missedTrades={missedTrades}
        onRefresh={() => { refresh(); }}
        onTradesRefresh={refreshTrades}
        onJournalsRefresh={refreshJournals}
        onChartTimeRefresh={refreshChartTime}
        onMissedRefresh={refreshMissed}
      />
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

// ─── Data Sources Section ────────────────────────────────────────────────────

import type { Trade, DailyJournal, ChartTimeEntry, MissedTrade } from "@/lib/types";

interface DataSourcesProps {
  trades: Trade[];
  journals: DailyJournal[];
  chartTimeEntries: ChartTimeEntry[];
  missedTrades: MissedTrade[];
  onRefresh: () => void;
  onTradesRefresh: () => void;
  onJournalsRefresh: () => void;
  onChartTimeRefresh: () => void;
  onMissedRefresh: () => void;
}

function DataSourcesSection({
  trades, journals, chartTimeEntries, missedTrades,
  onRefresh, onTradesRefresh, onJournalsRefresh, onChartTimeRefresh, onMissedRefresh,
}: DataSourcesProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chart_time" | "journals" | "trades" | "missed">("chart_time");

  const tabs = [
    { id: "chart_time" as const, label: "Chart Time", icon: Clock, count: chartTimeEntries.length, score: "Chart Time Score", color: "#10b981" },
    { id: "journals" as const, label: "Journals", icon: BookOpen, count: journals.length, score: "Emotional Control", color: "#7d0e3b" },
    { id: "trades" as const, label: "Trades", icon: Activity, count: trades.length, score: "Risk + Plan Scores", color: "#e98e97" },
    { id: "missed" as const, label: "Missed Trades", icon: EyeOff, count: missedTrades.length, score: "Trade Selection", color: "#f59e0b" },
  ];

  return (
    <div className="glass rounded-2xl border border-brand-light/40 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-brand/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Database size={16} className="text-brand" />
          <h3 className="text-sm font-semibold text-gray-900">Data Sources</h3>
          <span className="text-[10px] text-gray-400">View and manage the data that computes your discipline scores</span>
        </div>
        {open ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-brand-light/40">
          {/* Score mapping legend */}
          <div className="px-5 py-3 bg-brand/5 border-b border-brand-light/30">
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-2">How scores are computed</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[10px]">
              <div className="flex items-start gap-2 p-2 bg-white/60 rounded-lg">
                <Clock size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                <div><span className="font-semibold text-gray-700">Chart Time (15%)</span><br/><span className="text-gray-400">Avg daily minutes vs 60 min target</span></div>
              </div>
              <div className="flex items-start gap-2 p-2 bg-white/60 rounded-lg">
                <Shield size={12} className="text-brand-dark mt-0.5 shrink-0" />
                <div><span className="font-semibold text-gray-700">Emotional Control (25%)</span><br/><span className="text-gray-400">% of journal days without stress/frustration/fear</span></div>
              </div>
              <div className="flex items-start gap-2 p-2 bg-white/60 rounded-lg">
                <Target size={12} className="text-brand mt-0.5 shrink-0" />
                <div><span className="font-semibold text-gray-700">Risk Discipline (25%)</span><br/><span className="text-gray-400">% of trades within 3.6% risk limit</span></div>
              </div>
              <div className="flex items-start gap-2 p-2 bg-white/60 rounded-lg">
                <CheckCircle size={12} className="text-brand mt-0.5 shrink-0" />
                <div><span className="font-semibold text-gray-700">Plan Adherence (20%)</span><br/><span className="text-gray-400">% of trades with confirmation + screenshot + evaluation</span></div>
              </div>
            </div>
          </div>

          {/* Tab nav */}
          <div className="flex border-b border-brand-light/30">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs transition-colors ${
                  activeTab === tab.id
                    ? "text-brand border-b-2 border-brand font-semibold bg-brand/5"
                    : "text-gray-500 hover:text-gray-700 hover:bg-brand/5"
                }`}
              >
                <tab.icon size={12} />
                {tab.label}
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-light/60 text-gray-500">{tab.count}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-4">
            {activeTab === "chart_time" && (
              <ChartTimeDataTable entries={chartTimeEntries} onRefresh={onChartTimeRefresh} />
            )}
            {activeTab === "journals" && (
              <JournalDataTable journals={journals} onRefresh={onJournalsRefresh} />
            )}
            {activeTab === "trades" && (
              <TradeRiskDataTable trades={trades} onRefresh={onTradesRefresh} />
            )}
            {activeTab === "missed" && (
              <MissedTradeDataTable missedTrades={missedTrades} onRefresh={onMissedRefresh} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Chart Time Data Table ───────────────────────────────────────────────────

function ChartTimeDataTable({ entries, onRefresh }: { entries: ChartTimeEntry[]; onRefresh: () => void }) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editMinutes, setEditMinutes] = useState("");
  const [adding, setAdding] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newMinutes, setNewMinutes] = useState("");

  async function handleSave(id: string) {
    const supabase = createClient();
    const mins = parseInt(editMinutes);
    if (isNaN(mins)) return;
    await supabase.from("chart_time_log").update({ total_minutes: mins, chart_time_minutes: mins }).eq("id", id);
    setEditId(null);
    onRefresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this chart time entry?")) return;
    const supabase = createClient();
    await supabase.from("chart_time_log").delete().eq("id", id);
    onRefresh();
  }

  async function handleAdd() {
    if (!newDate || !newMinutes) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const mins = parseInt(newMinutes);
    if (isNaN(mins)) return;
    await supabase.from("chart_time_log").upsert({
      user_id: user.id,
      log_date: newDate,
      week_start: newDate,
      total_minutes: mins,
      chart_time_minutes: mins,
      logging_time_minutes: 0,
      education_time_minutes: 0,
      time_slots: [],
    }, { onConflict: "user_id,log_date" });
    setAdding(false);
    setNewDate("");
    setNewMinutes("");
    onRefresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] text-gray-400">Daily chart time entries used to compute <span className="font-semibold text-gray-600">Chart Time Score</span></p>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-[10px] text-brand hover:text-brand-dark transition-colors">
          <Plus size={12} /> Add Entry
        </button>
      </div>

      {adding && (
        <div className="flex items-center gap-2 p-2 bg-brand/5 rounded-lg border border-brand-light/40 mb-2">
          <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="text-[10px] px-2 py-1 bg-white/80 border border-brand-light/40 rounded" />
          <input type="number" value={newMinutes} onChange={(e) => setNewMinutes(e.target.value)} placeholder="Minutes" className="text-[10px] px-2 py-1 bg-white/80 border border-brand-light/40 rounded w-20" />
          <button onClick={handleAdd} className="p-1 text-emerald-500 hover:text-emerald-600"><Save size={14} /></button>
          <button onClick={() => setAdding(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={14} /></button>
        </div>
      )}

      <div className="max-h-[300px] overflow-y-auto space-y-1">
        {entries.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">No chart time entries. Use Full Sync or add manually.</p>
        ) : entries.map((e) => (
          <div key={e.id} className="flex items-center justify-between p-2 bg-white/60 rounded-lg border border-brand-light/30 hover:border-brand/30 transition-colors group">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-400 font-mono w-20">{e.log_date}</span>
              {editId === e.id ? (
                <input type="number" value={editMinutes} onChange={(ev) => setEditMinutes(ev.target.value)} className="text-[10px] px-2 py-0.5 bg-white border border-brand rounded w-16" autoFocus />
              ) : (
                <span className="text-xs font-semibold text-gray-900">{e.total_minutes} min</span>
              )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {editId === e.id ? (
                <>
                  <button onClick={() => handleSave(e.id)} className="p-1 text-emerald-500 hover:text-emerald-600"><Save size={12} /></button>
                  <button onClick={() => setEditId(null)} className="p-1 text-gray-400 hover:text-gray-600"><X size={12} /></button>
                </>
              ) : (
                <>
                  <button onClick={() => { setEditId(e.id); setEditMinutes(String(e.total_minutes)); }} className="p-1 text-gray-400 hover:text-brand"><Pencil size={12} /></button>
                  <button onClick={() => handleDelete(e.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Journal Data Table ──────────────────────────────────────────────────────

function JournalDataTable({ journals, onRefresh }: { journals: DailyJournal[]; onRefresh: () => void }) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editBefore, setEditBefore] = useState("");
  const [editDuring, setEditDuring] = useState("");
  const [editAfter, setEditAfter] = useState("");

  async function handleSave(id: string) {
    const supabase = createClient();
    await supabase.from("daily_journals").update({
      emotion_before: editBefore,
      emotion_during: editDuring,
      emotion_after: editAfter,
    }).eq("id", id);
    setEditId(null);
    onRefresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this journal entry? This will affect your Emotional Control score.")) return;
    const supabase = createClient();
    await supabase.from("daily_journals").delete().eq("id", id);
    onRefresh();
  }

  const EMOTIONS = ["Confident", "Calm", "Neutral", "Focused", "Anxious", "Stressed", "Frustrated", "Fear", "Panic"];

  return (
    <div>
      <p className="text-[10px] text-gray-400 mb-3">Journal emotion fields used to compute <span className="font-semibold text-gray-600">Emotional Control Score</span> — days with stress/frustration/fear/panic during trading lower the score</p>
      <div className="max-h-[300px] overflow-y-auto space-y-1">
        {journals.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">No journal entries. Use Full Sync or Journals sync to import.</p>
        ) : journals.map((j) => (
          <div key={j.id} className="p-2.5 bg-white/60 rounded-lg border border-brand-light/30 hover:border-brand/30 transition-colors group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-gray-400 font-mono w-20">{j.journal_date}</span>
                {editId === j.id ? (
                  <div className="flex items-center gap-1.5">
                    <select value={editBefore} onChange={(e) => setEditBefore(e.target.value)} className="text-[10px] px-1.5 py-0.5 bg-white border border-brand rounded">
                      {EMOTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <select value={editDuring} onChange={(e) => setEditDuring(e.target.value)} className="text-[10px] px-1.5 py-0.5 bg-white border border-brand rounded">
                      {EMOTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <select value={editAfter} onChange={(e) => setEditAfter(e.target.value)} className="text-[10px] px-1.5 py-0.5 bg-white border border-brand rounded">
                      {EMOTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[10px]">
                    <EmotionChip label="Before" value={j.emotion_before} />
                    <EmotionChip label="During" value={j.emotion_during} />
                    <EmotionChip label="After" value={j.emotion_after} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {editId === j.id ? (
                  <>
                    <button onClick={() => handleSave(j.id)} className="p-1 text-emerald-500 hover:text-emerald-600"><Save size={12} /></button>
                    <button onClick={() => setEditId(null)} className="p-1 text-gray-400 hover:text-gray-600"><X size={12} /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditId(j.id); setEditBefore(j.emotion_before); setEditDuring(j.emotion_during); setEditAfter(j.emotion_after); }} className="p-1 text-gray-400 hover:text-brand"><Pencil size={12} /></button>
                    <button onClick={() => handleDelete(j.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmotionChip({ label, value }: { label: string; value: string }) {
  const isNeg = /stress|frustrat|fear|panic|anxious/i.test(value);
  const isPos = /confident|calm|focused|relaxed/i.test(value);
  return (
    <span className={`px-1.5 py-0.5 rounded text-[9px] ${
      isNeg ? "bg-red-50 text-red-600 border border-red-200/50" :
      isPos ? "bg-emerald-50 text-emerald-600 border border-emerald-200/50" :
      "bg-gray-50 text-gray-500 border border-gray-200/50"
    }`}>
      <span className="text-gray-400">{label}: </span>{value || "—"}
    </span>
  );
}

// ─── Trade Risk Data Table ───────────────────────────────────────────────────

function TradeRiskDataTable({ trades, onRefresh }: { trades: Trade[]; onRefresh: () => void }) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editRisk, setEditRisk] = useState("");

  async function handleSave(id: string) {
    const supabase = createClient();
    await supabase.from("trade_log").update({ percent_risked: editRisk }).eq("id", id);
    setEditId(null);
    onRefresh();
  }

  return (
    <div>
      <p className="text-[10px] text-gray-400 mb-3">
        <span className="font-semibold text-gray-600">Risk Discipline</span> = % of trades with % Risked &le; 3.6% &nbsp;|&nbsp;
        <span className="font-semibold text-gray-600">Plan Adherence</span> = % of trades with confirmation + screenshot + evaluation filled
      </p>
      <div className="max-h-[300px] overflow-y-auto">
        <table className="w-full text-[10px]">
          <thead className="sticky top-0 bg-white/90 backdrop-blur-sm">
            <tr className="border-b border-brand-light/40">
              <th className="text-left py-1.5 px-2 text-gray-400 font-medium">Date</th>
              <th className="text-left py-1.5 px-2 text-gray-400 font-medium">Pair</th>
              <th className="text-left py-1.5 px-2 text-gray-400 font-medium">% Risked</th>
              <th className="text-center py-1.5 px-2 text-gray-400 font-medium">Conf</th>
              <th className="text-center py-1.5 px-2 text-gray-400 font-medium">Screenshot</th>
              <th className="text-center py-1.5 px-2 text-gray-400 font-medium">Evaluation</th>
              <th className="text-right py-1.5 px-2 text-gray-400 font-medium w-16"></th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No trades. Sync your Google Sheet to import.</td></tr>
            ) : trades.map((t) => {
              const riskPct = parseFloat((t.percent_risked || "").replace(/[^0-9.]/g, ""));
              const overRisk = !isNaN(riskPct) && riskPct > 3.6;
              const hasConf = !!t.entry_conf_1;
              const hasScreenshot = !!t.before_picture;
              const hasEval = !!t.trade_evaluation;
              return (
                <tr key={t.id} className="border-b border-brand-light/20 hover:bg-brand/5 group">
                  <td className="py-1.5 px-2 font-mono text-gray-400">{t.trade_date}</td>
                  <td className="py-1.5 px-2 font-semibold text-gray-700">{t.pair}</td>
                  <td className="py-1.5 px-2">
                    {editId === t.id ? (
                      <input value={editRisk} onChange={(e) => setEditRisk(e.target.value)} className="px-1.5 py-0.5 bg-white border border-brand rounded w-16 text-[10px]" autoFocus />
                    ) : (
                      <span className={overRisk ? "text-red-500 font-semibold" : "text-gray-600"}>
                        {t.percent_risked || "—"}
                        {overRisk && <AlertTriangle size={10} className="inline ml-1 text-red-400" />}
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-center">{hasConf ? <CheckCircle size={12} className="text-emerald-500 mx-auto" /> : <XCircle size={12} className="text-gray-300 mx-auto" />}</td>
                  <td className="py-1.5 px-2 text-center">{hasScreenshot ? <CheckCircle size={12} className="text-emerald-500 mx-auto" /> : <XCircle size={12} className="text-gray-300 mx-auto" />}</td>
                  <td className="py-1.5 px-2 text-center">{hasEval ? <CheckCircle size={12} className="text-emerald-500 mx-auto" /> : <XCircle size={12} className="text-gray-300 mx-auto" />}</td>
                  <td className="py-1.5 px-2 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editId === t.id ? (
                        <>
                          <button onClick={() => handleSave(t.id)} className="p-0.5 text-emerald-500 hover:text-emerald-600"><Save size={11} /></button>
                          <button onClick={() => setEditId(null)} className="p-0.5 text-gray-400 hover:text-gray-600"><X size={11} /></button>
                        </>
                      ) : (
                        <button onClick={() => { setEditId(t.id); setEditRisk(t.percent_risked || ""); }} className="p-0.5 text-gray-400 hover:text-brand"><Pencil size={11} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Missed Trade Data Table ─────────────────────────────────────────────────

function MissedTradeDataTable({ missedTrades, onRefresh }: { missedTrades: MissedTrade[]; onRefresh: () => void }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ trade_date: "", pair: "EUR/USD", direction: "Long" as "Long" | "Short", session: "", reason_missed: "", would_have_result: "Win", would_have_pips: "" });

  async function handleAdd() {
    if (!form.trade_date || !form.pair) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("missed_trades").insert({
      user_id: user.id,
      trade_date: form.trade_date,
      pair: form.pair,
      direction: form.direction,
      session: form.session,
      reason_missed: form.reason_missed,
      would_have_result: form.would_have_result,
      would_have_pips: parseInt(form.would_have_pips) || 0,
      entry_price: 0,
      sl_price: 0,
      tp_price: 0,
      notes: "",
    });
    setAdding(false);
    setForm({ trade_date: "", pair: "EUR/USD", direction: "Long", session: "", reason_missed: "", would_have_result: "Win", would_have_pips: "" });
    onRefresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this missed trade entry?")) return;
    const supabase = createClient();
    await supabase.from("missed_trades").delete().eq("id", id);
    onRefresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] text-gray-400">Missed/avoided trades — avoiding losses increases <span className="font-semibold text-gray-600">Trade Selection Score</span></p>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-[10px] text-brand hover:text-brand-dark transition-colors">
          <Plus size={12} /> Add Missed Trade
        </button>
      </div>

      {adding && (
        <div className="p-3 bg-brand/5 rounded-lg border border-brand-light/40 mb-3 space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <input type="date" value={form.trade_date} onChange={(e) => setForm({ ...form, trade_date: e.target.value })} className="text-[10px] px-2 py-1 bg-white/80 border border-brand-light/40 rounded" />
            <input value={form.pair} onChange={(e) => setForm({ ...form, pair: e.target.value })} placeholder="Pair" className="text-[10px] px-2 py-1 bg-white/80 border border-brand-light/40 rounded" />
            <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value as "Long" | "Short" })} className="text-[10px] px-2 py-1 bg-white/80 border border-brand-light/40 rounded">
              <option value="Long">Long</option>
              <option value="Short">Short</option>
            </select>
            <input value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value })} placeholder="Session" className="text-[10px] px-2 py-1 bg-white/80 border border-brand-light/40 rounded" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <input value={form.reason_missed} onChange={(e) => setForm({ ...form, reason_missed: e.target.value })} placeholder="Reason missed" className="text-[10px] px-2 py-1 bg-white/80 border border-brand-light/40 rounded sm:col-span-2" />
            <select value={form.would_have_result} onChange={(e) => setForm({ ...form, would_have_result: e.target.value })} className="text-[10px] px-2 py-1 bg-white/80 border border-brand-light/40 rounded">
              <option value="Win">Would Win</option>
              <option value="Loss">Would Loss</option>
              <option value="BE">Would BE</option>
            </select>
            <input type="number" value={form.would_have_pips} onChange={(e) => setForm({ ...form, would_have_pips: e.target.value })} placeholder="Pips" className="text-[10px] px-2 py-1 bg-white/80 border border-brand-light/40 rounded" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex items-center gap-1 text-[10px] px-3 py-1 bg-brand text-white rounded hover:bg-brand-dark transition-colors"><Save size={12} /> Save</button>
            <button onClick={() => setAdding(false)} className="flex items-center gap-1 text-[10px] px-3 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition-colors"><X size={12} /> Cancel</button>
          </div>
        </div>
      )}

      <div className="max-h-[300px] overflow-y-auto space-y-1">
        {missedTrades.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">No missed trades logged. Add them manually or use Full Sync.</p>
        ) : missedTrades.map((m) => (
          <div key={m.id} className="flex items-center justify-between p-2 bg-white/60 rounded-lg border border-brand-light/30 hover:border-brand/30 transition-colors group">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-400 font-mono w-20">{m.trade_date}</span>
              <span className="text-[10px] font-semibold text-gray-700">{m.pair}</span>
              <span className={`text-[10px] ${m.direction === "Long" ? "text-emerald-500" : "text-red-500"}`}>{m.direction}</span>
              {m.session && <span className="text-[9px] px-1.5 py-0.5 bg-brand-light/60 rounded text-gray-500">{m.session}</span>}
              <span className={`text-[10px] font-semibold ${m.would_have_result === "Win" ? "text-amber-500" : m.would_have_result === "Loss" ? "text-emerald-500" : "text-gray-400"}`}>
                {m.would_have_result === "Win" ? "Missed Win" : m.would_have_result === "Loss" ? "Avoided Loss" : "BE"}
              </span>
              {m.reason_missed && <span className="text-[9px] text-gray-400 truncate max-w-[150px]">{m.reason_missed}</span>}
            </div>
            <button onClick={() => handleDelete(m.id)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
