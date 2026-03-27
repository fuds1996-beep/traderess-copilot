import Link from "next/link";
import {
  Zap,
  BarChart3,
  Brain,
  Target,
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  BookOpen,
  Clock,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/60 backdrop-blur-xl border-b border-brand-light/30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center shadow-md shadow-brand/20">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-base font-bold text-gray-900">Traderess Copilot</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Log in
            </Link>
            <Link href="/register" className="px-5 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-medium rounded-xl transition-colors shadow-md shadow-brand/20">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-light border border-brand-light/50 rounded-full text-xs text-brand-dark font-medium mb-6">
            <Sparkles size={12} /> AI-Powered Trading Copilot
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Your trading journal,
            <br />
            <span className="bg-gradient-to-r from-brand to-brand-dark bg-clip-text text-transparent">
              powered by AI
            </span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
            Connect your Google Sheet trading tracker and let AI analyze your trades,
            journal entries, and psychology — giving you insights no spreadsheet can.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register" className="flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-dark text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-brand/25">
              Start Free <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="flex items-center gap-2 px-6 py-3 bg-white/60 border border-brand-light/50 text-gray-700 text-sm font-medium rounded-xl hover:bg-brand-light transition-colors">
              I have an account
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything a trader needs</h2>
            <p className="text-gray-500">From trade logging to AI-powered coaching, all in one place.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon={BarChart3}
              title="Performance Analytics"
              description="Weekly, monthly, quarterly breakdowns with P/L charts, win rates, session analysis, and per-account tracking."
            />
            <FeatureCard
              icon={Brain}
              title="Psychology Tracking"
              description="Daily emotion tracking (before, during, after), pattern detection, and emotion-performance correlation."
            />
            <FeatureCard
              icon={Target}
              title="Discipline Scoring"
              description="Weighted discipline score based on chart time, emotional control, risk management, and plan adherence."
            />
            <FeatureCard
              icon={Sparkles}
              title="AI Insights"
              description="Smart observations computed from your data — day analysis, session comparison, streak detection, risk/reward assessment."
            />
            <FeatureCard
              icon={BookOpen}
              title="Daily Journal"
              description="Full journal with market mood, fundamentals, effort ratings, and weekly reflections — all searchable and analysable."
            />
            <FeatureCard
              icon={Shield}
              title="Weekly Briefing"
              description="AI-generated weekly review with what went well, risk guidance, no-trade zones, and a personalised pre-session checklist."
            />
            <FeatureCard
              icon={TrendingUp}
              title="Account Dashboard"
              description="Track challenge, verification, and funded accounts — auto-classified from your trades with progress toward targets."
            />
            <FeatureCard
              icon={Clock}
              title="Chart Time Tracking"
              description="Log daily study time with correlation analysis — see how your chart time affects your trading results."
            />
            <FeatureCard
              icon={CheckCircle}
              title="Goal Tracking"
              description="Set primary, process, and psychological goals. Track completion with interactive checkboxes and progress bars."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-white/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How it works</h2>
            <p className="text-gray-500">Three steps to transform your trading journey.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard step={1} title="Connect Your Sheet" description="Share your Google Sheet trading tracker. Works with any format — our AI adapts to your column layout automatically." />
            <StepCard step={2} title="AI Extracts Everything" description="Claude AI reads your messy spreadsheet and extracts trades, journals, chart time, balances, goals, and more — preserving every detail." />
            <StepCard step={3} title="Get Insights" description="Your dashboard fills with charts, psychology analysis, discipline scores, AI insights, and personalised weekly briefings." />
          </div>
        </div>
      </section>

      {/* Testimonial / Trust */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass rounded-2xl p-8 border border-brand-light/40">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center mx-auto mb-4 text-lg font-bold text-white">T</div>
            <p className="text-lg text-gray-700 italic mb-4">
              &quot;The AI actually reads my journal entries and tells me when I&apos;m trading frustrated.
              It noticed patterns I couldn&apos;t see myself — like my win rate dropping every Wednesday.&quot;
            </p>
            <p className="text-sm text-gray-500">Trading Student</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to trade smarter?</h2>
          <p className="text-gray-500 mb-8">Join students who use AI to understand their trading psychology and improve their performance.</p>
          <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-brand hover:bg-brand-dark text-white text-base font-medium rounded-xl transition-colors shadow-lg shadow-brand/25">
            <Zap size={18} /> Get Started Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-light/30 py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center">
              <Zap size={12} className="text-white" />
            </div>
            <span className="text-sm text-gray-500">Traderess Copilot</span>
          </div>
          <p className="text-xs text-gray-400">For educational purposes only — not financial advice</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: typeof BarChart3; title: string; description: string }) {
  return (
    <div className="glass rounded-2xl p-5 border border-brand-light/40 hover:border-brand-light/50 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-brand-light border border-brand-light/40 flex items-center justify-center mb-3">
        <Icon size={18} className="text-brand" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center mx-auto mb-4 text-lg font-bold text-white shadow-lg shadow-brand/20">
        {step}
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}
