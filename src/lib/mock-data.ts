export const PERFORMANCE_WEEKLY = [
  { week: "Jan 5-9", pnl: 320, trades: 6, winRate: 66.7, rValue: 2.1 },
  { week: "Jan 19-23", pnl: -180, trades: 4, winRate: 25, rValue: -1.4 },
  { week: "Feb 2-6", pnl: 540, trades: 7, winRate: 71.4, rValue: 3.2 },
  { week: "Feb 9-13", pnl: 210, trades: 5, winRate: 60, rValue: 1.8 },
  { week: "Feb 18-20", pnl: -90, trades: 3, winRate: 33.3, rValue: -0.6 },
  { week: "Feb 23-27", pnl: 670, trades: 8, winRate: 75, rValue: 4.1 },
  { week: "Mar 2-6", pnl: 430, trades: 6, winRate: 83.3, rValue: 3.5 },
  { week: "Mar 9-13", pnl: 280, trades: 5, winRate: 80, rValue: 2.4 },
];

export const CALENDAR_EVENTS = [
  { day: "Mon", time: "09:00", event: "German Manufacturing PMI", impact: "medium" as const, currency: "EUR" },
  { day: "Mon", time: "14:30", event: "US Existing Home Sales", impact: "low" as const, currency: "USD" },
  { day: "Tue", time: "10:00", event: "ZEW Economic Sentiment", impact: "high" as const, currency: "EUR" },
  { day: "Tue", time: "14:30", event: "US Retail Sales", impact: "high" as const, currency: "USD" },
  { day: "Wed", time: "10:00", event: "Eurozone CPI (Final)", impact: "high" as const, currency: "EUR" },
  { day: "Wed", time: "15:15", event: "ECB Rate Decision", impact: "high" as const, currency: "EUR" },
  { day: "Wed", time: "19:00", event: "FOMC Rate Decision", impact: "high" as const, currency: "USD" },
  { day: "Thu", time: "13:30", event: "US Jobless Claims", impact: "medium" as const, currency: "USD" },
  { day: "Thu", time: "15:00", event: "US Existing Home Sales", impact: "medium" as const, currency: "USD" },
  { day: "Fri", time: "09:30", event: "German Flash PMI", impact: "high" as const, currency: "EUR" },
  { day: "Fri", time: "14:30", event: "US Flash PMI", impact: "medium" as const, currency: "USD" },
];

export const WIN_LOSS_DATA = [
  { name: "Wins", value: 34 },
  { name: "Losses", value: 12 },
  { name: "BE", value: 3 },
];

export const PIE_COLORS = ["#10b981", "#ef4444", "#f59e0b"];

// ─── PROFILE DATA ────────────────────────────────────────────────────────────

export const RADAR_DATA = [
  { trait: "Patience", value: 72, fullMark: 100 },
  { trait: "Discipline", value: 65, fullMark: 100 },
  { trait: "Risk Mgmt", value: 78, fullMark: 100 },
  { trait: "Fundamentals", value: 45, fullMark: 100 },
  { trait: "Technical", value: 82, fullMark: 100 },
  { trait: "Psychology", value: 58, fullMark: 100 },
];

export const STRENGTHS = [
  { label: "Self-awareness & journaling quality", score: 85 },
  { label: "Discipline to avoid unclear setups", score: 78 },
  { label: "Screen recording as execution anchor", score: 72 },
  { label: "Growing patience with entries", score: 70 },
  { label: "Emotional recovery capacity", score: 68 },
];

export const WEAKNESSES = [
  { label: "Multi-account scaling under pressure", score: 82 },
  { label: "Trading while impaired / inappropriate conditions", score: 75 },
  { label: "Goal-driven urgency overriding discipline", score: 70 },
  { label: "RSI-only entries without full confirmation", score: 65 },
  { label: "Overnight trade management gaps", score: 58 },
];

export const SPACE_METHOD = [
  { letter: "S", word: "Sleep", status: "good" as const, note: "Consistent 7-8hrs, but drops after wine evenings" },
  { letter: "P", word: "Psychology", status: "warning" as const, note: "Perfectionism and mood-driven productivity tendencies" },
  { letter: "A", word: "Activity", status: "good" as const, note: "Regular gym routine, maintains energy" },
  { letter: "C", word: "Consumption", status: "warning" as const, note: "Weekend wine trade pattern identified twice" },
  { letter: "E", word: "Environment", status: "good" as const, note: "Dedicated trading space, minimal distractions" },
];

export const BEHAVIOURAL_PATTERNS = [
  { pattern: "Wine Trade Pattern", frequency: "2x in last 6 weeks", trigger: "Sunday evening after wine, RSI alert → impulsive gap trade", severity: "high" as const },
  { pattern: "FOMO After Quiet Period", frequency: "3x in last 8 weeks", trigger: "3+ days without a trade → lowered entry standards", severity: "medium" as const },
  { pattern: "Multi-Account Scaling Pressure", frequency: "Ongoing", trigger: "Funded + verification running simultaneously → split focus", severity: "medium" as const },
  { pattern: "Goal-Driven Urgency", frequency: "Monthly", trigger: "End of month approaching targets → forced trades", severity: "high" as const },
];

export const TRADING_PLAN = [
  { label: "Pairs", value: "EUR/USD primary, DXY as confluence" },
  { label: "Strategy", value: "Level-based trading with ladder risk" },
  { label: "Session", value: "London Open (07:00–13:00 CET)" },
  { label: "Risk per trade", value: "0.5% base, ladder to 1.5% max" },
  { label: "Max daily trades", value: "2–3 (1 preferred)" },
  { label: "TP model", value: "Session high/low targets" },
  { label: "SL model", value: "Candle low/high based" },
  { label: "Chart time minimum", value: "30 mins before first trade" },
];

export const PROP_ACCOUNTS = [
  { name: "10K Funded", status: "Active", progress: 68, pnl: "+$680" },
  { name: "50K Verification", status: "Active", progress: 42, pnl: "+$1,190" },
  { name: "10K Challenge", status: "Phase 1", progress: 25, pnl: "+$124" },
];

export const PROFILE_META = [
  { label: "Tracking Since", value: "Jan 2026" },
  { label: "Trading Plan", value: "EUR/USD + DXY" },
  { label: "Session Focus", value: "London Open" },
  { label: "Risk Model", value: "Ladder (0.5–1.5%)" },
];

// ─── BRIEFING DATA ───────────────────────────────────────────────────────────

export type Sentiment = "bullish" | "bearish" | "neutral";

export const ARTICLES_EURUSD = [
  { source: "FX Street", title: "EUR/USD drops below 1.0850 as Middle East tensions boost USD", time: "2h ago", sentiment: "bearish" as Sentiment },
  { source: "FX Street", title: "Rabobank cuts EUR/USD 1-month forecast to 1.04", time: "5h ago", sentiment: "bearish" as Sentiment },
  { source: "FX Street", title: "ECB\u2019s Lagarde signals caution on rate path amid geopolitical risks", time: "8h ago", sentiment: "neutral" as Sentiment },
  { source: "Reuters", title: "ING: Peripheral Euro sovereign spreads widening \u2014 fiscal stress building", time: "12h ago", sentiment: "bearish" as Sentiment },
  { source: "FX Street", title: "EUR/USD technical: 200-SMA holds as dynamic support at 1.0780", time: "1d ago", sentiment: "neutral" as Sentiment },
];

export const ARTICLES_DXY = [
  { source: "FX Street", title: "US Dollar Index hits 10-month high on safe-haven flows", time: "1h ago", sentiment: "bullish" as Sentiment },
  { source: "Reuters", title: "Fed rate cut expectations slashed: 50bps to just 25bps this year", time: "4h ago", sentiment: "bullish" as Sentiment },
  { source: "FX Street", title: "Energy shock: Every $10 oil rise adds 0.2% to US inflation", time: "6h ago", sentiment: "bullish" as Sentiment },
  { source: "FX Street", title: "DXY technical: Overbought but fundamentally supported above 106", time: "10h ago", sentiment: "neutral" as Sentiment },
];

export const WEEK_REVIEW_STATS = [
  { value: "80%", label: "Win Rate", color: "text-emerald-400" },
  { value: "5", label: "Trades Taken", color: "text-gray-900" },
  { value: "+$280", label: "Net P/L", color: "text-emerald-400" },
  { value: "2.4R", label: "R-Value", color: "text-pink-500" },
];

export const DAILY_RISK_RATINGS = [
  { day: "Mon", risk: "low" as const, note: "07:00\u201313:00 safe. Before US data. Pre-storm setups may form.", color: "bg-emerald-900/20 border-emerald-800/30" },
  { day: "Tue", risk: "medium" as const, note: "07:00\u201310:30 safe before ZEW. After 11:00 risky, especially 13:30.", color: "bg-amber-900/20 border-amber-800/30" },
  { day: "Wed", risk: "extreme" as const, note: "DANGER. ECB + FOMC. Consider observation only. If must trade: before 10:30.", color: "bg-red-900/20 border-red-800/30" },
  { day: "Thu", risk: "high" as const, note: "Post-FOMC volatility. Wait until after 16:00 for any setups.", color: "bg-red-900/20 border-red-800/30" },
  { day: "Fri", risk: "low" as const, note: "Your best bet. Post-storm setups may form with clean levels.", color: "bg-emerald-900/20 border-emerald-800/30" },
];

export const PRE_SESSION_CHECKLIST = [
  "Am I rested? Rate energy 1\u201310",
  "30 min chart time completed?",
  "Checked economic calendar for today?",
  "Session high/low levels marked?",
  "Max 1 account active today?",
  "No trades if energy < 6",
  "Full confirmation stack before entry?",
  "SL set before entry \u2014 no exceptions",
];

// ─── WORKFLOW DATA ───────────────────────────────────────────────────────────

export const WORKFLOW_STEPS = [
  { phase: "0A", title: "Extract Weekly Trading Data", icon: "Upload" as const, desc: "Navigate to Google Sheets tracker. Extract latest week\u2019s trading data via iframe. Update performance MD file.", agents: ["Performance File Updater", "Traders Profile Updater"], status: "ready" as const },
  { phase: "0B", title: "Verify Data Extraction", icon: "Shield" as const, desc: "Verification agent cross-checks extracted data against source spreadsheet.", agents: ["Verification Agent"], status: "ready" as const },
  { phase: "1", title: "Receive MyFXBook Calendar", icon: "Calendar" as const, desc: "Paste raw MyFXBook economic calendar for the upcoming week. Convert GMT+4 to CET. Parse high/medium impact events.", agents: [], status: "manual" as const },
  { phase: "2", title: "Extract FX Street Articles", icon: "Newspaper" as const, desc: "Navigate to EUR/USD and DXY pages on FX Street via Chrome extension. Extract top 7\u20138 article links from each.", agents: ["EUR/USD Article Reader", "DXY Article Reader"], status: "ready" as const },
  { phase: "3", title: "Deep Read Articles", icon: "BookOpen" as const, desc: "Open each article, read full text, extract key institutional insights \u2014 not just headlines.", agents: ["Agent 1: EUR/USD Reader", "Agent 2: DXY Reader"], status: "ready" as const },
  { phase: "4", title: "Verification Gate", icon: "CheckCircle" as const, desc: "Agent 3 cross-checks article summaries to confirm genuine deep-dive analysis, not headline scraping.", agents: ["Verification Agent"], status: "ready" as const },
  { phase: "5", title: "Simplification Pass", icon: "Lightbulb" as const, desc: "Agent 4 simplifies complex terminology. Keeps key terms but explains in plain English for gradual learning.", agents: ["Simplification Agent"], status: "ready" as const },
  { phase: "6", title: "Compile & Deliver Briefing", icon: "FileText" as const, desc: "Compile weekly briefing from all sources. Inject previous week\u2019s trading insights. Generate visual web page.", agents: ["Briefing Compiler"], status: "ready" as const },
];

export const DATA_SOURCES = [
  { name: "Google Sheets Tracker", status: "connected" as const, icon: "FileText" as const },
  { name: "FX Street EUR/USD", status: "connected" as const, icon: "Globe" as const },
  { name: "FX Street DXY", status: "connected" as const, icon: "Globe" as const },
  { name: "MyFXBook Calendar", status: "manual" as const, icon: "Calendar" as const },
  { name: "Forex Factory", status: "blocked" as const, icon: "AlertCircle" as const },
];

export const SCHEDULE_CONFIGS = [
  { name: "Daily Briefing", status: "Active", desc: "Runs Phase 1\u20136 \u00b7 Mon\u2013Fri at 06:00 CET", note: "Skips Phase 0A/0B (weekly only)" },
  { name: "Full Weekly Run", status: "Active", desc: "Runs Phase 0A\u20136 \u00b7 Sunday at 19:00 CET", note: "Includes data extraction + performance update" },
  { name: "Monthly Evaluation", status: "Planned", desc: "Last Sunday of month \u00b7 Full performance report", note: null },
];

// ─── SETTINGS DATA ───────────────────────────────────────────────────────────

export const TRADING_CONFIG = [
  { label: "Primary Pair", value: "EUR/USD" },
  { label: "Confluence Chart", value: "DXY" },
  { label: "Timezone", value: "CET (Central European)" },
  { label: "Trading Session", value: "London Open (07:00\u201313:00)" },
  { label: "Risk Model", value: "Ladder (0.5%\u20131.5%)" },
  { label: "Max Daily Trades", value: "2\u20133" },
];

export const DATA_CONNECTIONS = [
  { name: "Google Sheets", desc: "Trading tracker spreadsheet", connected: true },
  { name: "Chrome Extension", desc: "Claude in Chrome for web scraping", connected: true },
  { name: "Google Drive", desc: "Cloud storage for MD files", connected: false },
];

export const NEWS_SOURCES = [
  { name: "FX Street \u2014 EUR/USD", url: "fxstreet.com/currencies/eurusd", active: true },
  { name: "FX Street \u2014 DXY", url: "fxstreet.com/currencies/us-dollar-index", active: true },
  { name: "MyFXBook Calendar", url: "myfxbook.com/forex-economic-calendar", active: true },
  { name: "Forex Factory", url: "forexfactory.com/calendar", active: false },
];

export const COPILOT_SKILLS = [
  { name: "Fundamentals Analyst", desc: "Reads and summarises market news", active: true },
  { name: "Performance Tracker", desc: "Extracts and logs trading data", active: true },
  { name: "Psychology Coach", desc: "Reviews mindset using SPACE method", active: true },
  { name: "Verification Agent", desc: "Cross-checks all copilot outputs", active: true },
  { name: "Simplification Agent", desc: "Converts jargon to plain English", active: true },
];

// ─── PERFORMANCE DATA ────────────────────────────────────────────────────────

export const SESSION_DATA = [
  { session: "London Open", trades: 20, winRate: 72, pips: 186 },
  { session: "NY Open", trades: 12, winRate: 58, pips: 67 },
  { session: "London Close", trades: 8, winRate: 62, pips: 42 },
  { session: "Asian", trades: 5, winRate: 40, pips: -18 },
  { session: "Overlap", trades: 4, winRate: 75, pips: 31 },
];

export const DAY_DATA = [
  { day: "Mon", trades: 8, winRate: 62 },
  { day: "Tue", trades: 14, winRate: 71 },
  { day: "Wed", trades: 9, winRate: 55 },
  { day: "Thu", trades: 10, winRate: 70 },
  { day: "Fri", trades: 8, winRate: 75 },
];

export const TRADE_LOG = [
  { id: 1, date: "Mar 10", pair: "EUR/USD", direction: "Long" as const, entry: 1.0842, sl: 1.0822, tp: 1.0882, result: "Win" as const, pips: 40, rr: "2:1", session: "London", notes: "Clean level bounce, patient entry" },
  { id: 2, date: "Mar 10", pair: "EUR/USD", direction: "Short" as const, entry: 1.0891, sl: 1.0911, tp: 1.0851, result: "Win" as const, pips: 40, rr: "2:1", session: "NY", notes: "Session high rejection" },
  { id: 3, date: "Mar 11", pair: "EUR/USD", direction: "Long" as const, entry: 1.0835, sl: 1.0815, tp: 1.0875, result: "Loss" as const, pips: -20, rr: "-1:1", session: "London", notes: "Entered during news — mistake" },
  { id: 4, date: "Mar 12", pair: "EUR/USD", direction: "Short" as const, entry: 1.087, sl: 1.089, tp: 1.083, result: "Win" as const, pips: 40, rr: "2:1", session: "London", notes: "Ladder risk, clean setup" },
  { id: 5, date: "Mar 13", pair: "EUR/USD", direction: "Long" as const, entry: 1.081, sl: 1.079, tp: 1.085, result: "Win" as const, pips: 40, rr: "2:1", session: "London", notes: "Weekly low test, confluence setup" },
];

// ─── DASHBOARD HELPERS ───────────────────────────────────────────────────────

export function getDashboardStats() {
  const totalPnl = PERFORMANCE_WEEKLY.reduce((s, w) => s + w.pnl, 0);
  const totalTrades = PERFORMANCE_WEEKLY.reduce((s, w) => s + w.trades, 0);
  const avgWinRate = (
    PERFORMANCE_WEEKLY.reduce((s, w) => s + w.winRate, 0) /
    PERFORMANCE_WEEKLY.length
  ).toFixed(1);

  const cumPnl = PERFORMANCE_WEEKLY.reduce<{ week: string; pnl: number }[]>(
    (acc, w, i) => {
      acc.push({
        week: w.week.split(" ")[0],
        pnl: (acc[i - 1]?.pnl || 0) + w.pnl,
      });
      return acc;
    },
    [],
  );

  return { totalPnl, totalTrades, avgWinRate, cumPnl };
}
