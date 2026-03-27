# Traderess Copilot — Architecture Blueprint

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        STUDENT'S WORLD                              │
│                                                                     │
│   📊 Google Sheets          📄 Trader Profile CSV                  │
│   (Weekly Trading Log)       (Psychology Assessment)                │
│                                                                     │
└──────────┬──────────────────────────────┬───────────────────────────┘
           │                              │
           ▼                              ▼
┌──────────────────────┐     ┌──────────────────────┐
│  GET /api/sheets     │     │  POST /api/profile   │
│  (Preview data)      │     │  (Parse profile)     │
└──────────┬───────────┘     └──────────┬───────────┘
           │                            │
           ▼                            ▼
┌──────────────────────┐     ┌──────────────────────┐
│  POST /api/sheets    │     │  Claude Sonnet AI    │
│  /sync               │     │  (Profile Parser)    │
│                      │     │                      │
│  Mode: trades_only   │     │  Extracts:           │
│  Mode: comprehensive │     │  • Weaknesses (5+)   │
└──────────┬───────────┘     │  • Strengths (5+)    │
           │                 │  • Successes          │
           ▼                 │  • Fears              │
┌──────────────────────┐     │  • Hobbies           │
│  Claude Sonnet AI    │     │  • Goals             │
│  (Sheet Parser)      │     └──────────┬───────────┘
│                      │                │
│  Trades Only:        │                │
│  • Trade entries     │                │
│                      │                │
│  Comprehensive:      │                │
│  • Trades            │                │
│  • Journals          │                │
│  • Chart time        │                │
│  • Account balances  │                │
│  • Missed trades     │                │
│  • Goals             │                │
│  • Weekly summary    │                │
└──────────┬───────────┘                │
           │                            │
           ▼                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SUPABASE DATABASE                            │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  trade_log   │  │daily_journals│  │chart_time_log│             │
│  │  (35 cols)   │  │  (15 cols)   │  │  (8 cols)    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │account_      │  │missed_trades │  │trading_goals │             │
│  │balances      │  │              │  │              │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │trader_       │  │weekly_       │  │copilot_      │             │
│  │profiles      │  │briefings     │  │settings      │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │weekly_       │  │sync_history  │  │trading_      │             │
│  │summaries     │  │(audit log)   │  │performance   │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                     │
│  All tables have RLS (Row Level Security) — users only see own data │
└─────────────────────────────────────────────────────────────────────┘
           │
           │  React Hooks (client-side queries)
           │
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        HOOKS LAYER                                  │
│                                                                     │
│  Data Hooks:                    Computed Hooks:                     │
│  • useTrades()                  • useDiscipline()                  │
│  • useJournals()                  (5 weighted scores)              │
│  • usePerformance()             • usePsychology()                  │
│  • useChartTime()                 (emotion → numeric mapping)      │
│  • useAccountBalances()                                            │
│  • useMissedTrades()            Client Computations:               │
│  • useGoals()                   • computeInsights()                │
│  • useBriefing()                  (AI-like pattern detection)      │
│  • useTraderProfile()           • computeJournalPatterns()         │
│  • useSettings()                  (keyword → pip correlation)      │
│                                 • computeRiskAnalysis()            │
│                                   (Monte Carlo 1000 sims)          │
└─────────────────────────────────────────────────────────────────────┘
           │
           │  Data → Components → UI
           │
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          8 PAGES                                    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 📊 DASHBOARD                                                │   │
│  │ • Greeting (time-based + name)                              │   │
│  │ • 6 stat cards (P/L, trades, win rate, accounts,           │   │
│  │   chart time, discipline) with sparklines + trends         │   │
│  │ • AI Insights (4 computed observations)                    │   │
│  │ • Cumulative P/L curve + Win/Loss pie                      │   │
│  │ • Trading Accounts (auto from trades)                      │   │
│  │ • Economic events + Quick actions                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 📈 PERFORMANCE                                              │   │
│  │ • Period selector (Weekly/Monthly/Quarterly/All)            │   │
│  │ • Period summaries (11 stats + session table)               │   │
│  │ • P/L by Account chart + Win Rate chart                    │   │
│  │ • Session + Day of week breakdown charts                   │   │
│  │ • Emotion timeline + Emotion vs Performance                │   │
│  │ • Trade Log grouped by week → by account                   │   │
│  │   with journal cards inside each week                      │   │
│  │ • Column visibility + Weekly/Monthly/Quarterly grouping    │   │
│  │ • Edit via modal popup + delete confirmation               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 🧠 JOURNAL                                                  │   │
│  │ • Emotion summary cards (avg before/during/after)          │   │
│  │ • Emotion timeline chart + Effort vs Results scatter       │   │
│  │ • Emotion vs Performance correlation cards                 │   │
│  │ • Pattern Detection (keyword → pip impact)                 │   │
│  │ • Weekly Reflection form (4 prompts → saves)               │   │
│  │ • Daily entries grouped by week (expandable)               │   │
│  │ • Full CRUD: create, edit (modal), delete (confirm)        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 🎯 DISCIPLINE                                               │   │
│  │ • Overall score (0-100) + 4 sub-scores                     │   │
│  │ • Discipline radar chart                                   │   │
│  │ • Chart time bar chart + vs Performance correlation        │   │
│  │ • Missed/avoided trades list                               │   │
│  │ • Interactive goal checkboxes (saves to DB)                │   │
│  │ • Risk of Ruin Monte Carlo widget                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 👤 PROFILE                                                   │   │
│  │ • Avatar + name + stage + funded status                    │   │
│  │ • Upload Profile CSV (AI parses psychology)                │   │
│  │ • 5 tabs: Overview, Psychology, Strengths, Fears, Plan     │   │
│  │ • Detailed weaknesses/strengths with 5 impact fields each  │   │
│  │ • Successes, fears, hobbies, goals, trader type            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 📰 WEEKLY BRIEFING                                          │   │
│  │ • Week in review (4 stats + what went well/watch out)      │   │
│  │ • Market context (EUR/USD + DXY articles + sentiment)      │   │
│  │ • Economic calendar (Mon-Fri grid)                         │   │
│  │ • Copilot guidance (no-trade zones, risk ratings, quote)   │   │
│  │ • Pre-session checklist                                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ⚙️ SETTINGS                                                 │   │
│  │ • Google Sheets connector (preview + sync + progress)      │   │
│  │ • Sync history (all runs with details)                     │   │
│  │ • Trading configuration                                    │   │
│  │ • Data connections                                         │   │
│  │ • News sources + Copilot skills toggles                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 🔄 COPILOT WORKFLOW                                         │   │
│  │ • 8-phase pipeline visualization                           │   │
│  │ • Data sources status                                      │   │
│  │ • Schedule configuration                                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Auth Flow

```
New User                          Existing User
   │                                    │
   ▼                                    ▼
/register                            /login
   │                                    │
   ├─ signUp(email, password)           ├─ signIn(email, password)
   │                                    │
   ▼                                    ▼
"Check email"                      ✅ Session created
   │                                    │
   ├─ Click email link                  ├─ Redirect to /dashboard
   │                                    │
   ▼                                    ▼
/auth/callback                     Protected pages
   │                                (proxy.ts checks auth)
   ├─ Exchange code for session
   │
   ├─ Check trader_profiles.full_name
   │
   ├─ Empty? → /onboarding (4 steps)
   │             │
   │             ├─ Step 1: Name, experience, timezone
   │             ├─ Step 2: Trading plan
   │             ├─ Step 3: Data upload
   │             └─ Step 4: Goals → /dashboard
   │
   └─ Has name? → /dashboard
```

## Data Sync Flow

```
Student's Google Sheet
       │
       ├─ 1. Paste URL in Settings
       │
       ▼
   Preview (GET /api/sheets)
       │
       ├─ 2. Choose: "Trades Only" or "Full Sync"
       │
       ▼
   Sync (POST /api/sheets/sync)
       │
       ├─ Fetch rows from Google Sheets API
       │
       ├─ Send to Claude Sonnet AI
       │   ├─ Trades Only: extracts trade entries
       │   └─ Full Sync: extracts ALL data types
       │
       ├─ Deduplication: DELETE existing trades for date range
       │
       ├─ INSERT into Supabase tables (parallel):
       │   ├─ trade_log (always)
       │   ├─ daily_journals (full sync)
       │   ├─ chart_time_log (full sync)
       │   ├─ account_balances (full sync)
       │   ├─ missed_trades (full sync)
       │   ├─ trading_goals (full sync)
       │   └─ weekly_summaries (full sync)
       │
       ├─ Save to sync_history (success or failure)
       │
       └─ UI refreshes all hooks → pages update
```

## Discipline Scoring Model

```
Overall Score (0-100) = weighted average:

┌─────────────────────────┬────────┬─────────────────────────────────┐
│ Metric                  │ Weight │ How it's calculated             │
├─────────────────────────┼────────┼─────────────────────────────────┤
│ Chart Time              │  15%   │ avg daily min / 60 min target   │
│ Emotional Control       │  25%   │ 1 - (stressed days / total)     │
│ Risk Discipline         │  25%   │ trades within risk limits       │
│ Plan Adherence          │  20%   │ trades with full documentation  │
│ Trade Selection         │  15%   │ bonus for avoiding bad trades   │
└─────────────────────────┴────────┴─────────────────────────────────┘
```

## AI Insights Engine (Client-Side, No API Call)

```
Input: Trade[] from trade_log

Analyses (ranked by priority):
1. Streak detection (winning/losing)          → Priority 9-10
2. Day of week win rate comparison            → Priority 8
3. Risk/reward ratio assessment               → Priority 6-8
4. Session performance comparison             → Priority 7
5. Account performance comparison             → Priority 5
6. Overall win rate vs 65% target             → Priority 4

Output: Top 4 insights, color-coded:
   🟢 Positive (green)  — winning streak, good R:R
   🟡 Neutral (amber)   — best day/session comparison
   🔴 Warning (red)     — losing streak, poor R:R
```

## Journal Pattern Detection (Client-Side)

```
Input: DailyJournal[] from daily_journals

Scans journal_text for 15 keyword categories:
patient, disciplined, frustrated, anxious, confident,
rushed, revenge, FOMO, hesitated, calm, tired,
overtraded, confirmation, focused, stress

For each keyword:
   avg pips on days keyword appears
   vs avg pips on days keyword doesn't appear
   = impact score

Output: Top 5 patterns by absolute impact
   🟢 "patient" → +12.3p impact (positive correlation)
   🔴 "stressed" → -8.1p impact (negative correlation)
```

## Risk of Ruin (Monte Carlo Simulation)

```
Input: Trade[] stats (win rate, avg win R, avg loss R)

Simulation: 1000 iterations × 100 trades each
   For each trade: random < win_rate → win (avg_win_R), else loss (avg_loss_R)
   Track: balance, peak, max drawdown

Output:
   Probability of Profit after 100 trades: X%
   Risk of 20% Drawdown: X%
   Color: green (<15%), amber (15-30%), red (>30%)
```

## Tech Stack

```
┌───────────────────────────────────────────┐
│ Frontend                                  │
│ • Next.js 16 (App Router)                │
│ • React 19                                │
│ • Tailwind CSS 4 (pink glassmorphism)     │
│ • Recharts (13 chart components)          │
│ • Lucide React (icons)                    │
│ • TypeScript                              │
└───────────────────────────────────────────┘

┌───────────────────────────────────────────┐
│ Backend                                   │
│ • Next.js API Routes (serverless)         │
│ • Supabase (PostgreSQL + Auth + RLS)      │
│ • Claude Sonnet AI (data parsing)         │
│ • Google Sheets API (data fetching)       │
└───────────────────────────────────────────┘

┌───────────────────────────────────────────┐
│ Infrastructure                            │
│ • Vercel (hosting + CI/CD)                │
│ • GitHub (source control)                 │
│ • Supabase Cloud (database)               │
│ • Anthropic API (AI)                      │
└───────────────────────────────────────────┘
```

## File Count Summary

```
Pages:           10 (8 app + login + register + onboarding)
Hooks:           12 (7 data + 3 computed + 2 utility)
API Routes:       3 (/api/sheets, /api/sheets/sync, /api/profile)
Components:      30+ (13 charts + 7 UI + 10+ business)
Lib/Utils:        9 (3 AI parsers + 3 compute + sheets + dates + columns)
Supabase Tables: 13
SQL Migrations:   6
```
