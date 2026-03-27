# Traderess Copilot — Development Roadmap

## Current State (v1.0 — Completed)
- ✅ 8 pages: Dashboard, Performance, Journal, Discipline, Profile, Briefing, Workflow, Settings
- ✅ Google Sheets sync with AI parsing (trades + comprehensive)
- ✅ 13 Supabase tables with RLS
- ✅ 13 chart types (Recharts)
- ✅ Client-side AI insights, pattern detection, risk analysis
- ✅ Full CRUD on trades + journals
- ✅ Pink glassmorphism theme
- ✅ Mobile responsive with bottom nav
- ✅ Auth (login/register/onboarding)
- ✅ Sync history tracking
- ✅ Trading account auto-classification
- ✅ Trader profile with deep psychology import

---

## Phase 2: Connect Date Range Filter to All Data

### Goal
The DateRangeContext exists but hooks don't use it. All pages should respect the global date filter.

### Prompt
```
Connect the existing DateRangeContext (src/contexts/DateRangeContext.tsx) to all data hooks so that when the user selects "This Week", "Last Month", or a custom date range from the TopBar dropdown, ALL pages filter their data accordingly.

Specifically:
1. Update useTrades() to accept and apply the date range filter from context
2. Update useJournals() to filter by date range
3. Update usePerformance() — the statsFromTrades() function should only compute stats for trades within the selected range
4. Update useChartTime() to filter entries by date range
5. Update useMissedTrades() to filter by date range
6. The Dashboard stat cards, charts, insights should all reflect only the filtered period
7. The Performance page period summaries should respect the global filter
8. Default should remain "All Time" so existing behavior is preserved

Implementation approach:
- Add `useDateRange()` hook call inside each data hook
- Use the `filterDates()` helper from DateRangeContext to filter the fetched data before returning
- Don't change the Supabase queries — filter client-side after fetching (simpler, avoids refetching on every filter change)
- Make sure the TopBar date picker is always visible and shows the current selection

Test by:
- Select "This Week" → verify Dashboard only shows this week's trades
- Select "Last Month" → verify Performance page shows only last month
- Select custom range → verify Journal shows only those dates
- Select "All Time" → verify everything is back to normal
- Navigate between pages → verify the filter persists

After all changes, run `npm run build` to verify no errors.
```

### Files to modify
- `src/hooks/use-trades.ts`
- `src/hooks/use-journals.ts`
- `src/hooks/use-performance.ts`
- `src/hooks/use-chart-time.ts`
- `src/hooks/use-missed-trades.ts`
- `src/app/(app)/dashboard/page.tsx`
- `src/app/(app)/performance/page.tsx`

### Testing
- [ ] Date filter persists across page navigation
- [ ] "All Time" shows all data (default)
- [ ] "This Week" shows only current week trades
- [ ] Custom range works with two date inputs
- [ ] Empty state shows if no data in selected range
- [ ] Stat cards, charts, insights all update

---

## Phase 3: Automate the Weekly Briefing Pipeline

### Goal
The Workflow page shows an 8-phase pipeline that's just a visual. Actually automate it to generate real weekly briefings.

### Prompt
```
Build the automated weekly briefing pipeline that generates real briefings and saves them to the weekly_briefings table.

Create a new API route POST /api/briefing/generate that:

1. Accepts: { weekStart: string } — the Monday of the week to generate for

2. Phase 0: Data Collection
   - Fetch the student's trades for that week from trade_log
   - Fetch journal entries from daily_journals for that week
   - Compute: total trades, wins, losses, win rate, total pips, total R's, best/worst trade

3. Phase 1: Economic Calendar
   - For now, accept optional calendar data in the request body
   - Parse into the calendar_events format: { day, time, event, impact, currency }

4. Phase 2-4: Market Analysis (using Claude AI)
   - Send the week's trade data + journal summaries to Claude
   - Ask Claude to generate:
     a. "What went well" — analyze winning trades and good decisions
     b. "Watch out for" — analyze losses, mistakes, emotional patterns
     c. EUR/USD bias assessment (bullish/bearish/neutral) with reasoning
     d. DXY bias assessment
     e. Key insight from the week's market context
     f. Daily risk ratings for NEXT week (Mon-Fri) based on patterns
     g. No-trade zones based on the student's weaknesses
     h. A personalized motivational quote

5. Phase 5: Compile into WeeklyBriefing format
   - Build the complete WeeklyBriefing object
   - Include: review_stats, what_went_well, watch_out_for, articles (empty for now),
     eurusd_bias, dxy_bias, key_insight, calendar_events, daily_risk_ratings,
     no_trade_zones, motivational_quote, pre_session_checklist

6. Phase 6: Save
   - Upsert into weekly_briefings table
   - Return the generated briefing

The prompt to Claude should include:
- The student's trader profile (strengths, weaknesses, trading plan)
- This week's trades with evaluations
- This week's journal entries with emotions
- Previous week's briefing (if exists) for continuity

Also:
- Add a "Generate Briefing" button on the Briefing page that calls this API
- Add a "Run Briefing" button on the Dashboard that does the same
- Show a loading state while generating (similar to sync progress overlay)
- After generation, the Briefing page should show the new briefing

Use Claude Sonnet for the AI generation. Set maxDuration = 300.

After all changes, run `npm run build` to verify no errors.
```

### Files to create/modify
- `src/app/api/briefing/generate/route.ts` (new)
- `src/components/briefing/BriefingContent.tsx` (add generate button)
- `src/app/(app)/dashboard/page.tsx` (wire up "Run Briefing" button)

### Testing
- [ ] Generate briefing for a week with trade data → saves to DB → shows on Briefing page
- [ ] "What went well" references actual winning trades
- [ ] "Watch out for" references actual losses and journal emotions
- [ ] Risk ratings reflect the student's patterns
- [ ] Motivational quote is personalized
- [ ] Re-generating same week updates (not duplicates)
- [ ] Empty week → graceful message
- [ ] Briefing page loads the latest briefing automatically

---

## Phase 4: Real-time Data Updates with Supabase Subscriptions

### Goal
After syncing, users have to manually refresh pages. Add real-time updates so data appears instantly.

### Prompt
```
Add Supabase Realtime subscriptions so that when data is synced (trades, journals, etc.), all open pages update automatically without requiring a manual refresh.

1. Create a new hook useRealtimeSubscription(tableName, userId, onUpdate) that:
   - Subscribes to INSERT, UPDATE, DELETE events on a Supabase table
   - Filters by user_id
   - Calls onUpdate() callback when changes occur
   - Cleans up subscription on unmount

2. Update these hooks to use realtime:
   - useTrades() — subscribe to trade_log changes → call refresh()
   - useJournals() — subscribe to daily_journals changes
   - useAccountBalances() — subscribe to account_balances changes

3. When a sync completes in Settings, all other open tabs/pages should update automatically

4. Add a small toast notification when data updates: "3 new trades synced" (bottom-right, auto-dismiss after 3 seconds)

5. Make sure subscriptions are properly cleaned up when components unmount

Note: Supabase Realtime requires the tables to have REPLICA IDENTITY set. You may need to add:
   ALTER TABLE trade_log REPLICA IDENTITY FULL;
   ALTER TABLE daily_journals REPLICA IDENTITY FULL;

After all changes, run `npm run build` to verify no errors.
```

### Files to create/modify
- `src/hooks/use-realtime.ts` (new)
- `src/hooks/use-trades.ts`
- `src/hooks/use-journals.ts`
- `src/components/ui/Toast.tsx` (new)

### Testing
- [ ] Open Dashboard in one tab, sync in Settings tab → Dashboard updates
- [ ] Toast shows "X trades synced" after sync
- [ ] No memory leaks (subscriptions cleaned up on unmount)
- [ ] Works with Supabase free tier

---

## Phase 5: Multi-Student Coach View

### Goal
Allow a coach/mentor to view and manage multiple students from a single dashboard.

### Prompt
```
Add a coach/mentor role that can view multiple students' data from a single dashboard.

1. Database changes:
   - New table: coach_students (coach_id, student_id, added_at)
   - New column on auth.users metadata: role ("student" | "coach")
   - RLS policies: coaches can SELECT from student tables where student_id is in their coach_students list

2. New page: /coach (only visible to coach role)
   - Student list: cards showing each student's name, avatar, last activity, key stats
   - Click a student → view their full dashboard/performance/journal as read-only
   - Comparison view: side-by-side stats of 2-3 students
   - Aggregate view: class-wide win rate, avg pips, most common mistakes

3. Coach actions:
   - Add student by email (sends invite)
   - Remove student
   - Leave notes/comments on individual trades or journal entries
   - Flag trades for discussion

4. Student side:
   - Can see if a coach is connected
   - Can see coach's comments on their trades
   - Can accept/reject coach connection

5. Navigation:
   - Coaches see an extra "Students" item in the sidebar
   - URL pattern: /coach/students/[studentId]/dashboard

After all changes, run `npm run build` to verify no errors.
```

### Files to create
- `supabase/007-coach-students.sql`
- `src/app/(app)/coach/page.tsx`
- `src/app/(app)/coach/students/[studentId]/page.tsx`
- `src/hooks/use-coach.ts`
- `src/components/coach/StudentCard.tsx`
- `src/components/coach/ComparisonView.tsx`

### Testing
- [ ] Coach can add a student by email
- [ ] Coach sees student list with key stats
- [ ] Coach can view any student's full dashboard
- [ ] Student data is read-only for coach
- [ ] Student can see coach is connected
- [ ] RLS prevents coach from seeing non-connected students

---

## Phase 6: Auto-Update Profile from Trading Data

### Goal
The trader profile (strengths, weaknesses, radar scores) should evolve based on actual trading patterns, not stay static from the initial CSV upload.

### Prompt
```
Build an AI-powered profile updater that analyzes the student's recent trading data and updates their trader profile automatically.

Create a new API route POST /api/profile/analyze that:

1. Fetches the student's:
   - Last 4 weeks of trades from trade_log
   - Last 4 weeks of journals from daily_journals
   - Current trader profile from trader_profiles

2. Sends to Claude AI with this prompt:
   "You are a trading psychology expert. Based on this student's recent trading data and journal entries, update their trader profile.

   Current strengths: [list]
   Current weaknesses: [list]

   Recent trades: [summary of last 4 weeks — win rate by session, by day, common mistakes, best setups]
   Recent journals: [summary of emotions, recurring themes, effort patterns]

   Generate updated:
   - strengths: [{ label, score 0-100 }] — based on ACTUAL performance, not self-assessment
   - weaknesses: [{ label, score 0-100 }]
   - radar_scores: [{ trait, value 0-100 }] for: Patience, Discipline, Risk Mgmt, Fundamentals, Technical, Psychology
   - space_method: [{ letter, word, status, note }] for S-P-A-C-E
   - behavioural_patterns: [{ pattern, frequency, trigger, severity }] — detected from journal + trade correlations

   Base scores on evidence from the data, not generic assessments."

3. Update trader_profiles with the new scores

4. Add a "Refresh Profile" button on the Profile page that runs this analysis
5. Show before/after comparison of scores

After all changes, run `npm run build` to verify no errors.
```

### Files to create/modify
- `src/app/api/profile/analyze/route.ts` (new)
- `src/app/(app)/profile/page.tsx` (add refresh button)

### Testing
- [ ] Profile scores update based on actual trade patterns
- [ ] Strengths reflect real performance (e.g. "London session specialist" if most wins are London)
- [ ] Weaknesses reflect real patterns (e.g. "Overtrading after losses" if journal shows this)
- [ ] Radar chart visibly changes after analysis
- [ ] SPACE method updates based on journal emotion data

---

## Phase 7: PDF Reports & Export

### Goal
Generate printable PDF reports that students can download and share with coaches.

### Prompt
```
Add PDF report generation for weekly and monthly performance reports.

1. Create a new API route GET /api/reports/weekly?weekStart=2026-03-23 that:
   - Fetches all data for that week (trades, journals, chart time, goals)
   - Generates an HTML report styled for print
   - Returns as a downloadable PDF (use @react-pdf/renderer or html-to-pdf)

2. Report contents:
   - Header: Student name, week range, date generated
   - Performance summary: trades, pips, R's, win rate, P/L per account
   - Session breakdown table
   - Trade log table (compact)
   - Daily journal summaries with emotions
   - Chart time tracking
   - Discipline score breakdown
   - AI insights for the week
   - Goals progress

3. Monthly report (GET /api/reports/monthly?month=2026-03):
   - Aggregates all weeks in the month
   - Includes month-over-month trends
   - Account progression

4. Add "Download Report" buttons:
   - Performance page: "Download Weekly Report" per week group
   - Settings page: "Generate Monthly Report" option

5. Style the PDF to match the app's pink theme

After all changes, run `npm run build` to verify no errors.
```

### Dependencies to install
- `@react-pdf/renderer` or `puppeteer` (for PDF generation)

### Testing
- [ ] Weekly PDF generates with correct data
- [ ] PDF is properly formatted and readable
- [ ] Monthly report aggregates correctly
- [ ] Download works in Chrome, Safari, Firefox
- [ ] Large reports (50+ trades) don't crash

---

## Phase 8: Smart Notifications & Alerts

### Goal
Proactive alerts when the student's behavior indicates risk.

### Prompt
```
Add a smart notification system that detects concerning patterns and alerts the student.

1. Create a notification computation engine (client-side) that checks:
   - Losing streak: 3+ consecutive losses → "Consider pausing and reviewing"
   - Overtrading: More than max daily trades (from settings) → "You've exceeded your trade limit"
   - Emotional trading: Journal shows "frustrated/stressed" + trade taken same day → "You traded while emotionally compromised"
   - Risk breach: percent_risked > risk limit → "Trade exceeded your risk rules"
   - Missing journal: No journal entry for a trading day → "Don't forget to journal"
   - Chart time low: Less than 30 min this week → "Your chart time is below target"
   - Win rate drop: This week's win rate is 20%+ below average → "Win rate declining"

2. Display notifications:
   - Bell icon in TopBar shows unread count (red badge)
   - Click opens a dropdown panel with notification cards
   - Each notification: icon, title, message, timestamp, dismiss button
   - Color coded: red (urgent), amber (warning), blue (info)

3. Store dismissed notifications in localStorage (no DB needed)

4. Show the most critical notification as a banner at the top of the Dashboard

After all changes, run `npm run build` to verify no errors.
```

### Files to create
- `src/lib/compute-notifications.ts`
- `src/components/ui/NotificationPanel.tsx`
- `src/components/TopBar.tsx` (update bell icon)

### Testing
- [ ] 3-loss streak triggers notification
- [ ] Overtrading detected from trade count
- [ ] Dismissed notifications don't reappear
- [ ] Notifications update when new trades are synced
- [ ] Bell badge count is accurate

---

## Phase 9: Copilot Chat (AI Conversation)

### Goal
A chat interface where students can ask questions about their trading data and get AI-powered answers.

### Prompt
```
Add a Copilot Chat feature — a floating chat widget where students can ask questions about their trading data and get personalized AI responses.

1. UI:
   - Floating chat button (bottom-right corner, pink gradient)
   - Click opens a chat panel (slide-up on mobile, side panel on desktop)
   - Message input + send button
   - Chat history (stored in localStorage)
   - Typing indicator while AI responds

2. API route POST /api/chat:
   - Accepts: { message: string, context?: string }
   - Fetches the student's recent data (last 2 weeks of trades + journals + profile)
   - Sends to Claude with system prompt:
     "You are a trading coach copilot for [student name]. You have access to their
     trading data, journal entries, and psychology profile. Answer their questions
     with specific, data-backed advice. Reference their actual trades and patterns.
     Be encouraging but honest. Keep responses concise (2-3 paragraphs max)."
   - Returns: { response: string }

3. Pre-built quick questions:
   - "What should I focus on this week?"
   - "Analyze my last 5 trades"
   - "What are my emotional patterns?"
   - "Am I ready to increase position size?"

4. Context-aware: if the chat is opened from a specific page, include that page's data as context

After all changes, run `npm run build` to verify no errors.
```

### Files to create
- `src/app/api/chat/route.ts`
- `src/components/chat/CopilotChat.tsx`
- `src/components/chat/ChatMessage.tsx`
- `src/components/AppShell.tsx` (add chat button)

### Testing
- [ ] Chat opens/closes smoothly
- [ ] AI response references actual trade data
- [ ] Quick questions generate relevant answers
- [ ] Chat history persists across page navigation
- [ ] Mobile layout works (full screen chat)
- [ ] Typing indicator shows during AI response

---

## Phase 10: Performance Optimization & Polish

### Goal
Optimize load times, reduce bundle size, improve UX polish.

### Prompt
```
Optimize the Traderess Copilot app for performance and polish:

1. Code splitting:
   - Lazy load chart components (Recharts is heavy)
   - Use dynamic imports for: all chart components, ProfileTabs, BriefingContent
   - Add suspense boundaries with skeleton fallbacks

2. Data caching:
   - Add SWR or React Query for hook-level caching
   - Cache Supabase responses for 30 seconds
   - Invalidate cache on sync completion

3. Image optimization:
   - Convert all SVG icons to sprite sheet
   - Add loading="lazy" to any images
   - Optimize favicon for all sizes

4. Bundle analysis:
   - Run next build --analyze
   - Identify largest chunks
   - Tree-shake unused Recharts components

5. UX polish:
   - Add page transition animations (fade in)
   - Smooth scroll behavior globally
   - Focus management for modals (trap focus)
   - Keyboard navigation for all interactive elements
   - aria-labels on all icon buttons
   - Dark mode toggle (optional)

6. Error boundaries:
   - Add React error boundaries around each page
   - Show friendly error message instead of white screen
   - Log errors to console with context

After all changes, run `npm run build` to verify no errors.
Run Lighthouse audit targeting 90+ on all scores.
```

### Testing
- [ ] Lighthouse Performance score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Bundle size reduced by 20%+
- [ ] No layout shift on page load
- [ ] Keyboard navigation works throughout
- [ ] Error boundary catches and displays errors gracefully

---

## Priority Order

| Phase | Effort | Impact | Priority |
|-------|--------|--------|----------|
| Phase 2: Date Range Filter | Small | High | 🔴 Do now |
| Phase 3: Briefing Automation | Medium | High | 🔴 Do now |
| Phase 8: Smart Notifications | Small | High | 🟡 Next |
| Phase 6: Profile Auto-Update | Medium | Medium | 🟡 Next |
| Phase 4: Realtime Updates | Small | Medium | 🟢 Soon |
| Phase 7: PDF Reports | Medium | Medium | 🟢 Soon |
| Phase 9: Copilot Chat | Large | High | 🟢 Soon |
| Phase 5: Coach View | Large | High | 🔵 Later |
| Phase 10: Performance | Medium | Medium | 🔵 Later |

---

## How to Execute Each Phase

For each phase:
1. **Copy the prompt** into Claude Code
2. **Review the plan** — Claude will show what files it will create/modify
3. **Let it build** — Claude writes all the code
4. **Build check** — `npm run build` must pass with 0 errors
5. **Lint check** — `npm run lint` should have 0 errors
6. **Manual test** — verify the feature works on the live site
7. **Run SQL migrations** — if new tables were created, paste SQL into Supabase
8. **Push** — `git push origin main` triggers Vercel deploy
9. **Verify on production** — check https://traderess-copilot.vercel.app
