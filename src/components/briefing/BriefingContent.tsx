"use client";

import {
  Eye,
  CheckCircle,
  AlertTriangle,
  Globe,
  Calendar,
  Shield,
  XCircle,
  Lightbulb,
  BookOpen,
  RefreshCw,
  Newspaper,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import SentimentDot from "@/components/ui/SentimentDot";
import CollapsibleSection from "@/components/ui/CollapsibleSection";
import EmptyState from "@/components/ui/EmptyState";
import { useBriefing } from "@/hooks/use-briefing";
import type { Sentiment } from "@/lib/types";

export default function BriefingContent() {
  const { briefing, loading, hasData } = useBriefing();

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-white/50 rounded w-48" />
        <div className="glass rounded-2xl h-48 border border-pink-200/40" />
        <div className="glass rounded-2xl h-64 border border-pink-200/40" />
      </div>
    );
  }

  if (!hasData || !briefing) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Briefing</h1>
          <p className="text-sm text-gray-500 mt-1">Fundamental analysis, economic calendar, and market sentiment</p>
        </div>
        <div className="glass rounded-2xl border border-pink-200/40">
          <EmptyState
            icon={Newspaper}
            title="No briefing generated yet"
            description="Weekly briefings are generated from your trading data and market analysis. Connect your Google Sheet and run the copilot workflow to generate your first briefing."
          />
        </div>
      </div>
    );
  }

  const b = briefing;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Briefing</h1>
          <p className="text-sm text-gray-500 mt-1">
            {b.week_label} — Prepared by Trading Copilot
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-pink-500 text-white text-xs rounded-lg hover:bg-pink-600 transition-colors">
            <RefreshCw size={12} /> Refresh Briefing
          </button>
        </div>
      </div>

      {/* Week in Review */}
      {b.review_stats?.length > 0 && (
        <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 rounded-xl p-5 border border-pink-200/40">
          <div className="flex items-center gap-2 mb-3">
            <Eye size={16} className="text-pink-500" />
            <h3 className="text-sm font-semibold text-gray-900">Your Week in Review</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            {b.review_stats.map((s) => (
              <div key={s.label} className="text-center p-3 bg-white/40 rounded-lg">
                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {b.what_went_well && (
              <div className="p-3 bg-emerald-900/20 rounded-lg border border-emerald-800/30">
                <div className="flex items-center gap-1.5 mb-1.5 text-emerald-400 font-medium text-xs">
                  <CheckCircle size={12} /> What Went Well
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{b.what_went_well}</p>
              </div>
            )}
            {b.watch_out_for && (
              <div className="p-3 bg-amber-900/20 rounded-lg border border-amber-800/30">
                <div className="flex items-center gap-1.5 mb-1.5 text-amber-400 font-medium text-xs">
                  <AlertTriangle size={12} /> Watch Out For
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{b.watch_out_for}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Market Context */}
      {(b.articles_eurusd?.length > 0 || b.articles_dxy?.length > 0) && (
        <MarketContext
          eurusdArticles={b.articles_eurusd}
          dxyArticles={b.articles_dxy}
          eurusdBias={b.eurusd_bias}
          dxyBias={b.dxy_bias}
          keyInsight={b.key_insight}
        />
      )}

      {/* Economic Calendar */}
      {b.calendar_events?.length > 0 && (
        <EconomicCalendar events={b.calendar_events} />
      )}

      {/* Copilot Guidance */}
      {(b.no_trade_zones || b.daily_risk_ratings?.length > 0) && (
        <CopilotGuidance
          noTradeZones={b.no_trade_zones}
          dailyRisk={b.daily_risk_ratings}
          quote={b.motivational_quote}
        />
      )}

      {/* Daily Checklist */}
      {b.pre_session_checklist?.length > 0 && (
        <DailyChecklist items={b.pre_session_checklist} />
      )}
    </div>
  );
}

// ─── SUB-COMPONENTS (unchanged logic, just receive props) ────────────────────

function MarketContext({
  eurusdArticles,
  dxyArticles,
  eurusdBias,
  dxyBias,
  keyInsight,
}: {
  eurusdArticles: { source: string; title: string; time: string; sentiment: Sentiment }[];
  dxyArticles: { source: string; title: string; time: string; sentiment: Sentiment }[];
  eurusdBias: Sentiment;
  dxyBias: Sentiment;
  keyInsight: string;
}) {
  const biasLabel = (s: Sentiment) =>
    s === "bullish" ? "Bullish Bias" : s === "bearish" ? "Bearish Bias" : "Neutral";
  const biasColor = (s: Sentiment) =>
    s === "bullish" ? "text-emerald-400" : s === "bearish" ? "text-red-400" : "text-amber-400";

  return (
    <CollapsibleSection icon={Globe} iconColor="text-blue-400" title="Market Context & Fundamentals">
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {eurusdArticles?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-900">EUR/USD Analysis</span>
                <SentimentDot sentiment={eurusdBias} />
                <span className={`text-[10px] ${biasColor(eurusdBias)}`}>{biasLabel(eurusdBias)}</span>
              </div>
              <div className="space-y-1.5">
                {eurusdArticles.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-pink-50/80 rounded text-xs">
                    <SentimentDot sentiment={a.sentiment} />
                    <div className="flex-1">
                      <div className="text-gray-700">{a.title}</div>
                      <div className="text-gray-400 mt-0.5">{a.source} · {a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {dxyArticles?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-900">DXY Analysis</span>
                <SentimentDot sentiment={dxyBias} />
                <span className={`text-[10px] ${biasColor(dxyBias)}`}>{biasLabel(dxyBias)}</span>
              </div>
              <div className="space-y-1.5">
                {dxyArticles.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-pink-50/80 rounded text-xs">
                    <SentimentDot sentiment={a.sentiment} />
                    <div className="flex-1">
                      <div className="text-gray-700">{a.title}</div>
                      <div className="text-gray-400 mt-0.5">{a.source} · {a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {keyInsight && (
          <div className="p-3 bg-pink-50/80 border border-pink-300/30 rounded-lg">
            <div className="flex items-center gap-1.5 mb-1 text-pink-500 font-medium text-xs">
              <Lightbulb size={12} /> Key Insight from Deep Research
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{keyInsight}</p>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

function EconomicCalendar({
  events,
}: {
  events: { day: string; time: string; event: string; impact: "high" | "medium" | "low"; currency: string }[];
}) {
  return (
    <CollapsibleSection icon={Calendar} iconColor="text-amber-400" title="Economic Calendar (CET Times)">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {WEEKDAYS.map((day) => (
          <div key={day} className="space-y-1.5">
            <div className={`text-xs font-semibold text-center py-1 rounded ${day === "Wed" ? "bg-red-900/40 text-red-400" : "bg-pink-100/60 text-gray-600"}`}>
              {day}
            </div>
            {events.filter((e) => e.day === day).map((e, i) => (
              <div key={i} className={`p-2 rounded text-[10px] border ${e.impact === "high" ? "bg-red-900/20 border-red-800/40" : e.impact === "medium" ? "bg-amber-900/20 border-amber-800/40" : "bg-pink-50/80 border-pink-200/50/40"}`}>
                <div className="text-gray-500">{e.time}</div>
                <div className="text-gray-700 leading-tight mt-0.5">{e.event}</div>
                <div className="mt-1"><Badge variant={e.impact}>{e.impact}</Badge></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

function CopilotGuidance({ noTradeZones, dailyRisk, quote }: { noTradeZones: string; dailyRisk: { day: string; risk: string; note: string; color: string }[]; quote: string }) {
  return (
    <div className="glass rounded-2xl p-5 border border-pink-200/40">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={16} className="text-pink-500" />
        <h3 className="text-sm font-semibold text-gray-900">Copilot Guidance for This Week</h3>
      </div>
      {noTradeZones && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-red-400 text-xs font-semibold mb-1"><XCircle size={14} /> Hard No-Trade Zones</div>
          <p className="text-xs text-gray-600">{noTradeZones}</p>
        </div>
      )}
      {dailyRisk?.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {dailyRisk.map((d) => (
            <div key={d.day} className={`p-3 rounded-lg border ${d.color}`}>
              <div className="text-xs font-bold text-gray-900 mb-0.5">{d.day}</div>
              <Badge variant={d.risk === "extreme" || d.risk === "high" ? "danger" : d.risk === "medium" ? "warning" : "success"}>{d.risk} risk</Badge>
              <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed">{d.note}</p>
            </div>
          ))}
        </div>
      )}
      {quote && (
        <div className="mt-4 p-3 bg-pink-50/80 border border-pink-300/30 rounded-lg">
          <p className="text-xs text-pink-400 italic">&quot;{quote}&quot;</p>
        </div>
      )}
    </div>
  );
}

function DailyChecklist({ items }: { items: string[] }) {
  return (
    <div className="glass rounded-2xl p-5 border border-pink-200/40">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen size={16} className="text-emerald-400" />
        <h3 className="text-sm font-semibold text-gray-900">Daily Pre-Session Checklist</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item, i) => (
          <label key={i} className="flex items-center gap-2 p-2 bg-pink-50/80 rounded text-xs text-gray-600 cursor-pointer hover:bg-pink-50/60 transition-colors">
            <input type="checkbox" className="accent-pink-500 w-3.5 h-3.5" />
            {item}
          </label>
        ))}
      </div>
    </div>
  );
}
