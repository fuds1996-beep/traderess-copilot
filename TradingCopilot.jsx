import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import {
  LayoutDashboard, User, TrendingUp, Newspaper, Cog, Play, ChevronRight,
  Calendar, Clock, AlertTriangle, CheckCircle, XCircle, Target, Brain,
  Shield, Zap, BookOpen, ArrowUp, ArrowDown, Minus, Sun, Moon, LogOut,
  Bell, Search, Filter, Download, Upload, RefreshCw, ChevronDown, Eye,
  BarChart3, Activity, Award, Flame, Lightbulb, AlertCircle, Globe,
  FileText, Settings, Workflow, Bot, Sparkles, TrendingDown, DollarSign,
  Percent, Hash, Timer, MapPin, ChevronLeft
} from "lucide-react";

// ─── MOCK DATA ───────────────────────────────────────────────────────────────

const PERFORMANCE_WEEKLY = [
  { week: "Jan 5-9", pnl: 320, trades: 6, winRate: 66.7, rValue: 2.1 },
  { week: "Jan 19-23", pnl: -180, trades: 4, winRate: 25, rValue: -1.4 },
  { week: "Feb 2-6", pnl: 540, trades: 7, winRate: 71.4, rValue: 3.2 },
  { week: "Feb 9-13", pnl: 210, trades: 5, winRate: 60, rValue: 1.8 },
  { week: "Feb 18-20", pnl: -90, trades: 3, winRate: 33.3, rValue: -0.6 },
  { week: "Feb 23-27", pnl: 670, trades: 8, winRate: 75, rValue: 4.1 },
  { week: "Mar 2-6", pnl: 430, trades: 6, winRate: 83.3, rValue: 3.5 },
  { week: "Mar 9-13", pnl: 280, trades: 5, winRate: 80, rValue: 2.4 },
];

const SESSION_DATA = [
  { session: "London Open", trades: 20, winRate: 72, pips: 186 },
  { session: "NY Open", trades: 12, winRate: 58, pips: 67 },
  { session: "London Close", trades: 8, winRate: 62, pips: 42 },
  { session: "Asian", trades: 5, winRate: 40, pips: -18 },
  { session: "Overlap", trades: 4, winRate: 75, pips: 31 },
];

const DAY_DATA = [
  { day: "Mon", trades: 8, winRate: 62 },
  { day: "Tue", trades: 14, winRate: 71 },
  { day: "Wed", trades: 9, winRate: 55 },
  { day: "Thu", trades: 10, winRate: 70 },
  { day: "Fri", trades: 8, winRate: 75 },
];

const RADAR_DATA = [
  { trait: "Patience", value: 72, fullMark: 100 },
  { trait: "Discipline", value: 65, fullMark: 100 },
  { trait: "Risk Mgmt", value: 78, fullMark: 100 },
  { trait: "Fundamentals", value: 45, fullMark: 100 },
  { trait: "Technical", value: 82, fullMark: 100 },
  { trait: "Psychology", value: 58, fullMark: 100 },
];

const CALENDAR_EVENTS = [
  { day: "Mon", time: "09:00", event: "German Manufacturing PMI", impact: "medium", currency: "EUR" },
  { day: "Mon", time: "14:30", event: "US Existing Home Sales", impact: "low", currency: "USD" },
  { day: "Tue", time: "10:00", event: "ZEW Economic Sentiment", impact: "high", currency: "EUR" },
  { day: "Tue", time: "14:30", event: "US Retail Sales", impact: "high", currency: "USD" },
  { day: "Wed", time: "10:00", event: "Eurozone CPI (Final)", impact: "high", currency: "EUR" },
  { day: "Wed", time: "15:15", event: "ECB Rate Decision", impact: "high", currency: "EUR" },
  { day: "Wed", time: "19:00", event: "FOMC Rate Decision", impact: "high", currency: "USD" },
  { day: "Thu", time: "13:30", event: "US Jobless Claims", impact: "medium", currency: "USD" },
  { day: "Thu", time: "15:00", event: "US Existing Home Sales", impact: "medium", currency: "USD" },
  { day: "Fri", time: "09:30", event: "German Flash PMI", impact: "high", currency: "EUR" },
  { day: "Fri", time: "14:30", event: "US Flash PMI", impact: "medium", currency: "USD" },
];

const TRADE_LOG = [
  { id: 1, date: "Mar 10", pair: "EUR/USD", direction: "Long", entry: 1.0842, sl: 1.0822, tp: 1.0882, result: "Win", pips: 40, rr: "2:1", session: "London", notes: "Clean level bounce, patient entry" },
  { id: 2, date: "Mar 10", pair: "EUR/USD", direction: "Short", entry: 1.0891, sl: 1.0911, tp: 1.0851, result: "Win", pips: 40, rr: "2:1", session: "NY", notes: "Session high rejection" },
  { id: 3, date: "Mar 11", pair: "EUR/USD", direction: "Long", entry: 1.0835, sl: 1.0815, tp: 1.0875, result: "Loss", pips: -20, rr: "-1:1", session: "London", notes: "Entered during news — mistake" },
  { id: 4, date: "Mar 12", pair: "EUR/USD", direction: "Short", entry: 1.0870, sl: 1.0890, tp: 1.0830, result: "Win", pips: 40, rr: "2:1", session: "London", notes: "Ladder risk, clean setup" },
  { id: 5, date: "Mar 13", pair: "EUR/USD", direction: "Long", entry: 1.0810, sl: 1.0790, tp: 1.0850, result: "Win", pips: 40, rr: "2:1", session: "London", notes: "Weekly low test, confluence setup" },
];

const ARTICLES_EURUSD = [
  { source: "FX Street", title: "EUR/USD drops below 1.0850 as Middle East tensions boost USD", time: "2h ago", sentiment: "bearish" },
  { source: "FX Street", title: "Rabobank cuts EUR/USD 1-month forecast to 1.04", time: "5h ago", sentiment: "bearish" },
  { source: "FX Street", title: "ECB's Lagarde signals caution on rate path amid geopolitical risks", time: "8h ago", sentiment: "neutral" },
  { source: "Reuters", title: "ING: Peripheral Euro sovereign spreads widening — fiscal stress building", time: "12h ago", sentiment: "bearish" },
  { source: "FX Street", title: "EUR/USD technical: 200-SMA holds as dynamic support at 1.0780", time: "1d ago", sentiment: "neutral" },
];

const ARTICLES_DXY = [
  { source: "FX Street", title: "US Dollar Index hits 10-month high on safe-haven flows", time: "1h ago", sentiment: "bullish" },
  { source: "Reuters", title: "Fed rate cut expectations slashed: 50bps to just 25bps this year", time: "4h ago", sentiment: "bullish" },
  { source: "FX Street", title: "Energy shock: Every $10 oil rise adds 0.2% to US inflation", time: "6h ago", sentiment: "bullish" },
  { source: "FX Street", title: "DXY technical: Overbought but fundamentally supported above 106", time: "10h ago", sentiment: "neutral" },
];

const COLORS = {
  primary: "#6366f1",
  secondary: "#8b5cf6",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
  muted: "#64748b",
};
const PIE_COLORS = ["#10b981", "#ef4444", "#f59e0b"];

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = "text-indigo-400", bg = "bg-slate-800" }) {
  return (
    <div className={`${bg} rounded-xl p-4 border border-slate-700`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className={color} />
        <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

function Badge({ children, variant = "default" }) {
  const styles = {
    default: "bg-slate-700 text-slate-300",
    success: "bg-emerald-900/50 text-emerald-400 border border-emerald-800",
    danger: "bg-red-900/50 text-red-400 border border-red-800",
    warning: "bg-amber-900/50 text-amber-400 border border-amber-800",
    info: "bg-blue-900/50 text-blue-400 border border-blue-800",
    high: "bg-red-900/60 text-red-300",
    medium: "bg-amber-900/60 text-amber-300",
    low: "bg-slate-700 text-slate-400",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[variant] || styles.default}`}>{children}</span>;
}

function ProgressBar({ value, max = 100, color = "bg-indigo-500" }) {
  return (
    <div className="w-full bg-slate-700 rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
    </div>
  );
}

function SentimentDot({ sentiment }) {
  const c = sentiment === "bullish" ? "bg-emerald-400" : sentiment === "bearish" ? "bg-red-400" : "bg-amber-400";
  return <span className={`inline-block w-2 h-2 rounded-full ${c}`} />;
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

function Sidebar({ active, setActive, collapsed, setCollapsed }) {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "profile", label: "Trader Profile", icon: User },
    { id: "performance", label: "Performance", icon: TrendingUp },
    { id: "briefing", label: "Weekly Briefing", icon: Newspaper },
    { id: "workflow", label: "Copilot Workflow", icon: Workflow },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className={`${collapsed ? "w-16" : "w-60"} bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-200 shrink-0`}>
      <div className="p-4 flex items-center gap-3 border-b border-slate-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight">Traderess</div>
              <div className="text-[10px] text-indigo-400 font-medium">COPILOT</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center mx-auto">
            <Zap size={18} className="text-white" />
          </div>
        )}
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
              active === item.id
                ? "bg-indigo-600/20 text-indigo-400 font-medium"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <item.icon size={18} />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-800">
        <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors">
          {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /><span>Collapse</span></>}
        </button>
      </div>
    </div>
  );
}

// ─── DASHBOARD PAGE ──────────────────────────────────────────────────────────

function DashboardPage() {
  const totalPnl = PERFORMANCE_WEEKLY.reduce((s, w) => s + w.pnl, 0);
  const totalTrades = PERFORMANCE_WEEKLY.reduce((s, w) => s + w.trades, 0);
  const avgWinRate = (PERFORMANCE_WEEKLY.reduce((s, w) => s + w.winRate, 0) / PERFORMANCE_WEEKLY.length).toFixed(1);
  const cumPnl = PERFORMANCE_WEEKLY.reduce((acc, w, i) => {
    acc.push({ week: w.week.split(" ")[0], pnl: (acc[i - 1]?.pnl || 0) + w.pnl });
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Your trading copilot overview — for educational and demo purposes</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500 transition-colors">
            <Play size={14} /> Run Briefing
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Cumulative P/L" value={`$${totalPnl.toLocaleString()}`} sub="Jan–Mar 2026" color="text-emerald-400" />
        <StatCard icon={Hash} label="Total Trades" value={totalTrades} sub="49 across 8 weeks" color="text-blue-400" />
        <StatCard icon={Percent} label="Avg Win Rate" value={`${avgWinRate}%`} sub="Target: 65%+" color="text-amber-400" />
        <StatCard icon={Target} label="Accounts Active" value="3" sub="10K funded, 50K verif, 10K challenge" color="text-purple-400" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4">Cumulative P/L Curve</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={cumPnl}>
              <defs>
                <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="pnl" stroke="#6366f1" fill="url(#pnlGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4">Win / Loss / BE</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={[{ name: "Wins", value: 34 }, { name: "Losses", value: 12 }, { name: "BE", value: 3 }]} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                {PIE_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 34 Wins</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> 12 Losses</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> 3 BE</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-3">This Week's High Impact Events</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {CALENDAR_EVENTS.filter(e => e.impact === "high").map((e, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-700/50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-8">{e.day}</span>
                  <span className="text-xs text-slate-400 w-12">{e.time}</span>
                  <span className="text-sm text-slate-200">{e.event}</span>
                </div>
                <Badge variant="high">{e.currency}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-3">Copilot Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Newspaper, label: "Run Daily Briefing", desc: "Fetch latest fundamentals" },
              { icon: Brain, label: "Psychology Check", desc: "Pre-session mindset review" },
              { icon: BarChart3, label: "Update Performance", desc: "Sync this week's data" },
              { icon: Target, label: "Weekly Plan", desc: "Map the week ahead" },
            ].map((a, i) => (
              <button key={i} className="flex flex-col items-start p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors text-left">
                <a.icon size={16} className="text-indigo-400 mb-1.5" />
                <span className="text-xs font-medium text-white">{a.label}</span>
                <span className="text-[10px] text-slate-500">{a.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TRADER PROFILE PAGE ─────────────────────────────────────────────────────

function ProfilePage() {
  const [tab, setTab] = useState("overview");

  const strengths = [
    { label: "Self-awareness & journaling quality", score: 85 },
    { label: "Discipline to avoid unclear setups", score: 78 },
    { label: "Screen recording as execution anchor", score: 72 },
    { label: "Growing patience with entries", score: 70 },
    { label: "Emotional recovery capacity", score: 68 },
  ];

  const weaknesses = [
    { label: "Multi-account scaling under pressure", score: 82 },
    { label: "Trading while impaired / inappropriate conditions", score: 75 },
    { label: "Goal-driven urgency overriding discipline", score: 70 },
    { label: "RSI-only entries without full confirmation", score: 65 },
    { label: "Overnight trade management gaps", score: 58 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Trader Profile</h1>
        <p className="text-sm text-slate-400 mt-1">Your comprehensive trading identity — built from your data</p>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shrink-0">M</div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-white">Marlena</h2>
              <Badge variant="info">Stage 2</Badge>
              <Badge variant="success">Funded</Badge>
            </div>
            <p className="text-sm text-slate-400 mb-3">EUR/USD level-based trader — London session specialist — Ladder risk management</p>
            <div className="grid grid-cols-4 gap-4">
              <div><span className="text-xs text-slate-500">Tracking Since</span><div className="text-sm font-semibold text-white">Jan 2026</div></div>
              <div><span className="text-xs text-slate-500">Trading Plan</span><div className="text-sm font-semibold text-white">EUR/USD + DXY</div></div>
              <div><span className="text-xs text-slate-500">Session Focus</span><div className="text-sm font-semibold text-white">London Open</div></div>
              <div><span className="text-xs text-slate-500">Risk Model</span><div className="text-sm font-semibold text-white">Ladder (0.5–1.5%)</div></div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-700 pb-0">
        {["overview", "psychology", "plan"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={16} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Strengths</h3>
            </div>
            <div className="space-y-3">
              {strengths.map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">{s.label}</span>
                    <span className="text-emerald-400">{s.score}%</span>
                  </div>
                  <ProgressBar value={s.score} color="bg-emerald-500" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Weaknesses</h3>
            </div>
            <div className="space-y-3">
              {weaknesses.map((w, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">{w.label}</span>
                    <span className="text-red-400">{w.score}%</span>
                  </div>
                  <ProgressBar value={w.score} color="bg-red-500" />
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-2 bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-4">Trading Skill Radar</h3>
            <div className="flex justify-center">
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={RADAR_DATA}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="trait" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} />
                  <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === "psychology" && (
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-3">SPACE Method Assessment</h3>
            <div className="grid grid-cols-5 gap-3">
              {[
                { letter: "S", word: "Sleep", status: "good", note: "Consistent 7-8hrs, but drops after wine evenings" },
                { letter: "P", word: "Psychology", status: "warning", note: "Perfectionism and mood-driven productivity tendencies" },
                { letter: "A", word: "Activity", status: "good", note: "Regular gym routine, maintains energy" },
                { letter: "C", word: "Consumption", status: "warning", note: "Weekend wine trade pattern identified twice" },
                { letter: "E", word: "Environment", status: "good", note: "Dedicated trading space, minimal distractions" },
              ].map((s, i) => (
                <div key={i} className={`p-4 rounded-lg border ${s.status === "good" ? "bg-emerald-900/20 border-emerald-800/50" : "bg-amber-900/20 border-amber-800/50"}`}>
                  <div className={`text-2xl font-bold mb-1 ${s.status === "good" ? "text-emerald-400" : "text-amber-400"}`}>{s.letter}</div>
                  <div className="text-xs font-medium text-white mb-1">{s.word}</div>
                  <div className="text-[10px] text-slate-400 leading-relaxed">{s.note}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-3">Behavioural Pattern Matrix</h3>
            <div className="space-y-2">
              {[
                { pattern: "Wine Trade Pattern", frequency: "2x in last 6 weeks", trigger: "Sunday evening after wine, RSI alert → impulsive gap trade", severity: "high" },
                { pattern: "FOMO After Quiet Period", frequency: "3x in last 8 weeks", trigger: "3+ days without a trade → lowered entry standards", severity: "medium" },
                { pattern: "Multi-Account Scaling Pressure", frequency: "Ongoing", trigger: "Funded + verification running simultaneously → split focus", severity: "medium" },
                { pattern: "Goal-Driven Urgency", frequency: "Monthly", trigger: "End of month approaching targets → forced trades", severity: "high" },
              ].map((p, i) => (
                <div key={i} className="flex items-start gap-4 p-3 bg-slate-700/30 rounded-lg">
                  <AlertCircle size={16} className={p.severity === "high" ? "text-red-400 mt-0.5 shrink-0" : "text-amber-400 mt-0.5 shrink-0"} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{p.pattern}</span>
                      <Badge variant={p.severity === "high" ? "danger" : "warning"}>{p.severity}</Badge>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">Frequency: {p.frequency}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Trigger: {p.trigger}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "plan" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-3">Trading Plan Summary</h3>
            <div className="space-y-3 text-sm">
              {[
                { label: "Pairs", value: "EUR/USD primary, DXY as confluence" },
                { label: "Strategy", value: "Level-based trading with ladder risk" },
                { label: "Session", value: "London Open (07:00–13:00 CET)" },
                { label: "Risk per trade", value: "0.5% base, ladder to 1.5% max" },
                { label: "Max daily trades", value: "2–3 (1 preferred)" },
                { label: "TP model", value: "Session high/low targets" },
                { label: "SL model", value: "Candle low/high based" },
                { label: "Chart time minimum", value: "30 mins before first trade" },
              ].map((r, i) => (
                <div key={i} className="flex justify-between py-1.5 border-b border-slate-700/50 last:border-0">
                  <span className="text-slate-400">{r.label}</span>
                  <span className="text-white font-medium text-right">{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-3">Prop Firm Accounts</h3>
            <div className="space-y-3">
              {[
                { name: "10K Funded", status: "Active", progress: 68, pnl: "+$680" },
                { name: "50K Verification", status: "Active", progress: 42, pnl: "+$1,190" },
                { name: "10K Challenge", status: "Phase 1", progress: 25, pnl: "+$124" },
              ].map((a, i) => (
                <div key={i} className="p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-white">{a.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{a.status}</Badge>
                      <span className="text-xs text-emerald-400 font-medium">{a.pnl}</span>
                    </div>
                  </div>
                  <ProgressBar value={a.progress} color="bg-indigo-500" />
                  <span className="text-[10px] text-slate-500 mt-1 block">{a.progress}% to target</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PERFORMANCE PAGE ────────────────────────────────────────────────────────

function PerformancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Performance Analytics</h1>
        <p className="text-sm text-slate-400 mt-1">Detailed breakdown of your trading metrics — educational backtesting data</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Best Week" value="$670" sub="Feb 23–27 · 75% WR" color="text-emerald-400" />
        <StatCard icon={TrendingDown} label="Worst Week" value="-$180" sub="Jan 19–23 · 25% WR" color="text-red-400" />
        <StatCard icon={Award} label="Best Streak" value="5 Wins" sub="Mar 2–13 consecutive" color="text-amber-400" />
        <StatCard icon={Flame} label="Biggest Loss" value="-$520" sub="Phone trade from car" color="text-red-400" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4">Weekly P/L</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={PERFORMANCE_WEEKLY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#94a3b8" }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {PERFORMANCE_WEEKLY.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? "#10b981" : "#ef4444"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4">Win Rate Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={PERFORMANCE_WEEKLY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#94a3b8" }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="winRate" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 4 }} />
              <Line type="monotone" dataKey={() => 65} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={1} dot={false} name="Target" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4">Performance by Session</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={SESSION_DATA} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis dataKey="session" type="category" tick={{ fontSize: 11, fill: "#94a3b8" }} width={90} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="pips" radius={[0, 4, 4, 0]}>
                {SESSION_DATA.map((d, i) => <Cell key={i} fill={d.pips >= 0 ? "#6366f1" : "#ef4444"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4">Trades by Day of Week</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={DAY_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="trades" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-4">Recent Trade Log</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {["Date", "Pair", "Dir", "Entry", "SL", "TP", "Result", "Pips", "R:R", "Session", "Notes"].map((h) => (
                  <th key={h} className="text-left py-2 px-2 text-xs text-slate-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TRADE_LOG.map((t) => (
                <tr key={t.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="py-2 px-2 text-slate-300">{t.date}</td>
                  <td className="py-2 px-2 text-white font-medium">{t.pair}</td>
                  <td className="py-2 px-2">
                    <span className={`flex items-center gap-1 ${t.direction === "Long" ? "text-emerald-400" : "text-red-400"}`}>
                      {t.direction === "Long" ? <ArrowUp size={12} /> : <ArrowDown size={12} />}{t.direction}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-slate-300">{t.entry}</td>
                  <td className="py-2 px-2 text-red-400">{t.sl}</td>
                  <td className="py-2 px-2 text-emerald-400">{t.tp}</td>
                  <td className="py-2 px-2"><Badge variant={t.result === "Win" ? "success" : "danger"}>{t.result}</Badge></td>
                  <td className={`py-2 px-2 font-medium ${t.pips > 0 ? "text-emerald-400" : "text-red-400"}`}>{t.pips > 0 ? "+" : ""}{t.pips}</td>
                  <td className="py-2 px-2 text-slate-400">{t.rr}</td>
                  <td className="py-2 px-2 text-slate-400">{t.session}</td>
                  <td className="py-2 px-2 text-xs text-slate-500 max-w-[160px] truncate">{t.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── WEEKLY BRIEFING PAGE ────────────────────────────────────────────────────

function BriefingPage() {
  const [expanded, setExpanded] = useState({});
  const toggle = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Weekly Briefing</h1>
          <p className="text-sm text-slate-400 mt-1">Mar 16–20, 2026 — Prepared by Trading Copilot</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="warning">High Volatility Week</Badge>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-500 transition-colors">
            <RefreshCw size={12} /> Refresh Briefing
          </button>
        </div>
      </div>

      {/* Last week recap */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 rounded-xl p-5 border border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <Eye size={16} className="text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Your Week in Review (Mar 9–13)</h3>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-slate-900/50 rounded-lg">
            <div className="text-lg font-bold text-emerald-400">80%</div>
            <div className="text-[10px] text-slate-500">Win Rate</div>
          </div>
          <div className="text-center p-3 bg-slate-900/50 rounded-lg">
            <div className="text-lg font-bold text-white">5</div>
            <div className="text-[10px] text-slate-500">Trades Taken</div>
          </div>
          <div className="text-center p-3 bg-slate-900/50 rounded-lg">
            <div className="text-lg font-bold text-emerald-400">+$280</div>
            <div className="text-[10px] text-slate-500">Net P/L</div>
          </div>
          <div className="text-center p-3 bg-slate-900/50 rounded-lg">
            <div className="text-lg font-bold text-indigo-400">2.4R</div>
            <div className="text-[10px] text-slate-500">R-Value</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-emerald-900/20 rounded-lg border border-emerald-800/30">
            <div className="flex items-center gap-1.5 mb-1.5 text-emerald-400 font-medium text-xs"><CheckCircle size={12} /> What Went Well</div>
            <p className="text-xs text-slate-300 leading-relaxed">Tuesday and Thursday trades were textbook session high/low patient entries. Recovered from Sunday's loss within 48 hours. Avoided 2 sub-par setups that would have been losses — saving you money. Win rate 80% vs your 69% average.</p>
          </div>
          <div className="p-3 bg-amber-900/20 rounded-lg border border-amber-800/30">
            <div className="flex items-center gap-1.5 mb-1.5 text-amber-400 font-medium text-xs"><AlertTriangle size={12} /> Watch Out For</div>
            <p className="text-xs text-slate-300 leading-relaxed">The Sunday wine trade happened again — second consecutive weekend. Both times: home after wine → RSI alert → impulsive gap trade → immediate SL hit. Chart time at all-time low (3hrs) for 2nd week in a row.</p>
          </div>
        </div>
      </div>

      {/* Market Context */}
      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <button onClick={() => toggle("market")} className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Market Context & Fundamentals</h3>
          </div>
          <ChevronDown size={16} className={`text-slate-400 transition-transform ${expanded.market ? "rotate-180" : ""}`} />
        </button>
        {(expanded.market ?? true) && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-white">EUR/USD Analysis</span>
                  <SentimentDot sentiment="bearish" />
                  <span className="text-[10px] text-red-400">Bearish Bias</span>
                </div>
                <div className="space-y-1.5">
                  {ARTICLES_EURUSD.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-slate-700/30 rounded text-xs">
                      <SentimentDot sentiment={a.sentiment} />
                      <div className="flex-1">
                        <div className="text-slate-200">{a.title}</div>
                        <div className="text-slate-500 mt-0.5">{a.source} · {a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-white">DXY Analysis</span>
                  <SentimentDot sentiment="bullish" />
                  <span className="text-[10px] text-emerald-400">Bullish Bias</span>
                </div>
                <div className="space-y-1.5">
                  {ARTICLES_DXY.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-slate-700/30 rounded text-xs">
                      <SentimentDot sentiment={a.sentiment} />
                      <div className="flex-1">
                        <div className="text-slate-200">{a.title}</div>
                        <div className="text-slate-500 mt-0.5">{a.source} · {a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 bg-indigo-900/20 border border-indigo-800/30 rounded-lg">
              <div className="flex items-center gap-1.5 mb-1 text-indigo-400 font-medium text-xs"><Lightbulb size={12} /> Key Insight from Deep Research</div>
              <p className="text-xs text-slate-300 leading-relaxed">Rabobank cut their 1-month EUR/USD forecast to 1.04 (from 1.16). ING flagged peripheral Euro sovereign spreads widening (Greece-to-Germany). New calculation: every $10 oil rise adds 0.2% to US inflation — at $100/bbl that's 0.8% headline CPI. Fed rate cut expectations slashed from 50bps to just 25bps this year.</p>
            </div>
          </div>
        )}
      </div>

      {/* Economic Calendar */}
      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <button onClick={() => toggle("calendar")} className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Economic Calendar (CET Times)</h3>
          </div>
          <ChevronDown size={16} className={`text-slate-400 transition-transform ${expanded.calendar ? "rotate-180" : ""}`} />
        </button>
        {(expanded.calendar ?? true) && (
          <div className="mt-4">
            <div className="grid grid-cols-5 gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
                <div key={day} className="space-y-1.5">
                  <div className={`text-xs font-semibold text-center py-1 rounded ${day === "Wed" ? "bg-red-900/40 text-red-400" : "bg-slate-700 text-slate-300"}`}>
                    {day} {day === "Wed" && "⚠️"}
                  </div>
                  {CALENDAR_EVENTS.filter(e => e.day === day).map((e, i) => (
                    <div key={i} className={`p-2 rounded text-[10px] border ${
                      e.impact === "high" ? "bg-red-900/20 border-red-800/40" :
                      e.impact === "medium" ? "bg-amber-900/20 border-amber-800/40" :
                      "bg-slate-700/30 border-slate-600/40"
                    }`}>
                      <div className="text-slate-400">{e.time}</div>
                      <div className="text-slate-200 leading-tight mt-0.5">{e.event}</div>
                      <Badge variant={e.impact}>{e.impact}</Badge>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Copilot Guidance */}
      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Copilot Guidance for This Week</h3>
        </div>
        <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-red-400 text-xs font-semibold mb-1">
            <XCircle size={14} /> Hard No-Trade Zones
          </div>
          <p className="text-xs text-slate-300">No trading within 2 hours of FOMC (Wed 19:00 CET). No trading during or within 2 hours of ECB decision (Wed 15:15 CET). Single account only — this is not the week for multi-account scaling.</p>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[
            { day: "Mon", risk: "low", note: "07:00–13:00 safe. Before US data. Pre-storm setups may form.", color: "bg-emerald-900/20 border-emerald-800/30" },
            { day: "Tue", risk: "medium", note: "07:00–10:30 safe before ZEW. After 11:00 risky, especially 13:30.", color: "bg-amber-900/20 border-amber-800/30" },
            { day: "Wed", risk: "extreme", note: "DANGER. ECB + FOMC. Consider observation only. If must trade: before 10:30.", color: "bg-red-900/20 border-red-800/30" },
            { day: "Thu", risk: "high", note: "Post-FOMC volatility. Wait until after 16:00 for any setups.", color: "bg-red-900/20 border-red-800/30" },
            { day: "Fri", risk: "low", note: "Your best bet. Post-storm setups may form with clean levels.", color: "bg-emerald-900/20 border-emerald-800/30" },
          ].map((d, i) => (
            <div key={i} className={`p-3 rounded-lg border ${d.color}`}>
              <div className="text-xs font-bold text-white mb-0.5">{d.day}</div>
              <Badge variant={d.risk === "extreme" || d.risk === "high" ? "danger" : d.risk === "medium" ? "warning" : "success"}>{d.risk} risk</Badge>
              <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">{d.note}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-indigo-900/20 border border-indigo-800/30 rounded-lg">
          <p className="text-xs text-indigo-300 italic">"You're 11 weeks in with a funded account and a 50K verification running. Your win rate is 69.2% with positive R. The quiet market is testing your patience. If you feel the urge to trade during the storm — remember your best weeks had 1–2 trades. Patience IS the strategy."</p>
        </div>
      </div>

      {/* Daily Checklist */}
      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={16} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Daily Pre-Session Checklist</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            "Am I rested? Rate energy 1–10",
            "30 min chart time completed?",
            "Checked economic calendar for today?",
            "Session high/low levels marked?",
            "Max 1 account active today?",
            "No trades if energy < 6",
            "Full confirmation stack before entry?",
            "SL set before entry — no exceptions",
          ].map((item, i) => (
            <label key={i} className="flex items-center gap-2 p-2 bg-slate-700/30 rounded text-xs text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-colors">
              <input type="checkbox" className="accent-indigo-500 w-3.5 h-3.5" />
              {item}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── WORKFLOW PAGE ───────────────────────────────────────────────────────────

function WorkflowPage() {
  const steps = [
    {
      phase: "0A", title: "Extract Weekly Trading Data", icon: Upload,
      desc: "Navigate to Google Sheets tracker. Extract latest week's trading data via iframe. Update performance MD file.",
      agents: ["Performance File Updater", "Traders Profile Updater"],
      status: "ready"
    },
    {
      phase: "0B", title: "Verify Data Extraction", icon: Shield,
      desc: "Verification agent cross-checks extracted data against source spreadsheet.",
      agents: ["Verification Agent"],
      status: "ready"
    },
    {
      phase: "1", title: "Receive MyFXBook Calendar", icon: Calendar,
      desc: "Paste raw MyFXBook economic calendar for the upcoming week. Convert GMT+4 to CET. Parse high/medium impact events.",
      agents: [],
      status: "manual"
    },
    {
      phase: "2", title: "Extract FX Street Articles", icon: Newspaper,
      desc: "Navigate to EUR/USD and DXY pages on FX Street via Chrome extension. Extract top 7–8 article links from each.",
      agents: ["EUR/USD Article Reader", "DXY Article Reader"],
      status: "ready"
    },
    {
      phase: "3", title: "Deep Read Articles", icon: BookOpen,
      desc: "Open each article, read full text, extract key institutional insights — not just headlines.",
      agents: ["Agent 1: EUR/USD Reader", "Agent 2: DXY Reader"],
      status: "ready"
    },
    {
      phase: "4", title: "Verification Gate", icon: CheckCircle,
      desc: "Agent 3 cross-checks article summaries to confirm genuine deep-dive analysis, not headline scraping.",
      agents: ["Verification Agent"],
      status: "ready"
    },
    {
      phase: "5", title: "Simplification Pass", icon: Lightbulb,
      desc: "Agent 4 simplifies complex terminology. Keeps key terms but explains in plain English for gradual learning.",
      agents: ["Simplification Agent"],
      status: "ready"
    },
    {
      phase: "6", title: "Compile & Deliver Briefing", icon: FileText,
      desc: "Compile weekly briefing from all sources. Inject previous week's trading insights. Generate visual web page.",
      agents: ["Briefing Compiler"],
      status: "ready"
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Copilot Workflow</h1>
          <p className="text-sm text-slate-400 mt-1">The automation pipeline that powers your trading copilot</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 text-slate-300 text-xs rounded-lg hover:bg-slate-600 transition-colors">
            <Timer size={12} /> Schedule
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500 transition-colors">
            <Play size={14} /> Run Full Pipeline
          </button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-4">Pipeline Phases</h3>
        <div className="space-y-3">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  s.status === "manual" ? "bg-amber-900/30 border border-amber-800/50" : "bg-indigo-900/30 border border-indigo-800/50"
                }`}>
                  <s.icon size={18} className={s.status === "manual" ? "text-amber-400" : "text-indigo-400"} />
                </div>
                {i < steps.length - 1 && <div className="w-px h-8 bg-slate-700 mt-2" />}
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-500 font-mono">Phase {s.phase}</span>
                  <h4 className="text-sm font-semibold text-white">{s.title}</h4>
                  {s.status === "manual" && <Badge variant="warning">Manual Input</Badge>}
                  {s.status === "ready" && <Badge variant="info">Automated</Badge>}
                </div>
                <p className="text-xs text-slate-400 mb-2">{s.desc}</p>
                {s.agents.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {s.agents.map((a, j) => (
                      <span key={j} className="text-[10px] px-2 py-0.5 bg-slate-700 rounded text-slate-300 flex items-center gap-1">
                        <Bot size={10} /> {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-3">Data Sources</h3>
          <div className="space-y-2">
            {[
              { name: "Google Sheets Tracker", status: "connected", icon: FileText },
              { name: "FX Street EUR/USD", status: "connected", icon: Globe },
              { name: "FX Street DXY", status: "connected", icon: Globe },
              { name: "MyFXBook Calendar", status: "manual", icon: Calendar },
              { name: "Forex Factory", status: "blocked", icon: AlertCircle },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                <div className="flex items-center gap-2">
                  <s.icon size={14} className="text-slate-400" />
                  <span className="text-xs text-slate-300">{s.name}</span>
                </div>
                <Badge variant={s.status === "connected" ? "success" : s.status === "manual" ? "warning" : "danger"}>
                  {s.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-3">Schedule Configuration</h3>
          <div className="space-y-3">
            <div className="p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white font-medium">Daily Briefing</span>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="text-[10px] text-slate-400">Runs Phase 1–6 · Mon–Fri at 06:00 CET</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Skips Phase 0A/0B (weekly only)</div>
            </div>
            <div className="p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white font-medium">Full Weekly Run</span>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="text-[10px] text-slate-400">Runs Phase 0A–6 · Sunday at 19:00 CET</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Includes data extraction + performance update</div>
            </div>
            <div className="p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white font-medium">Monthly Evaluation</span>
                <Badge variant="info">Planned</Badge>
              </div>
              <div className="text-[10px] text-slate-400">Last Sunday of month · Full performance report</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS PAGE ───────────────────────────────────────────────────────────

function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Configure your trading copilot</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-4">Trading Configuration</h3>
            <div className="space-y-3">
              {[
                { label: "Primary Pair", value: "EUR/USD" },
                { label: "Confluence Chart", value: "DXY" },
                { label: "Timezone", value: "CET (Central European)" },
                { label: "Trading Session", value: "London Open (07:00–13:00)" },
                { label: "Risk Model", value: "Ladder (0.5%–1.5%)" },
                { label: "Max Daily Trades", value: "2–3" },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                  <span className="text-xs text-slate-400">{s.label}</span>
                  <span className="text-xs text-white font-medium bg-slate-700 px-3 py-1 rounded">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-4">Data Connections</h3>
            <div className="space-y-2">
              {[
                { name: "Google Sheets", desc: "Trading tracker spreadsheet", connected: true },
                { name: "Chrome Extension", desc: "Claude in Chrome for web scraping", connected: true },
                { name: "Google Drive", desc: "Cloud storage for MD files", connected: false },
              ].map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div>
                    <div className="text-xs text-white font-medium">{c.name}</div>
                    <div className="text-[10px] text-slate-500">{c.desc}</div>
                  </div>
                  <button className={`text-xs px-3 py-1 rounded-lg ${c.connected ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800/50" : "bg-slate-700 text-slate-400 hover:bg-slate-600"}`}>
                    {c.connected ? "Connected" : "Connect"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-4">News Sources</h3>
            <div className="space-y-2">
              {[
                { name: "FX Street — EUR/USD", url: "fxstreet.com/currencies/eurusd", active: true },
                { name: "FX Street — DXY", url: "fxstreet.com/currencies/us-dollar-index", active: true },
                { name: "MyFXBook Calendar", url: "myfxbook.com/forex-economic-calendar", active: true },
                { name: "Forex Factory", url: "forexfactory.com/calendar", active: false },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                  <div>
                    <div className="text-xs text-white">{s.name}</div>
                    <div className="text-[10px] text-slate-500">{s.url}</div>
                  </div>
                  <div className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${s.active ? "bg-indigo-600" : "bg-slate-600"}`}>
                    <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${s.active ? "right-0.5" : "left-0.5"}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-4">Copilot Skills</h3>
            <div className="space-y-2">
              {[
                { name: "Fundamentals Analyst", desc: "Reads and summarises market news", active: true },
                { name: "Performance Tracker", desc: "Extracts and logs trading data", active: true },
                { name: "Psychology Coach", desc: "Reviews mindset using SPACE method", active: true },
                { name: "Verification Agent", desc: "Cross-checks all copilot outputs", active: true },
                { name: "Simplification Agent", desc: "Converts jargon to plain English", active: true },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                  <div className="flex items-center gap-2">
                    <Bot size={14} className="text-indigo-400" />
                    <div>
                      <div className="text-xs text-white">{s.name}</div>
                      <div className="text-[10px] text-slate-500">{s.desc}</div>
                    </div>
                  </div>
                  <div className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${s.active ? "bg-emerald-600" : "bg-slate-600"}`}>
                    <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${s.active ? "right-0.5" : "left-0.5"}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function TradingCopilotApp() {
  const [page, setPage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  const pages = {
    dashboard: DashboardPage,
    profile: ProfilePage,
    performance: PerformancePage,
    briefing: BriefingPage,
    workflow: WorkflowPage,
    settings: SettingsPage,
  };

  const ActivePage = pages[page];

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar active={page} setActive={setPage} collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <Sparkles size={16} className="text-indigo-400" />
            <span className="text-xs text-slate-400">Traderess Trading Copilot</span>
            <Badge variant="info">Demo Mode</Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-500">For educational purposes only — not financial advice</span>
            <button className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
              <Bell size={14} />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold">F</div>
          </div>
        </div>
        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <ActivePage />
        </div>
      </div>
    </div>
  );
}
