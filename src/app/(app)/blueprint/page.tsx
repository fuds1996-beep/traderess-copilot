"use client";

import { useState } from "react";
import {
  Database, Globe, Brain, FileSpreadsheet, Shield, BarChart3,
  BookOpen, Target, Clock, Zap, ArrowRight, ArrowDown, Users,
  TrendingUp, Heart, Eye, Settings, Sparkles, RefreshCw,
  Layers, Server, Monitor, ChevronDown, ChevronRight,
  Activity, PieChart, LineChart, AlertTriangle, CheckCircle2,
} from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const DB_TABLES = [
  { name: "trade_log", desc: "Individual trade records", fields: "35+ fields + custom_fields JSONB", color: "#e98e97", icon: TrendingUp },
  { name: "daily_journals", desc: "Daily journal entries", fields: "emotions, mood, effort, text, ratings, checklist", color: "#7d0e3b", icon: BookOpen },
  { name: "trading_performance", desc: "Weekly aggregates", fields: "pnl, trades, win_rate, session/day data", color: "#f59e0b", icon: BarChart3 },
  { name: "weekly_briefings", desc: "AI-generated briefings", fields: "stats, insights, events, risk ratings", color: "#8b5cf6", icon: Sparkles },
  { name: "chart_time_log", desc: "Study time tracking", fields: "minutes by category, time slots", color: "#10b981", icon: Clock },
  { name: "weekly_summaries", desc: "Weekly review notes", fields: "summary text, trading plan, risk ladder", color: "#3b82f6", icon: Layers },
  { name: "account_balances", desc: "Account progress", fields: "start/end balance, weekly result, status", color: "#ef4444", icon: Activity },
  { name: "missed_trades", desc: "Missed opportunities", fields: "pair, direction, reason, would-have pips", color: "#f97316", icon: AlertTriangle },
  { name: "trading_goals", desc: "Goal tracking", fields: "primary, process, psychological goals", color: "#14b8a6", icon: Target },
  { name: "trader_profiles", desc: "Psychology & identity", fields: "strengths, weaknesses, fears, radar scores", color: "#ec4899", icon: Heart },
  { name: "trading_accounts", desc: "Prop firm accounts", fields: "size, type, status, balance, targets", color: "#6366f1", icon: Shield },
  { name: "account_payouts", desc: "Payout records", fields: "gross, net, split %, status", color: "#a855f7", icon: Database },
  { name: "copilot_settings", desc: "User preferences", fields: "pairs, session, risk model, connections", color: "#64748b", icon: Settings },
  { name: "sync_history", desc: "Sync run log", fields: "mode, status, duration, synced counts", color: "#78716c", icon: RefreshCw },
];

const API_ROUTES = [
  {
    method: "POST", path: "/api/sheets/sync", label: "Data Sync",
    desc: "Parses Google Sheets with Claude AI and writes to database",
    modes: [
      { name: "Trades Only", time: "30-60s", tables: ["trade_log"], color: "#e98e97" },
      { name: "Journals Only", time: "1-2 min", tables: ["daily_journals", "trade_log (update)"], color: "#7d0e3b" },
      { name: "Full Sync", time: "2-5 min", tables: ["trade_log", "daily_journals", "chart_time_log", "account_balances", "missed_trades", "trading_goals", "weekly_summaries"], color: "#8b5cf6" },
    ],
  },
  {
    method: "POST", path: "/api/briefing/generate", label: "Briefing Generator",
    desc: "Fetches trades + journals + profile, asks Claude to generate personalized weekly briefing",
    modes: [{ name: "Generate", time: "30-60s", tables: ["weekly_briefings"], color: "#f59e0b" }],
  },
  {
    method: "POST", path: "/api/profile", label: "Profile Upload",
    desc: "Parses trader psychology CSV with Claude AI",
    modes: [{ name: "Upload", time: "20-40s", tables: ["trader_profiles"], color: "#ec4899" }],
  },
  {
    method: "POST", path: "/api/profile/analyze", label: "Profile Analysis",
    desc: "Analyzes 4 weeks of trades + journals, updates strengths/weaknesses/scores",
    modes: [{ name: "Analyze", time: "30-60s", tables: ["trader_profiles"], color: "#14b8a6" }],
  },
  {
    method: "GET", path: "/api/sheets", label: "Sheet Preview",
    desc: "Fetches raw rows from Google Sheets for preview (no AI)",
    modes: [{ name: "Fetch", time: "2-5s", tables: [], color: "#64748b" }],
  },
];

const PAGES = [
  {
    path: "/dashboard", label: "Dashboard", icon: Monitor, color: "#e98e97",
    reads: ["trade_log", "daily_journals", "chart_time_log", "trading_accounts"],
    computes: ["AI Insights", "Cumulative P/L", "Win/Loss Pie", "Account Stats", "Sparkline Trends"],
    desc: "Main hub — greeting, quick stats, AI insights, charts, account overview",
  },
  {
    path: "/performance", label: "Performance", icon: BarChart3, color: "#3b82f6",
    reads: ["trade_log", "daily_journals", "account_balances"],
    computes: ["Period Summaries", "P/L by Account", "Win Rate Trend", "Session Breakdown", "Day Analysis", "Emotion Timeline"],
    desc: "Deep analytics — grouped trade log, period stats, multi-chart analysis",
  },
  {
    path: "/journal", label: "Journal", icon: BookOpen, color: "#7d0e3b",
    reads: ["daily_journals", "trade_log"],
    computes: ["Journal Patterns", "Emotion Correlation", "Weekly Groups"],
    desc: "Daily entries — edit/create journals, emotion tracking, pattern analysis",
  },
  {
    path: "/discipline", label: "Discipline", icon: Target, color: "#10b981",
    reads: ["trade_log", "daily_journals", "chart_time_log", "missed_trades", "trading_goals"],
    computes: ["Discipline Score (5 components)", "Monte Carlo Risk", "Chart Time vs Pips", "Goal Progress"],
    desc: "Accountability — 5-factor discipline score, risk analysis, goals",
  },
  {
    path: "/briefing", label: "Briefing", icon: Sparkles, color: "#8b5cf6",
    reads: ["weekly_briefings"],
    computes: ["Review Stats", "Risk Ratings", "Calendar Events"],
    desc: "AI weekly review — what went well, watch out for, risk ratings, events",
  },
  {
    path: "/profile", label: "Profile", icon: Heart, color: "#ec4899",
    reads: ["trader_profiles", "trading_accounts", "account_payouts"],
    computes: ["Radar Scores", "SPACE Method", "Before/After Compare"],
    desc: "Trader psychology — strengths, weaknesses, fears, AI score updates",
  },
  {
    path: "/settings", label: "Settings", icon: Settings, color: "#64748b",
    reads: ["copilot_settings", "sync_history"],
    computes: ["Sync History Timeline"],
    desc: "Google Sheets connector, sync history, configuration",
  },
];

const HOOKS = [
  { name: "useTrades", fetches: "trade_log", realtime: true, filters: "DateRangeContext" },
  { name: "usePerformance", fetches: "trade_log + trading_performance", realtime: true, filters: "DateRangeContext" },
  { name: "useJournals", fetches: "daily_journals", realtime: true, filters: "DateRangeContext" },
  { name: "useChartTime", fetches: "chart_time_log", realtime: false, filters: "DateRangeContext" },
  { name: "useMissedTrades", fetches: "missed_trades", realtime: false, filters: "none" },
  { name: "useGoals", fetches: "trading_goals", realtime: false, filters: "none" },
  { name: "useAccountBalances", fetches: "account_balances", realtime: false, filters: "none" },
  { name: "useTradingAccounts", fetches: "trading_accounts", realtime: false, filters: "none" },
  { name: "useTraderProfile", fetches: "trader_profiles + prop_firm_accounts", realtime: false, filters: "none" },
  { name: "useBriefing", fetches: "weekly_briefings", realtime: false, filters: "none" },
  { name: "useSettings", fetches: "copilot_settings", realtime: false, filters: "none" },
  { name: "useDiscipline", fetches: "computed from trades+journals+chartTime+missed", realtime: false, filters: "none" },
  { name: "usePsychology", fetches: "computed from journals+trades", realtime: false, filters: "none" },
];

const AI_PARSERS = [
  { name: "parseSheetWithAI", input: "Sheet rows", output: "ParsedTrade[]", tokens: "16K", model: "Sonnet" },
  { name: "parseSheetComprehensive", input: "Sheet rows", output: "7 data types", tokens: "16K", model: "Sonnet" },
  { name: "parseSheetJournalsOnly", input: "Sheet rows", output: "Journals + Trade updates", tokens: "8K", model: "Sonnet" },
  { name: "parseProfileWithAI", input: "CSV text", output: "Profile psychology", tokens: "8K", model: "Sonnet" },
  { name: "computeInsights", input: "Trade[]", output: "4 AI insights", tokens: "—", model: "Client-side" },
  { name: "computeRiskAnalysis", input: "Trade[]", output: "Monte Carlo results", tokens: "—", model: "Client-side (1000 sims)" },
  { name: "computeJournalPatterns", input: "Journal[]", output: "Keyword correlations", tokens: "—", model: "Client-side" },
];

const CHARTS = [
  { name: "PnlAreaChart", type: "Area", data: "Cumulative P/L over time" },
  { name: "WinLossPieChart", type: "Pie", data: "Win / Loss / BE distribution" },
  { name: "AccountPnlBarChart", type: "Bar", data: "P/L per account per period" },
  { name: "WinRateLineChart", type: "Line", data: "Win rate trend over weeks" },
  { name: "SessionBarChart", type: "Bar", data: "Pips per trading session" },
  { name: "DayOfWeekBarChart", type: "Bar", data: "Trades per day of week" },
  { name: "AccountBalanceLineChart", type: "Line", data: "Account growth curves" },
  { name: "EmotionTimelineChart", type: "Line", data: "Before/During/After emotions" },
  { name: "SkillRadarChart", type: "Radar", data: "Trait scores (6 dimensions)" },
  { name: "DisciplineRadarChart", type: "Radar", data: "5 discipline components" },
  { name: "ChartTimeBarChart", type: "Bar", data: "Daily chart time (minutes)" },
  { name: "CorrelationDualAxisChart", type: "Dual", data: "Chart time vs pips" },
  { name: "EffortScatterChart", type: "Scatter", data: "Effort rating vs results" },
];

// ─── Components ──────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children, id, defaultOpen = true }: {
  title: string; icon: React.ElementType; children: React.ReactNode; id: string; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section id={id} className="mb-8">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-3 w-full text-left group mb-4">
        {open ? <ChevronDown size={18} className="text-brand" /> : <ChevronRight size={18} className="text-brand" />}
        <Icon size={20} className="text-brand" />
        <h2 className="text-lg font-bold text-gray-900 group-hover:text-brand transition-colors">{title}</h2>
      </button>
      {open && <div className="ml-10">{children}</div>}
    </section>
  );
}

function FlowArrow({ label, vertical }: { label?: string; vertical?: boolean }) {
  if (vertical) return (
    <div className="flex flex-col items-center gap-0.5 py-1">
      <ArrowDown size={16} className="text-brand/60" />
      {label && <span className="text-[9px] text-gray-400">{label}</span>}
    </div>
  );
  return (
    <div className="flex items-center gap-1 px-1 shrink-0">
      <ArrowRight size={14} className="text-brand/60" />
      {label && <span className="text-[9px] text-gray-400 whitespace-nowrap">{label}</span>}
    </div>
  );
}

function Chip({ children, color = "#e98e97" }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{ background: color + "18", color, border: `1px solid ${color}33` }}
    >
      {children}
    </span>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function BlueprintPage() {
  const [activeNav, setActiveNav] = useState("overview");

  const navItems = [
    { id: "overview", label: "Overview" },
    { id: "data-flow", label: "Data Flow" },
    { id: "database", label: "Database" },
    { id: "api-routes", label: "API Routes" },
    { id: "pages", label: "Pages" },
    { id: "hooks", label: "Hooks" },
    { id: "ai-parsers", label: "AI Parsers" },
    { id: "charts", label: "Charts" },
    { id: "auth", label: "Auth" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl border border-brand-light/40 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">System Blueprint</h1>
        <p className="text-sm text-gray-500">Visual map of every process, data flow, and component in Traderess Copilot</p>

        {/* Quick nav */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setActiveNav(item.id)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                activeNav === item.id
                  ? "bg-brand/10 border-brand text-brand font-medium"
                  : "bg-white/60 border-brand-light/30 text-gray-500 hover:border-brand/40"
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>

      {/* ── Section 1: High-Level Overview ── */}
      <Section title="High-Level Architecture" icon={Layers} id="overview">
        <div className="glass rounded-xl border border-brand-light/40 p-6 space-y-6">
          {/* 3 external systems */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border-2 border-dashed border-brand/30 p-4 text-center bg-brand/5">
              <Globe size={28} className="mx-auto text-brand mb-2" />
              <p className="text-sm font-semibold text-gray-900">Google Sheets</p>
              <p className="text-[10px] text-gray-500 mt-1">Student trading trackers<br/>Messy layouts, different formats</p>
            </div>
            <div className="rounded-xl border-2 border-dashed border-purple-400/30 p-4 text-center bg-purple-50/50">
              <Brain size={28} className="mx-auto text-purple-500 mb-2" />
              <p className="text-sm font-semibold text-gray-900">Claude AI (Sonnet)</p>
              <p className="text-[10px] text-gray-500 mt-1">5 AI parsers + briefing generator<br/>Flexible column detection</p>
            </div>
            <div className="rounded-xl border-2 border-dashed border-emerald-400/30 p-4 text-center bg-emerald-50/50">
              <Database size={28} className="mx-auto text-emerald-500 mb-2" />
              <p className="text-sm font-semibold text-gray-900">Supabase</p>
              <p className="text-[10px] text-gray-500 mt-1">14 tables, RLS, Realtime<br/>PostgreSQL + Auth</p>
            </div>
          </div>

          <FlowArrow vertical label="Data flows through Next.js API routes" />

          {/* App layer */}
          <div className="rounded-xl border border-brand-light/40 bg-white/60 p-4">
            <div className="text-center mb-3">
              <p className="text-xs font-semibold text-brand uppercase tracking-wider">Next.js 16 App</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {["API Routes (5)", "Pages (7)", "Hooks (13)", "Charts (13)"].map((item) => (
                <div key={item} className="text-center py-2 px-3 bg-brand/5 rounded-lg border border-brand-light/30">
                  <p className="text-xs font-medium text-gray-700">{item}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {["AI Parsers (4)", "Compute Engines (3)", "Components (37)", "UI Kit (12)"].map((item) => (
                <div key={item} className="text-center py-2 px-3 bg-brand/5 rounded-lg border border-brand-light/30">
                  <p className="text-xs font-medium text-gray-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <FlowArrow vertical label="Rendered in browser" />

          {/* User */}
          <div className="rounded-xl border-2 border-dashed border-gray-300 p-4 text-center bg-gray-50/50">
            <Users size={28} className="mx-auto text-gray-500 mb-2" />
            <p className="text-sm font-semibold text-gray-900">Students & Coaches</p>
            <p className="text-[10px] text-gray-500 mt-1">Multi-student support, different tracker formats<br/>Realtime updates on data sync</p>
          </div>
        </div>
      </Section>

      {/* ── Section 2: Data Flow ── */}
      <Section title="Data Flow Pipelines" icon={Activity} id="data-flow">
        <div className="space-y-4">
          {/* Pipeline 1: Trade Sync */}
          <div className="glass rounded-xl border border-brand-light/40 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center"><span className="text-xs font-bold text-brand">1</span></div>
              Trade Sync Pipeline
            </h3>
            <div className="flex flex-wrap items-center gap-1">
              <Chip color="#10b981">Google Sheet</Chip>
              <FlowArrow label="fetch rows" />
              <Chip color="#8b5cf6">Claude AI</Chip>
              <FlowArrow label="parse trades" />
              <Chip color="#e98e97">trade_log</Chip>
              <FlowArrow label="realtime" />
              <Chip color="#3b82f6">Dashboard + Performance</Chip>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Deduplicates by date range (DELETE + INSERT). Custom fields captured in JSONB. ~30-60 seconds.</p>
          </div>

          {/* Pipeline 2: Journal Sync */}
          <div className="glass rounded-xl border border-brand-light/40 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center"><span className="text-xs font-bold text-brand">2</span></div>
              Journal Sync Pipeline
            </h3>
            <div className="flex flex-wrap items-center gap-1">
              <Chip color="#10b981">Google Sheet</Chip>
              <FlowArrow label="fetch rows" />
              <Chip color="#8b5cf6">Claude AI</Chip>
              <FlowArrow label="parse journals" />
              <Chip color="#7d0e3b">daily_journals</Chip>
              <FlowArrow label="match" />
              <Chip color="#e98e97">trade_log (update evaluations)</Chip>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Matches evaluations to existing trades by date + pair + direction + closest entry price. ~1-2 minutes.</p>
          </div>

          {/* Pipeline 3: Full Sync */}
          <div className="glass rounded-xl border border-brand-light/40 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center"><span className="text-xs font-bold text-brand">3</span></div>
              Full Sync Pipeline
            </h3>
            <div className="flex flex-wrap items-center gap-1 mb-2">
              <Chip color="#10b981">Google Sheet</Chip>
              <FlowArrow label="all rows" />
              <Chip color="#8b5cf6">Claude AI (16K tokens)</Chip>
              <FlowArrow label="7 data types" />
              <Chip color="#64748b">Promise.all()</Chip>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 ml-4">
              {["trade_log", "daily_journals", "chart_time_log", "account_balances", "missed_trades", "trading_goals", "weekly_summaries"].map((t) => (
                <span key={t} className="text-[10px] px-2 py-1 bg-brand/5 rounded border border-brand-light/30 text-gray-600">{t}</span>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Single AI pass extracts everything. All DB writes run in parallel. ~2-5 minutes.</p>
          </div>

          {/* Pipeline 4: Briefing */}
          <div className="glass rounded-xl border border-brand-light/40 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center"><span className="text-xs font-bold text-brand">4</span></div>
              Weekly Briefing Pipeline
            </h3>
            <div className="flex flex-wrap items-center gap-1">
              <Chip color="#e98e97">trade_log</Chip>
              <span className="text-[10px] text-gray-400">+</span>
              <Chip color="#7d0e3b">daily_journals</Chip>
              <span className="text-[10px] text-gray-400">+</span>
              <Chip color="#ec4899">trader_profiles</Chip>
              <span className="text-[10px] text-gray-400">+</span>
              <Chip color="#f59e0b">prev briefing</Chip>
              <FlowArrow label="Claude AI" />
              <Chip color="#8b5cf6">weekly_briefings</Chip>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Reads actual trades + emotions, references student psychology, maintains week-to-week continuity.</p>
          </div>

          {/* Pipeline 5: Profile Analysis */}
          <div className="glass rounded-xl border border-brand-light/40 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center"><span className="text-xs font-bold text-brand">5</span></div>
              Profile Analysis Pipeline
            </h3>
            <div className="flex flex-wrap items-center gap-1">
              <Chip color="#e98e97">4 weeks trades</Chip>
              <span className="text-[10px] text-gray-400">+</span>
              <Chip color="#7d0e3b">4 weeks journals</Chip>
              <FlowArrow label="Claude AI" />
              <Chip color="#ec4899">Updated scores, SPACE, radar</Chip>
              <FlowArrow label="save" />
              <Chip color="#ec4899">trader_profiles</Chip>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Returns old vs new scores for before/after comparison. Evidence-based updates.</p>
          </div>

          {/* Pipeline 6: Client-side Compute */}
          <div className="glass rounded-xl border border-brand-light/40 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center"><span className="text-xs font-bold text-brand">6</span></div>
              Client-Side Compute (no API call)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white/60 rounded-lg p-3 border border-brand-light/30">
                <p className="text-xs font-semibold text-gray-700">computeInsights()</p>
                <p className="text-[10px] text-gray-400 mt-1">Trade[] &rarr; 4 AI insights<br/>(day analysis, sessions, streaks, R:R)</p>
              </div>
              <div className="bg-white/60 rounded-lg p-3 border border-brand-light/30">
                <p className="text-xs font-semibold text-gray-700">computeRiskAnalysis()</p>
                <p className="text-[10px] text-gray-400 mt-1">Trade[] &rarr; Monte Carlo<br/>(1000 sims x 100 trades each)</p>
              </div>
              <div className="bg-white/60 rounded-lg p-3 border border-brand-light/30">
                <p className="text-xs font-semibold text-gray-700">computeJournalPatterns()</p>
                <p className="text-[10px] text-gray-400 mt-1">Journal[] &rarr; keyword correlations<br/>(15 emotional keywords vs pips)</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Section 3: Database ── */}
      <Section title="Database Schema (14 Tables)" icon={Database} id="database">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DB_TABLES.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.name} className="glass rounded-xl border border-brand-light/40 p-3 hover:border-brand/40 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: t.color + "15" }}>
                    <Icon size={14} style={{ color: t.color }} />
                  </div>
                  <code className="text-xs font-semibold text-gray-900">{t.name}</code>
                </div>
                <p className="text-[10px] text-gray-500 font-medium">{t.desc}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{t.fields}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-4 glass rounded-xl border border-brand-light/40 p-4">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Key Database Features</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-gray-500">
            <div className="flex items-start gap-2"><CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" /> Row-Level Security (RLS) — each user sees only their own data</div>
            <div className="flex items-start gap-2"><CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" /> JSONB columns — custom_fields, category_ratings, risk_plan for flexibility</div>
            <div className="flex items-start gap-2"><CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" /> Upsert with ON CONFLICT — safe re-sync without duplicates</div>
            <div className="flex items-start gap-2"><CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" /> Realtime subscriptions — trade_log + daily_journals push updates to UI</div>
            <div className="flex items-start gap-2"><CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" /> Composite unique constraints — (user_id, journal_date), (user_id, account_name, week_start)</div>
            <div className="flex items-start gap-2"><CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" /> Auto timestamps — created_at with DEFAULT now()</div>
          </div>
        </div>
      </Section>

      {/* ── Section 4: API Routes ── */}
      <Section title="API Routes (5 Endpoints)" icon={Server} id="api-routes">
        <div className="space-y-3">
          {API_ROUTES.map((route) => (
            <div key={route.path} className="glass rounded-xl border border-brand-light/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-brand/10 text-brand font-mono font-bold">{route.method}</span>
                <code className="text-xs font-semibold text-gray-900">{route.path}</code>
                <span className="text-[10px] text-gray-400 ml-auto">{route.label}</span>
              </div>
              <p className="text-[10px] text-gray-500 mb-2">{route.desc}</p>
              <div className="flex flex-wrap gap-2">
                {route.modes.map((m) => (
                  <div key={m.name} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-brand-light/30 bg-white/60">
                    <span className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                    <span className="text-[10px] font-medium text-gray-700">{m.name}</span>
                    <span className="text-[9px] text-gray-400">{m.time}</span>
                    {m.tables.length > 0 && (
                      <>
                        <ArrowRight size={10} className="text-gray-300" />
                        <span className="text-[9px] text-gray-400">{m.tables.join(", ")}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Section 5: Pages ── */}
      <Section title="Pages (7 Protected + 4 Public)" icon={Monitor} id="pages">
        <div className="space-y-3">
          {PAGES.map((page) => {
            const Icon = page.icon;
            return (
              <div key={page.path} className="glass rounded-xl border border-brand-light/40 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: page.color + "15" }}>
                    <Icon size={16} style={{ color: page.color }} />
                  </div>
                  <div>
                    <code className="text-xs font-bold text-gray-900">{page.path}</code>
                    <p className="text-[10px] text-gray-500">{page.desc}</p>
                  </div>
                </div>
                <div className="ml-10 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[9px] text-gray-400 w-14 shrink-0">Reads:</span>
                    {page.reads.map((r) => (
                      <span key={r} className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded border border-emerald-200/50">{r}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[9px] text-gray-400 w-14 shrink-0">Computes:</span>
                    {page.computes.map((c) => (
                      <span key={c} className="text-[9px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded border border-purple-200/50">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          {/* Public pages */}
          <div className="glass rounded-xl border border-brand-light/40 p-4">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Public Pages (no auth required)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { path: "/", desc: "Landing page — features, testimonials, CTA" },
                { path: "/login", desc: "Email + password sign in" },
                { path: "/register", desc: "New account sign up" },
                { path: "/onboarding", desc: "4-step setup wizard" },
              ].map((p) => (
                <div key={p.path} className="p-2 bg-white/60 rounded-lg border border-brand-light/30">
                  <code className="text-[10px] font-bold text-gray-700">{p.path}</code>
                  <p className="text-[9px] text-gray-400 mt-0.5">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Section 6: Hooks ── */}
      <Section title="Data Hooks (13)" icon={RefreshCw} id="hooks">
        <div className="glass rounded-xl border border-brand-light/40 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-brand-light/40 bg-white/40">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Hook</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Fetches</th>
                <th className="text-center py-2 px-3 text-gray-500 font-medium">Realtime</th>
                <th className="text-center py-2 px-3 text-gray-500 font-medium">Filtered</th>
              </tr>
            </thead>
            <tbody>
              {HOOKS.map((h) => (
                <tr key={h.name} className="border-b border-brand-light/20 last:border-0">
                  <td className="py-1.5 px-3 font-mono text-[10px] text-brand font-semibold">{h.name}()</td>
                  <td className="py-1.5 px-3 text-[10px] text-gray-600">{h.fetches}</td>
                  <td className="py-1.5 px-3 text-center">
                    {h.realtime
                      ? <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">live</span>
                      : <span className="text-[9px] text-gray-300">—</span>}
                  </td>
                  <td className="py-1.5 px-3 text-center">
                    {h.filters !== "none"
                      ? <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full">{h.filters}</span>
                      : <span className="text-[9px] text-gray-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── Section 7: AI Parsers ── */}
      <Section title="AI Parsers & Compute Engines (7)" icon={Brain} id="ai-parsers">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AI_PARSERS.map((p) => (
            <div key={p.name} className="glass rounded-xl border border-brand-light/40 p-3">
              <div className="flex items-center justify-between mb-1">
                <code className="text-[10px] font-bold text-gray-900">{p.name}()</code>
                <Chip color={p.model === "Client-side" || p.model.includes("Client") ? "#10b981" : "#8b5cf6"}>{p.model}</Chip>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-gray-500">
                <span className="text-gray-400">{p.input}</span>
                <ArrowRight size={10} className="text-brand/50" />
                <span className="font-medium text-gray-700">{p.output}</span>
              </div>
              {p.tokens !== "—" && (
                <p className="text-[9px] text-gray-400 mt-1">max_tokens: {p.tokens}</p>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* ── Section 8: Charts ── */}
      <Section title="Chart Components (13)" icon={PieChart} id="charts">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {CHARTS.map((c) => (
            <div key={c.name} className="flex items-center gap-2 p-2.5 bg-white/60 rounded-lg border border-brand-light/30">
              <LineChart size={14} className="text-brand shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-gray-700">{c.name}</p>
                <p className="text-[9px] text-gray-400">{c.type} — {c.data}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-2">All charts lazy-loaded via dynamic imports (code-split). SSR disabled. Powered by Recharts.</p>
      </Section>

      {/* ── Section 9: Auth Flow ── */}
      <Section title="Auth & Middleware" icon={Shield} id="auth">
        <div className="glass rounded-xl border border-brand-light/40 p-5 space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Request Flow (every page load)</h4>
            <div className="flex flex-wrap items-center gap-1">
              <Chip color="#64748b">Browser Request</Chip>
              <FlowArrow label="proxy.ts" />
              <Chip color="#f59e0b">Refresh Session</Chip>
              <FlowArrow label="check user" />
              <Chip color="#10b981">Route Guard</Chip>
              <FlowArrow />
              <Chip color="#3b82f6">Page or Redirect</Chip>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
            <div className="p-3 bg-white/60 rounded-lg border border-brand-light/30">
              <p className="font-semibold text-gray-700 mb-1">Public Routes</p>
              <p className="text-gray-400"><code>/</code> <code>/login</code> <code>/register</code> <code>/auth/*</code></p>
              <p className="text-gray-400 mt-1">Authenticated users on public routes &rarr; redirect to /dashboard</p>
            </div>
            <div className="p-3 bg-white/60 rounded-lg border border-brand-light/30">
              <p className="font-semibold text-gray-700 mb-1">Protected Routes</p>
              <p className="text-gray-400">Everything else under <code>/(app)/*</code></p>
              <p className="text-gray-400 mt-1">No session &rarr; redirect to /login</p>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Environment Variables</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[10px]">
              {[
                { key: "NEXT_PUBLIC_SUPABASE_URL", desc: "Supabase project URL" },
                { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", desc: "Supabase anon key" },
                { key: "ANTHROPIC_API_KEY", desc: "Claude AI (server-side only)" },
                { key: "GOOGLE_SHEETS_API_KEY", desc: "Google Sheets API (optional)" },
              ].map((v) => (
                <div key={v.key} className="flex items-center gap-2 p-1.5 bg-gray-50 rounded border border-gray-200/50">
                  <code className="text-brand font-bold">{v.key}</code>
                  <span className="text-gray-400 font-sans">{v.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Footer */}
      <div className="text-center text-[10px] text-gray-300 pb-8">
        Traderess Copilot Blueprint — auto-generated from codebase analysis
      </div>
    </div>
  );
}
