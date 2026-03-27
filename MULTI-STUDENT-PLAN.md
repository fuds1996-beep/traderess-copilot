# Multi-Student Flexibility Plan

## Comparison: Marlena's Tracker vs Rameez's Tracker

### What's the SAME (already works)
| Feature | Marlena | Rameez | Status |
|---------|---------|--------|--------|
| Core trade columns (Date, Pair, Session, Direction, Entry/SL/TP, Result, Pips, R's, R2R, $, %) | ✅ | ✅ | Works |
| Entry Strategy / SL Strategy / TP Strategy | ✅ | ✅ | Works |
| Entry Conf 1/2/3 | ✅ | ✅ | Works |
| Fundamental check / Event / Safe window | ✅ | ✅ | Works |
| Before/After TradingView screenshots | ✅ | ✅ | Works |
| Trade Quality (stars) | ✅ | ✅ | Works |
| Forecasted? | ✅ | ✅ | Works |
| Trade Evaluation (full text) | ✅ | ✅ | Works |
| Missed/Avoided Trades section | ✅ | ✅ | Works |
| Multiple accounts per student | ✅ | ✅ | Works |
| Starting balance per account | ✅ | ✅ | Works |
| Chart time tracking | ✅ | ✅ | Works |
| Daily journal entries | ✅ | ✅ | Works |

### What's DIFFERENT (needs changes)

#### 1. EXTRA TRADE COLUMNS — Rameez has columns Marlena doesn't
| Column | Rameez has | Marlena has | Impact |
|--------|-----------|-------------|--------|
| RSI rate | ✅ (number, e.g. 40) | ❌ | New field |
| TP Conf 1 | ✅ (e.g. "Session high/low") | ❌ | New field |
| DXY conf? | ✅ ("Yes used as confirmation") | ❌ | New field |
| DXY conf 1 | ✅ (e.g. "DXY SH&L") | ❌ | New field |
| DXY conf 2? | ✅ (e.g. "N/A") | ❌ | New field |
| % Gained/lost | ✅ (separate from % Risked) | ❌ | New field |
| Starting balance | ✅ (per account section) | ✅ | Already captured |

**Problem**: Our `Trade` type has fixed fields. Rameez's extra columns get lost during sync.

**Solution**: Add a `custom_fields` JSONB column to `trade_log` that stores any extra key-value pairs the AI parser finds. The AI is already smart enough to extract them — we just need a place to store them and display them.

#### 2. JOURNAL STRUCTURE — Completely different format
| Aspect | Marlena | Rameez |
|--------|---------|--------|
| Emotion tracking | Before/During/After (text) | Before/During/Post (text) ✅ same |
| Effort rating | Stars (1-5) | Stars (1-5) ✅ same |
| Market mood | Text | Text ✅ same |
| Fundamentals | Text | Text ✅ same |
| **Category ratings** | ❌ None | ✅ Forecasting /5, Psychology /5, Execution /5, Journalling /5 |
| **Daily system tracker** | ❌ None | ✅ Full checklist (Upon Waking, Pre Session, During Session, Post Session, Evening) with tasks, notes, time, done status |

**Problem**: Rameez rates each day on 4 categories (Forecasting, Psychology, Execution, Journalling) which we don't capture. His daily system tracker is a structured checklist we don't have.

**Solution**: Add `category_ratings` JSONB to `daily_journals` for flexible per-category scores. The daily system tracker can be stored as a `daily_checklist` JSONB array.

#### 3. SPACE TREATMENT PLAN — Different tracking style
| Aspect | Marlena | Rameez |
|--------|---------|--------|
| Format | Static assessment (good/warning per letter) | **Active daily tracking** with Yes/No per day + weekly score |
| Categories | S-P-A-C-E standard | Custom: Wake Time, Bed Time, Morning Activation, Evening Wind-Down, Cognitive Prep |
| Scoring | None | X/5 per category per week |

**Problem**: Marlena's SPACE is a one-time assessment. Rameez tracks it daily as a habit tracker.

**Solution**: Already partially handled — the comprehensive parser extracts SPACE data. For Rameez's format, the parser needs to extract the daily Yes/No tracking and weekly scores. Store in the existing `space_method` field or add a `habit_tracker` JSONB to `daily_journals`.

#### 4. ANALYSIS SECTIONS — Rameez has detailed daily analysis
| Aspect | Marlena | Rameez |
|--------|---------|--------|
| HTF bias notes | ❌ | ✅ Monthly/Quarterly EURUSD + DXY with TradingView links |
| Daily analysis | ❌ | ✅ Per-day analysis for both EURUSD and DXY with detailed notes |
| Weekend analysis | ❌ | ✅ Weekly/Daily/4hr chart analysis |
| Alert tracking | ❌ | ✅ Date, Time, TradingView URL per alert |

**Problem**: Rich analysis data that provides context for trades — currently lost.

**Solution**: This data is valuable for the AI briefing generator. Store in `weekly_summaries.trading_plan_text` (already exists) and add an `analysis_notes` JSONB for daily analysis entries.

#### 5. RISK MANAGEMENT PLAN — Different per account type
| Aspect | Marlena | Rameez |
|--------|---------|--------|
| Challenge risk | Ladder 0.5-1.5% | 3.8% base, 2.1% after loss, max 3 trades |
| Verification risk | Same as above | 2.5% trade 1, 1.25% trades 2-3 |
| Funded risk | Same | 0.25% base, 0.5% after +1% profit |
| Lot size tables | ❌ | ✅ Per SL size (10/20/30 pips) per account type |

**Problem**: Different students have different risk rules that inform the discipline scoring.

**Solution**: Store risk management plan in `trader_profiles` as a `risk_plan` JSONB. The discipline scoring can then use the student's actual rules instead of hardcoded thresholds.

#### 6. WEEKLY GOALS — More structured
| Aspect | Marlena | Rameez |
|--------|---------|--------|
| Goals format | Monthly goals only | Weekly goals with specific targets (trades, R's, win rate) |
| Task checklist | ❌ | ✅ Daily tasks per day of week (Saturday analysis, Monday space plan, etc.) |

**Problem**: Our goals system is monthly-only. Rameez has weekly targets with specific numbers.

**Solution**: Already have `trading_goals` with `period_type: "weekly" | "monthly"`. The comprehensive parser just needs to extract weekly goals too.

#### 7. CAP WAVE TABLE — Rameez has market structure data
| Aspect | Marlena | Rameez |
|--------|---------|--------|
| Cap waves | Partial (just numbers) | Full table: EURUSD/GBPUSD/DXY × Monthly/Weekly/Daily/4hr/1hr/15min |

**Problem**: Market structure data not captured.

**Solution**: Low priority — this is reference data. Could store in `weekly_summaries` JSONB.

---

## Changes Needed (Priority Order)

### 🔴 HIGH PRIORITY — Must fix for multi-student

#### 1. Add `custom_fields` JSONB to trade_log
```sql
ALTER TABLE trade_log ADD COLUMN IF NOT EXISTS custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb;
```
- AI parser stores any extra columns it finds (RSI rate, DXY conf, TP conf, etc.)
- TradeLogTable renders custom_fields as additional columns
- Edit modal shows them as extra text fields
- Each student's custom fields auto-discovered from their data

#### 2. Add `category_ratings` + `daily_checklist` JSONB to daily_journals
```sql
ALTER TABLE daily_journals
  ADD COLUMN IF NOT EXISTS category_ratings jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS daily_checklist jsonb NOT NULL DEFAULT '[]'::jsonb;
```
- `category_ratings`: `{"forecasting": 4, "psychology": 3, "execution": 4, "journalling": 3}`
- `daily_checklist`: `[{"task": "HTF bias reviewed", "done": true, "time": "11:31", "notes": "..."}]`

#### 3. Update AI parsers to extract custom fields
- Both `ai-sheet-parser.ts` and `ai-comprehensive-parser.ts` need to:
  - Extract any columns that don't map to known fields → store in `custom_fields`
  - Extract category ratings from journal sections
  - Extract daily checklist data

#### 4. Update TradeLogTable to show custom_fields
- After the fixed columns, render any keys from `custom_fields` as additional columns
- Add them to the column visibility picker
- Show in the edit modal as extra fields

### 🟡 MEDIUM PRIORITY — Improves experience

#### 5. Add `risk_plan` JSONB to trader_profiles
- Stores the student's specific risk rules per account type
- Used by discipline scoring instead of hardcoded 3.6% threshold

#### 6. Update discipline scoring to use student's risk plan
- Read from `trader_profiles.risk_plan` instead of hardcoded values
- Each student's discipline scored against their OWN rules

#### 7. Support weekly goals in addition to monthly
- The parser already has the infrastructure
- Just needs the AI prompt to look for weekly targets

### 🟢 LOW PRIORITY — Nice to have

#### 8. Alert tracking table
- New table for storing alert timestamps + TradingView URLs
- Could correlate with trades (which alerts led to entries)

#### 9. Daily analysis notes storage
- Store per-day EURUSD + DXY analysis in a structured format
- Useful for briefing generation

#### 10. Lot size calculator widget
- Based on the student's risk plan + account size + SL distance
- Auto-calculates correct lot size

---

## What Already Works (No Changes Needed)

The AI parser is the hero here — it already handles:
- ✅ Different column orders and names
- ✅ Different account section layouts
- ✅ Multiple accounts with starting balances
- ✅ Different date formats
- ✅ Decorative rows, merged cells, goals sections
- ✅ Full journal text preservation
- ✅ Missed/avoided trades sections

The auth system already supports multiple students:
- ✅ Each student has their own login
- ✅ RLS ensures students only see their own data
- ✅ Profiles are independent per user
- ✅ All tables scoped by user_id

---

## Implementation Plan

### Phase A: Database flexibility (1 prompt)
Add custom_fields to trade_log, category_ratings to daily_journals.
Update AI parsers to extract and store extra data.

### Phase B: UI flexibility (1 prompt)
Update TradeLogTable to render custom fields.
Update Journal to show category ratings.
Update edit modals to include custom fields.

### Phase C: Risk plan personalization (1 prompt)
Add risk_plan to trader_profiles.
Update discipline scoring to use student's rules.
Add risk plan section to Profile page.

### Phase D: Test with Rameez's data (manual)
Create account for Rameez.
Sync his March 23 sheet.
Verify all data extracts correctly.
Verify custom fields display properly.
