"use client";

import { useState } from "react";
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Cloud,
  Frown,
  Meh,
  Smile,
  Star,
  TrendingUp,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import EmotionTimelineChart from "@/components/charts/EmotionTimelineChart";
import EffortScatterChart from "@/components/charts/EffortScatterChart";
import { useJournals } from "@/hooks/use-journals";
import { useTrades } from "@/hooks/use-trades";
import { usePsychology } from "@/hooks/use-psychology";

const EMOTION_ICONS: Record<number, typeof Smile> = {
  1: Frown,
  2: Frown,
  3: Meh,
  4: Smile,
  5: Smile,
};

const EMOTION_COLORS: Record<number, string> = {
  1: "text-red-400",
  2: "text-amber-400",
  3: "text-slate-400",
  4: "text-emerald-400",
  5: "text-emerald-400",
};

function emotionToNum(emotion: string): number {
  const lower = emotion.toLowerCase().trim();
  if (lower.includes("confident") || lower.includes("excited")) return 5;
  if (lower.includes("focused") || lower.includes("calm") || lower.includes("observant")) return 4;
  if (lower.includes("stressed") || lower.includes("doubt") || lower.includes("anxious")) return 2;
  if (lower.includes("frustrat") || lower.includes("fear") || lower.includes("angry")) return 1;
  return 3;
}

export default function JournalPage() {
  const { journals, loading: jLoading } = useJournals();
  const { trades, loading: tLoading } = useTrades();
  const psych = usePsychology(journals, trades);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (jLoading || tLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-56" />
        <div className="bg-slate-800 rounded-xl h-64 border border-slate-700" />
      </div>
    );
  }

  if (journals.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Journal & Psychology</h1>
          <p className="text-sm text-slate-400 mt-1">Daily trading journal with emotional tracking</p>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <EmptyState
            icon={Brain}
            title="No journal entries yet"
            description="Use Full Sync on your Google Sheet to import daily journal entries, emotions, market mood, and effort ratings."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Journal & Psychology</h1>
        <p className="text-sm text-slate-400 mt-1">
          Daily trading journal with emotional tracking and pattern analysis
        </p>
      </div>

      {/* Emotion summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Avg Before Session", value: psych.avgEmotionBefore, color: "text-purple-400" },
          { label: "Avg During Session", value: psych.avgEmotionDuring, color: "text-indigo-400" },
          { label: "Avg After Session", value: psych.avgEmotionAfter, color: "text-emerald-400" },
        ].map((s) => {
          const Icon = EMOTION_ICONS[Math.round(s.value)] || Meh;
          return (
            <div key={s.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className={EMOTION_COLORS[Math.round(s.value)] || "text-slate-400"} />
                <span className="text-xs text-slate-400 uppercase tracking-wide">{s.label}</span>
              </div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}/5</div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4">Emotion Timeline</h3>
          <EmotionTimelineChart data={psych.emotionTimeline} />
          <div className="flex justify-center gap-4 mt-3 text-[10px] text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Before</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> During</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> After</span>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4">Effort vs Results</h3>
          {psych.effortVsResults.length > 0 ? (
            <EffortScatterChart data={psych.effortVsResults} />
          ) : (
            <p className="text-xs text-slate-500 py-16 text-center">No effort data yet</p>
          )}
        </div>
      </div>

      {/* Emotion-PnL correlation */}
      {psych.emotionPnlCorrelation.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-3">Emotion vs Performance</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {psych.emotionPnlCorrelation.map((e) => (
              <div key={e.emotion} className="p-3 bg-slate-700/30 rounded-lg text-center">
                <div className="text-xs text-slate-400 mb-1">{e.emotion}</div>
                <div className={`text-lg font-bold ${e.avgPips >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {e.avgPips > 0 ? "+" : ""}{e.avgPips}p
                </div>
                <div className="text-[10px] text-slate-500">{e.count} days</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily journal cards */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Daily Entries</h3>
        <div className="space-y-3">
          {journals.map((j) => {
            const isExpanded = expandedId === j.id;
            const emotionNum = emotionToNum(j.emotion_during);
            const EmIcon = EMOTION_ICONS[emotionNum] || Meh;
            return (
              <div key={j.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : j.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center w-12">
                      <span className="text-xs font-bold text-white">{j.day_of_week.slice(0, 3)}</span>
                      <span className="text-[10px] text-slate-500">{j.journal_date.slice(5)}</span>
                    </div>
                    <EmIcon size={18} className={EMOTION_COLORS[emotionNum]} />
                    <div className="flex items-center gap-3">
                      {j.market_mood && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Cloud size={12} /> {j.market_mood}
                        </span>
                      )}
                      {j.effort_rating > 0 && (
                        <span className="flex items-center gap-1 text-xs text-amber-400">
                          <Star size={12} /> {j.effort_rating}/5
                        </span>
                      )}
                      {j.pips_overall !== 0 && (
                        <span className={`flex items-center gap-1 text-xs ${j.pips_overall >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          <TrendingUp size={12} /> {j.pips_overall > 0 ? "+" : ""}{j.pips_overall}p
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex gap-1 text-[10px]">
                      <span className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-400">{j.emotion_before || "—"}</span>
                      <span className="text-slate-600">→</span>
                      <span className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-400">{j.emotion_during || "—"}</span>
                      <span className="text-slate-600">→</span>
                      <span className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-400">{j.emotion_after || "—"}</span>
                    </div>
                    {isExpanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-700 pt-3 space-y-3">
                    {/* Emotion + mood row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 bg-slate-700/30 rounded">
                        <span className="text-slate-500">Market Mood</span>
                        <div className="text-white font-medium">{j.market_mood || "—"}</div>
                      </div>
                      <div className="p-2 bg-slate-700/30 rounded">
                        <span className="text-slate-500">Fundamentals</span>
                        <div className="text-white font-medium">{j.fundamentals_summary || "—"}</div>
                      </div>
                      <div className="p-2 bg-slate-700/30 rounded">
                        <span className="text-slate-500">Trades Taken</span>
                        <div className="text-white font-medium">{j.trades_taken || 0}</div>
                      </div>
                      <div className="p-2 bg-slate-700/30 rounded">
                        <span className="text-slate-500">R&apos;s Total</span>
                        <div className={`font-medium ${j.rs_total >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {j.rs_total > 0 ? "+" : ""}{j.rs_total}R
                        </div>
                      </div>
                    </div>

                    {/* Full journal text */}
                    {j.journal_text && (
                      <div>
                        <div className="text-[10px] text-indigo-400 font-semibold mb-1 uppercase tracking-wide">Daily Journal</div>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{j.journal_text}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
