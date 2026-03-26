# Traderess Trading Copilot — Deployment & Scaling Guide

## Your Recommended Setup

Since your main site (traderess.com) runs on Kajabi, the best approach is to host the copilot app on a **subdomain** like `app.traderess.com`. This keeps your Kajabi site untouched while giving the copilot its own home.

---

## PHASE 1: Get It Live (Today — No Developer Needed)

### Option A: Deploy on Vercel (Recommended — Free)

Vercel is the easiest way to get a website live. No coding required.

**Step 1: Create a Vercel account**
- Go to [vercel.com](https://vercel.com)
- Sign up with your Google account or email

**Step 2: Deploy the app**
- Go to [vercel.com/new](https://vercel.com/new)
- Click "Upload" (not "Import Git Repository")
- Drag and drop the entire `traderess-copilot` folder (the one containing `index.html`)
- Click "Deploy"
- Vercel will give you a URL like `traderess-copilot-abc123.vercel.app`

**Step 3: Add your custom subdomain**
- In the Vercel dashboard, go to your project → Settings → Domains
- Add `app.traderess.com`
- Vercel will show you DNS records to add

**Step 4: Update your DNS**
- Log into wherever you manage your domain (GoDaddy, Namecheap, Cloudflare, etc.)
- Add a CNAME record:
  - Name: `app`
  - Value: `cname.vercel-dns.com`
- Wait 5–30 minutes for DNS to propagate
- Visit `app.traderess.com` — your copilot is live!

### Option B: Deploy on Netlify (Also Free)

- Go to [netlify.com](https://netlify.com) and sign up
- Click "Add new site" → "Deploy manually"
- Drag and drop the `traderess-copilot` folder
- Go to Site Settings → Domain management → Add custom domain → `app.traderess.com`
- Update your DNS with the records Netlify provides

---

## PHASE 2: Add User Login & Accounts (Needs a Developer)

The prototype currently shows demo data. To make it a real SaaS where each student has their own data, you'll need a backend. Here's what to tell your developer:

### Recommended Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js (React) | The JSX prototype converts directly. Best React framework. |
| Hosting | Vercel | Free tier handles thousands of users. Auto-deploys from Git. |
| Database | Supabase (free tier) | PostgreSQL database with built-in auth. No server to manage. |
| Auth | Supabase Auth or Clerk | Student login with email/password or Google. |
| Payments | Stripe | You already have Stripe connected — use it for subscriptions. |
| File Storage | Supabase Storage | For storing trader profiles, briefing PDFs, etc. |

### Database Tables Needed

```
users
  - id, email, name, stage (1/2/3), subscription_status, created_at

trader_profiles
  - user_id, trading_pairs, session_focus, risk_model, strengths (JSON),
    weaknesses (JSON), space_assessment (JSON), behavioural_patterns (JSON)

trading_performance
  - user_id, week_start, week_end, pnl, trades_count, win_rate, r_value,
    best_trade, worst_trade, notes

trade_log
  - user_id, date, pair, direction, entry, sl, tp, result, pips, rr,
    session, notes, psychology_notes

weekly_briefings
  - user_id, week_start, market_context, calendar_events (JSON),
    copilot_guidance, articles_eurusd (JSON), articles_dxy (JSON),
    previous_week_review

prop_firm_accounts
  - user_id, account_name, account_size, status, progress, pnl

copilot_settings
  - user_id, news_sources (JSON), schedule_config (JSON),
    skills_enabled (JSON), timezone
```

### API Endpoints Needed

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/profile            — get trader profile
PUT    /api/profile            — update trader profile
GET    /api/performance        — get performance data
POST   /api/performance        — add week's performance
GET    /api/trades             — get trade log
POST   /api/trades             — log a trade
GET    /api/briefing/latest    — get latest weekly briefing
POST   /api/briefing/generate  — trigger briefing generation
GET    /api/settings           — get copilot settings
PUT    /api/settings           — update settings
```

### User Flow

1. Student goes to `app.traderess.com`
2. Signs up / logs in (email or Google)
3. Completes onboarding wizard:
   - Trading pairs they trade
   - Their timezone
   - Their session focus
   - Upload or paste initial trading data
4. The app builds their trader profile automatically
5. Each week they either:
   - Manually paste their week's trading data, OR
   - Connect their Google Sheet (via Google Sheets API)
6. The app auto-generates weekly briefings and updates performance

---

## PHASE 3: Full SaaS with Payments (Scale)

### Stripe Integration

You already have Stripe connected. Here's the pricing structure to set up:

**Suggested Plans:**
- Free Tier: View demo data, explore the app
- Pro ($20/month): Full copilot access, weekly briefings, performance tracking
- Academy ($X/month): Bundled with your Traderess mentorship (existing Kajabi pricing)

**What your developer needs to do:**
1. Create Stripe Products and Prices in your Stripe dashboard
2. Add Stripe Checkout for subscription signup
3. Use Stripe webhooks to activate/deactivate user access
4. Add a billing portal link so users can manage their subscription

### Connecting Kajabi Students

Since your students already pay through Kajabi, you have two options:

**Option 1: Separate login (simpler)**
- Students create a separate account on app.traderess.com
- You give them a special coupon code or invite link
- They get access as part of their Kajabi membership

**Option 2: SSO / shared access (more complex)**
- Use Kajabi's webhook to auto-create accounts when students enroll
- Requires Kajabi API access (available on higher Kajabi plans)
- Your developer would build a middleware that syncs Kajabi enrollments to Supabase

### Live Data Integrations (Future)

For the news/fundamentals feature to work automatically:

| Feature | Integration | Difficulty |
|---------|------------|------------|
| Economic Calendar | MyFXBook API or scraping | Medium |
| EUR/USD News | FX Street RSS / scraping | Medium |
| DXY Analysis | FX Street RSS / scraping | Medium |
| Google Sheets sync | Google Sheets API | Easy |
| Trading View charts | TradingView widget embed | Easy |
| AI-powered analysis | Claude API (Anthropic) | Medium |

The Claude API can be used to:
- Analyse pasted trading data and generate insights
- Summarise news articles
- Generate personalised copilot guidance
- Identify behavioural patterns from journal entries

---

## What to Do Right Now

### Today (15 minutes)
1. Open the `traderess-copilot` folder
2. Open `index.html` in your browser to preview
3. Deploy to Vercel (drag and drop)
4. Share the URL with your students as a preview

### This Week
1. Set up `app.traderess.com` subdomain
2. Share with your academy for feedback
3. Decide: hire a developer or find a technical co-founder

### Finding a Developer

For this project, you need a **full-stack JavaScript developer** familiar with:
- React / Next.js
- Supabase or similar
- Stripe integration
- Basic web scraping

**Where to find one:**
- Upwork (search "Next.js Supabase developer") — budget £2,000–5,000 for MVP
- Toptal (higher quality, higher price)
- Twitter/X — post about your project, trading/fintech devs love this kind of thing
- Your own network — any of your students who code?

**What to send them:**
1. This guide
2. The `TradingCopilot.jsx` file (React component structure)
3. The `index.html` file (working prototype to reference)
4. The webinar recording (so they understand the vision)

---

## Cost Breakdown

### Running Costs (Monthly)

| Service | Cost | Notes |
|---------|------|-------|
| Vercel hosting | Free | Up to 100GB bandwidth |
| Supabase database | Free | Up to 500MB, 50K monthly active users |
| Custom domain (DNS) | Already own | traderess.com |
| Stripe | 2.9% + 30p per transaction | Only when charging users |
| Claude API (optional) | ~$20–50/month | For AI-powered analysis features |
| **Total (pre-revenue)** | **$0–50/month** | |

### Development Costs (One-Time)

| Phase | Estimate | What You Get |
|-------|----------|-------------|
| Phase 1: Deploy prototype | Free (do it yourself) | Live demo at app.traderess.com |
| Phase 2: Add auth + database | £2,000–4,000 | Students can log in, save data |
| Phase 3: Full SaaS + Stripe | £3,000–5,000 | Payments, auto-briefings, API integrations |
| **Total MVP** | **£5,000–9,000** | Full working SaaS product |

---

## Important Notes

- All trading features in this app are for **educational and demo purposes only**
- The app does not provide financial advice or direct trading recommendations
- Students should always use **demo/paper trading** accounts when testing strategies
- Market data shown is for illustrative purposes — live integrations require API subscriptions
