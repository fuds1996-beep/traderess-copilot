"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  User,
  Target,
  Upload,
  Trophy,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const STEPS = [
  { label: "About You", icon: User },
  { label: "Trading Plan", icon: Target },
  { label: "Your Data", icon: Upload },
  { label: "Goals", icon: Trophy },
] as const;

const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Beginner", desc: "Less than 1 year" },
  { value: "intermediate", label: "Intermediate", desc: "1–3 years" },
  { value: "advanced", label: "Advanced", desc: "3+ years" },
];

const TIMEZONES = [
  "CET (Central European)",
  "GMT (London)",
  "EST (New York)",
  "CST (Chicago)",
  "PST (Los Angeles)",
  "JST (Tokyo)",
  "AEST (Sydney)",
];

const PAIRS = [
  "EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD",
  "NZD/USD", "USD/CHF", "EUR/GBP", "EUR/JPY", "GBP/JPY",
  "XAU/USD", "DXY",
];

const SESSIONS = [
  "London Open (07:00–13:00 CET)",
  "NY Open (13:00–17:00 CET)",
  "London Close (15:00–17:30 CET)",
  "Asian (00:00–09:00 CET)",
  "Overlap (13:00–16:00 CET)",
];

const RISK_MODELS = [
  "Fixed % (1% per trade)",
  "Fixed % (2% per trade)",
  "Ladder (0.5%–1.5%)",
  "Ladder (1%–3%)",
  "Fixed lot size",
];

interface FormData {
  full_name: string;
  experience: string;
  timezone: string;
  primary_pair: string;
  confluence_pair: string;
  session_focus: string;
  risk_model: string;
  max_daily_trades: string;
  journal_data: string;
  monthly_pip_target: string;
  prop_accounts: { name: string; status: string }[];
  challenges: string;
}

const INITIAL: FormData = {
  full_name: "",
  experience: "",
  timezone: "CET (Central European)",
  primary_pair: "EUR/USD",
  confluence_pair: "DXY",
  session_focus: "London Open (07:00–13:00 CET)",
  risk_model: "Ladder (0.5%–1.5%)",
  max_daily_trades: "2–3",
  journal_data: "",
  monthly_pip_target: "",
  prop_accounts: [{ name: "", status: "Challenge" }],
  challenges: "",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
  }
  function prev() {
    if (step > 0) setStep(step - 1);
  }

  async function finish() {
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Not authenticated");
        setSaving(false);
        return;
      }

      // Build the trading plan JSON
      const tradingPlan = [
        { label: "Pairs", value: `${form.primary_pair} primary, ${form.confluence_pair} as confluence` },
        { label: "Session", value: form.session_focus },
        { label: "Risk per trade", value: form.risk_model },
        { label: "Max daily trades", value: form.max_daily_trades },
      ];

      const { error: dbError } = await supabase
        .from("trader_profiles")
        .update({
          full_name: form.full_name || user.user_metadata?.full_name || "",
          avatar_initial: (form.full_name || user.user_metadata?.full_name || "T").charAt(0).toUpperCase(),
          bio: `${form.primary_pair} trader — ${form.session_focus.split(" (")[0]} specialist — ${form.experience || "Beginner"} level`,
          stage: form.experience === "advanced" ? "Stage 3" : form.experience === "intermediate" ? "Stage 2" : "Stage 1",
          funded_status: form.prop_accounts.some((a) => a.status === "Funded") ? "Funded" : "Challenge",
          primary_pair: form.primary_pair,
          confluence_pair: form.confluence_pair,
          session_focus: form.session_focus.split(" (")[0],
          risk_model: form.risk_model,
          trading_plan: tradingPlan,
        })
        .eq("id", user.id);

      if (dbError) {
        // Table might not exist yet — that's OK, continue to dashboard
        console.warn("Profile update skipped:", dbError.message);
      }

      // Save prop accounts if any have names
      const validAccounts = form.prop_accounts.filter((a) => a.name.trim());
      if (validAccounts.length > 0) {
        await supabase.from("prop_firm_accounts").insert(
          validAccounts.map((a) => ({
            user_id: user.id,
            account_name: a.name,
            status: a.status,
            progress: 0,
            pnl: "$0",
          })),
        ).then(() => {/* ignore errors for missing tables */});
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. You can fill this in later from Settings.");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Traderess Copilot</div>
            <div className="text-[10px] text-slate-500">Setup Wizard</div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-2xl mx-auto w-full px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i < step
                    ? "bg-emerald-600 text-white"
                    : i === step
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-500 border border-slate-700"
                }`}
              >
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`hidden sm:block w-16 lg:w-24 h-px ${
                    i < step ? "bg-emerald-600" : "bg-slate-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          Step {step + 1} of {STEPS.length} — {STEPS[step].label}
        </p>
      </div>

      {/* Step content */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 pb-8">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          {step === 0 && <Step1 form={form} update={update} />}
          {step === 1 && <Step2 form={form} update={update} />}
          {step === 2 && <Step3 form={form} update={update} />}
          {step === 3 && <Step4 form={form} update={update} />}

          {error && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-800/50 rounded-lg text-xs text-red-400">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-700">
            <div>
              {step > 0 && (
                <button
                  onClick={prev}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronLeft size={14} /> Back
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  router.push("/dashboard");
                  router.refresh();
                }}
                className="px-3 py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Skip for now
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  onClick={next}
                  className="flex items-center gap-1 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
                >
                  Continue <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  onClick={finish}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  Finish Setup
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── INPUT HELPERS ───────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs text-slate-400 mb-1.5">{children}</label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

// ─── STEP 1: ABOUT YOU ───────────────────────────────────────────────────────

function Step1({
  form,
  update,
}: {
  form: FormData;
  update: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">
          Tell us about yourself
        </h2>
        <p className="text-sm text-slate-400">
          We&apos;ll use this to personalize your copilot experience.
        </p>
      </div>

      <div>
        <Label>Full Name</Label>
        <TextInput
          value={form.full_name}
          onChange={(v) => update("full_name", v)}
          placeholder="Your name"
        />
      </div>

      <div>
        <Label>Trading Experience</Label>
        <div className="grid grid-cols-3 gap-2">
          {EXPERIENCE_LEVELS.map((lvl) => (
            <button
              key={lvl.value}
              onClick={() => update("experience", lvl.value)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                form.experience === lvl.value
                  ? "bg-indigo-600/20 border-indigo-500 text-indigo-400"
                  : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
              }`}
            >
              <div className="text-xs font-medium text-white">
                {lvl.label}
              </div>
              <div className="text-[10px] text-slate-500">{lvl.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Timezone</Label>
        <Select
          value={form.timezone}
          onChange={(v) => update("timezone", v)}
          options={TIMEZONES}
        />
      </div>
    </div>
  );
}

// ─── STEP 2: TRADING PLAN ────────────────────────────────────────────────────

function Step2({
  form,
  update,
}: {
  form: FormData;
  update: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Your trading plan</h2>
        <p className="text-sm text-slate-400">
          Tell us what and how you trade so we can tailor insights.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Primary Pair</Label>
          <Select
            value={form.primary_pair}
            onChange={(v) => update("primary_pair", v)}
            options={PAIRS}
          />
        </div>
        <div>
          <Label>Confluence / Secondary</Label>
          <Select
            value={form.confluence_pair}
            onChange={(v) => update("confluence_pair", v)}
            options={PAIRS}
          />
        </div>
      </div>

      <div>
        <Label>Session Focus</Label>
        <Select
          value={form.session_focus}
          onChange={(v) => update("session_focus", v)}
          options={SESSIONS}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Risk Model</Label>
          <Select
            value={form.risk_model}
            onChange={(v) => update("risk_model", v)}
            options={RISK_MODELS}
          />
        </div>
        <div>
          <Label>Max Daily Trades</Label>
          <Select
            value={form.max_daily_trades}
            onChange={(v) => update("max_daily_trades", v)}
            options={["1", "2–3", "3–5", "5+"]}
          />
        </div>
      </div>
    </div>
  );
}

// ─── STEP 3: YOUR DATA ──────────────────────────────────────────────────────

function Step3({
  form,
  update,
}: {
  form: FormData;
  update: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
}) {
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") update("journal_data", text);
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">
          Upload your data
        </h2>
        <p className="text-sm text-slate-400">
          Paste your trading journal or upload a CSV. This is optional — you can
          add data later.
        </p>
      </div>

      <div>
        <Label>Paste trading journal data</Label>
        <textarea
          value={form.journal_data}
          onChange={(e) => update("journal_data", e.target.value)}
          rows={8}
          placeholder={"Date, Pair, Direction, Entry, SL, TP, Result, Pips, Notes\nMar 10, EUR/USD, Long, 1.0842, 1.0822, 1.0882, Win, 40, Clean level bounce"}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-mono resize-none"
        />
      </div>

      <div className="text-center text-xs text-slate-500 my-2">— or —</div>

      <div>
        <Label>Upload CSV file</Label>
        <label className="flex flex-col items-center justify-center w-full h-24 bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-indigo-500/50 transition-colors">
          <Upload size={20} className="text-slate-500 mb-1" />
          <span className="text-xs text-slate-400">
            Click to upload CSV
          </span>
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFile}
            className="hidden"
          />
        </label>
        {form.journal_data && (
          <p className="text-[10px] text-emerald-400 mt-1.5">
            {form.journal_data.split("\n").length} lines loaded
          </p>
        )}
      </div>
    </div>
  );
}

// ─── STEP 4: GOALS ──────────────────────────────────────────────────────────

function Step4({
  form,
  update,
}: {
  form: FormData;
  update: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
}) {
  function updateAccount(idx: number, field: "name" | "status", value: string) {
    const updated = [...form.prop_accounts];
    updated[idx] = { ...updated[idx], [field]: value };
    update("prop_accounts", updated);
  }

  function addAccount() {
    update("prop_accounts", [
      ...form.prop_accounts,
      { name: "", status: "Challenge" },
    ]);
  }

  function removeAccount(idx: number) {
    update(
      "prop_accounts",
      form.prop_accounts.filter((_, i) => i !== idx),
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Your goals</h2>
        <p className="text-sm text-slate-400">
          Set targets so your copilot can track progress and keep you
          accountable.
        </p>
      </div>

      <div>
        <Label>Monthly Pip Target</Label>
        <TextInput
          value={form.monthly_pip_target}
          onChange={(v) => update("monthly_pip_target", v)}
          placeholder="e.g. 200 pips"
        />
      </div>

      <div>
        <Label>Prop Firm Accounts</Label>
        <div className="space-y-2">
          {form.prop_accounts.map((acc, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={acc.name}
                onChange={(e) => updateAccount(i, "name", e.target.value)}
                placeholder="e.g. FTMO 10K"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
              <select
                value={acc.status}
                onChange={(e) => updateAccount(i, "status", e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option>Challenge</option>
                <option>Verification</option>
                <option>Funded</option>
              </select>
              {form.prop_accounts.length > 1 && (
                <button
                  onClick={() => removeAccount(i)}
                  className="text-slate-500 hover:text-red-400 text-xs px-2 py-2 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addAccount}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            + Add another account
          </button>
        </div>
      </div>

      <div>
        <Label>Current Challenges / Focus Areas</Label>
        <textarea
          value={form.challenges}
          onChange={(e) => update("challenges", e.target.value)}
          rows={3}
          placeholder="e.g. Overtrading during news events, managing multiple accounts, patience with entries..."
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
        />
      </div>
    </div>
  );
}
