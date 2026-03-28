"use client";

import { useState } from "react";
import {
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Trophy,
  ShieldAlert,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Heart,
  Pencil,
  Save,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import ProgressBar from "@/components/ui/ProgressBar";
import Badge from "@/components/ui/Badge";
import { LazySkillRadarChart as SkillRadarChart } from "@/components/charts/lazy";
import { createClient } from "@/lib/supabase/client";
import type { TraderProfile, PropFirmAccount } from "@/lib/types";

const TABS = ["overview", "psychology", "strengths", "fears", "plan"] as const;
type Tab = (typeof TABS)[number];

export default function ProfileTabs({
  profile,
  propAccounts,
  onRefresh,
}: {
  profile: TraderProfile;
  propAccounts: PropFirmAccount[];
  onRefresh?: () => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <>
      <div className="flex gap-1 border-b border-brand-light/40 pb-0 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t
                ? "border-brand text-brand"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab profile={profile} onRefresh={onRefresh} />}
      {tab === "psychology" && <PsychologyTab profile={profile} />}
      {tab === "strengths" && <StrengthsTab profile={profile} />}
      {tab === "fears" && <FearsTab profile={profile} />}
      {tab === "plan" && <PlanTab profile={profile} propAccounts={propAccounts} />}
    </>
  );
}

function OverviewTab({ profile, onRefresh }: { profile: TraderProfile; onRefresh?: () => void }) {
  const [editingStrengths, setEditingStrengths] = useState(false);
  const [editingWeaknesses, setEditingWeaknesses] = useState(false);
  const [strengths, setStrengths] = useState(profile.strengths || []);
  const [weaknesses, setWeaknesses] = useState(profile.weaknesses || []);

  async function saveList(field: "strengths" | "weaknesses", data: { label: string; score: number }[]) {
    const supabase = createClient();
    await supabase.from("trader_profiles").update({ [field]: data }).eq("id", profile.id);
    if (field === "strengths") setEditingStrengths(false);
    else setEditingWeaknesses(false);
    onRefresh?.();
  }

  return (
    <div className="space-y-6 pt-4">
      {(profile.strengths?.length > 0 || profile.weaknesses?.length > 0 || true) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-5 border border-brand-light/40">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-400" />
                <h3 className="text-sm font-semibold text-gray-900">Strengths</h3>
              </div>
              {editingStrengths ? (
                <div className="flex gap-1">
                  <button onClick={() => saveList("strengths", strengths)} className="p-1 text-emerald-500 hover:text-emerald-600"><Save size={14} /></button>
                  <button onClick={() => { setStrengths(profile.strengths || []); setEditingStrengths(false); }} className="p-1 text-gray-400 hover:text-gray-600"><X size={14} /></button>
                </div>
              ) : (
                <button onClick={() => setEditingStrengths(true)} className="p-1 text-gray-400 hover:text-brand"><Pencil size={12} /></button>
              )}
            </div>
            {editingStrengths ? (
              <EditableScoreList items={strengths} onChange={setStrengths} color="emerald" />
            ) : (
              <div className="space-y-3">
                {(profile.strengths || []).length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No strengths yet. Click edit to add.</p>
                ) : profile.strengths.map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{s.label}</span>
                      <span className="text-emerald-500">{s.score}%</span>
                    </div>
                    <ProgressBar value={s.score} color="bg-emerald-500" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="glass rounded-2xl p-5 border border-brand-light/40">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-400" />
                <h3 className="text-sm font-semibold text-gray-900">Weaknesses</h3>
              </div>
              {editingWeaknesses ? (
                <div className="flex gap-1">
                  <button onClick={() => saveList("weaknesses", weaknesses)} className="p-1 text-emerald-500 hover:text-emerald-600"><Save size={14} /></button>
                  <button onClick={() => { setWeaknesses(profile.weaknesses || []); setEditingWeaknesses(false); }} className="p-1 text-gray-400 hover:text-gray-600"><X size={14} /></button>
                </div>
              ) : (
                <button onClick={() => setEditingWeaknesses(true)} className="p-1 text-gray-400 hover:text-brand"><Pencil size={12} /></button>
              )}
            </div>
            {editingWeaknesses ? (
              <EditableScoreList items={weaknesses} onChange={setWeaknesses} color="red" />
            ) : (
              <div className="space-y-3">
                {(profile.weaknesses || []).length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No weaknesses yet. Click edit to add.</p>
                ) : profile.weaknesses.map((w, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{w.label}</span>
                      <span className="text-red-500">{w.score}%</span>
                    </div>
                    <ProgressBar value={w.score} color="bg-red-500" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {profile.radar_scores?.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-brand-light/40">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Trading Skill Radar</h3>
          <div className="flex justify-center"><SkillRadarChart data={profile.radar_scores} /></div>
        </div>
      )}
      {profile.successes?.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-brand-light/40">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900">Successes</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {profile.successes.map((s, i) => (
              <div key={i} className="p-3 bg-amber-50/60 border border-amber-200/30 rounded-xl">
                <div className="text-xs font-semibold text-gray-900 mb-1">{s.title}</div>
                <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-3">{s.how_benefited || s.description}</p>
                {s.time_taken && <p className="text-[10px] text-gray-400 mt-1">{s.time_taken}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {(profile.hobbies?.length > 0 || profile.expectations?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {profile.hobbies?.length > 0 && (
            <div className="glass rounded-2xl p-5 border border-brand-light/40">
              <div className="flex items-center gap-2 mb-3">
                <Heart size={14} className="text-brand" />
                <h3 className="text-sm font-semibold text-gray-900">Hobbies & Interests</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.hobbies.map((h, i) => (
                  <span key={i} className="text-[11px] px-2.5 py-1 bg-brand-light/80 border border-brand-light/30 rounded-lg text-gray-600">{h}</span>
                ))}
              </div>
            </div>
          )}
          {profile.expectations?.length > 0 && (
            <div className="glass rounded-2xl p-5 border border-brand-light/40">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-brand" />
                <h3 className="text-sm font-semibold text-gray-900">Goals & Expectations</h3>
              </div>
              <ul className="space-y-1.5">
                {profile.expectations.map((e, i) => (
                  <li key={i} className="text-[11px] text-gray-600 flex items-start gap-2"><span className="text-brand mt-0.5">•</span>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PsychologyTab({ profile }: { profile: TraderProfile }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const hasDeepData = profile.detailed_weaknesses?.length > 0 || profile.detailed_strengths?.length > 0;

  if (!hasDeepData) {
    return (
      <div className="space-y-4 pt-4">
        {profile.space_method?.length > 0 && (
          <div className="glass rounded-2xl p-5 border border-brand-light/40">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">SPACE Method</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {profile.space_method.map((s) => (
                <div key={s.letter} className={`p-4 rounded-lg border ${s.status === "good" ? "bg-emerald-50/60 border-emerald-200/40" : "bg-amber-50/60 border-amber-200/40"}`}>
                  <div className={`text-2xl font-bold mb-1 ${s.status === "good" ? "text-emerald-500" : "text-amber-500"}`}>{s.letter}</div>
                  <div className="text-xs font-medium text-gray-900 mb-1">{s.word}</div>
                  <div className="text-[10px] text-gray-500 leading-relaxed">{s.note}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {profile.behavioural_patterns?.length > 0 && (
          <div className="glass rounded-2xl p-5 border border-brand-light/40">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Behavioural Patterns</h3>
            <div className="space-y-2">
              {profile.behavioural_patterns.map((p) => (
                <div key={p.pattern} className="flex items-start gap-4 p-3 bg-brand-light/80 rounded-lg">
                  <AlertCircle size={16} className={`mt-0.5 shrink-0 ${p.severity === "high" ? "text-red-400" : "text-amber-400"}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><span className="text-sm font-medium text-gray-900">{p.pattern}</span><Badge variant={p.severity === "high" ? "danger" : "warning"}>{p.severity}</Badge></div>
                    <div className="text-xs text-gray-500 mt-0.5">Frequency: {p.frequency}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Trigger: {p.trigger}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <p className="text-xs text-gray-400 text-center">Upload your Trader Profile CSV for detailed psychology analysis with impact assessments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4">
      {profile.detailed_weaknesses.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-brand-light/40">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900">Weaknesses</h3>
            <span className="text-[10px] text-gray-400">{profile.detailed_weaknesses.length} identified</span>
          </div>
          <div className="space-y-2">
            {profile.detailed_weaknesses.map((w, i) => (
              <ExpandableItem key={i} item={w} idx={i} expandedIdx={expandedIdx} setExpandedIdx={setExpandedIdx} type="weakness" />
            ))}
          </div>
        </div>
      )}
      {profile.detailed_strengths.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-brand-light/40">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={16} className="text-emerald-500" />
            <h3 className="text-sm font-semibold text-gray-900">Strengths</h3>
            <span className="text-[10px] text-gray-400">{profile.detailed_strengths.length} identified</span>
          </div>
          <div className="space-y-2">
            {profile.detailed_strengths.map((s, i) => (
              <ExpandableItem key={i} item={s} idx={i + 100} expandedIdx={expandedIdx} setExpandedIdx={setExpandedIdx} type="strength" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ExpandableItem({ item, idx, expandedIdx, setExpandedIdx, type }: {
  item: { name: string; real_life_example: string; affects_learning: string; affects_planning: string; affects_execution: string; affects_results: string; affects_evaluation: string };
  idx: number; expandedIdx: number | null; setExpandedIdx: (v: number | null) => void; type?: "weakness" | "strength";
}) {
  const isOpen = expandedIdx === idx;
  return (
    <div className="border border-brand-light/30 rounded-xl overflow-hidden">
      <button onClick={() => setExpandedIdx(isOpen ? null : idx)} className="w-full flex items-center justify-between p-3 text-left hover:bg-brand-light/40 transition-colors">
        <span className="text-sm font-medium text-gray-900">{item.name}</span>
        {isOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {isOpen && (
        <div className="px-3 pb-3 space-y-3 border-t border-brand-light/20 pt-3">
          {item.real_life_example && (
            <div>
              <div className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wide">Real-life example</div>
              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{item.real_life_example}</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {[
              { label: "Learning", text: item.affects_learning, color: "bg-blue-50/60 border-blue-200/30", labelColor: "text-blue-600" },
              { label: "Planning", text: item.affects_planning, color: "bg-purple-50/60 border-purple-200/30", labelColor: "text-purple-600" },
              { label: "Execution", text: item.affects_execution, color: "bg-brand-light/60 border-brand-light/30", labelColor: "text-brand-dark" },
              { label: "Results", text: item.affects_results, color: "bg-amber-50/60 border-amber-200/30", labelColor: "text-amber-600" },
              { label: "Evaluation", text: item.affects_evaluation, color: "bg-emerald-50/60 border-emerald-200/30", labelColor: "text-emerald-600" },
            ].filter((c) => c.text).map((c) => (
              <div key={c.label} className={`p-2.5 rounded-xl border ${c.color}`}>
                <div className={`text-[9px] font-semibold mb-1 uppercase tracking-wide ${c.labelColor}`}>Affects {c.label}</div>
                <p className="text-[11px] text-gray-600 leading-relaxed">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StrengthsTab({ profile }: { profile: TraderProfile }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  if (!profile.successes?.length) return <p className="text-sm text-gray-400 py-8 text-center">No success data uploaded yet.</p>;
  return (
    <div className="space-y-3 pt-4">
      {profile.successes.map((s, i) => (
        <div key={i} className="glass rounded-2xl border border-brand-light/40 overflow-hidden">
          <button onClick={() => setExpandedIdx(expandedIdx === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left hover:bg-brand-light/40 transition-colors">
            <div className="flex items-center gap-3"><Trophy size={16} className="text-amber-500" /><span className="text-sm font-semibold text-gray-900">{s.title}</span></div>
            {expandedIdx === i ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
          </button>
          {expandedIdx === i && (
            <div className="px-4 pb-4 space-y-3 border-t border-brand-light/20 pt-3">
              {s.description && <div><div className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wide">What happened</div><p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{s.description}</p></div>}
              {s.how_benefited && <div><div className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wide">How it benefited me</div><p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{s.how_benefited}</p></div>}
              {s.how_achieved && <div><div className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wide">How I achieved it</div><p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{s.how_achieved}</p></div>}
              {s.time_taken && <div className="text-[10px] text-gray-400">Time: {s.time_taken}</div>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function FearsTab({ profile }: { profile: TraderProfile }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  if (!profile.fears?.length) return <p className="text-sm text-gray-400 py-8 text-center">No fears data uploaded yet.</p>;
  return (
    <div className="space-y-3 pt-4">
      {profile.fears.map((f, i) => (
        <div key={i} className="glass rounded-2xl border border-brand-light/40 overflow-hidden">
          <button onClick={() => setExpandedIdx(expandedIdx === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left hover:bg-brand-light/40 transition-colors">
            <div className="flex items-center gap-3"><ShieldAlert size={16} className="text-red-400" /><span className="text-sm font-semibold text-gray-900">{f.title}</span></div>
            {expandedIdx === i ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
          </button>
          {expandedIdx === i && (
            <div className="px-4 pb-4 space-y-3 border-t border-brand-light/20 pt-3">
              {f.description && <div><div className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wide">How it affected me</div><p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{f.description}</p></div>}
              {f.how_overcome && (
                <div className="p-3 bg-emerald-50/60 border border-emerald-200/30 rounded-xl">
                  <div className="text-[10px] text-emerald-600 font-semibold mb-1 uppercase tracking-wide">How I overcame it</div>
                  <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{f.how_overcome}</p>
                </div>
              )}
              {f.plan_to_overcome && (
                <div className="p-3 bg-brand-light/60 border border-brand-light/30 rounded-xl">
                  <div className="text-[10px] text-brand-dark font-semibold mb-1 uppercase tracking-wide">Plan to overcome</div>
                  <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{f.plan_to_overcome}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PlanTab({ profile, propAccounts }: { profile: TraderProfile; propAccounts: PropFirmAccount[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
      {profile.trading_plan?.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-brand-light/40">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Trading Plan</h3>
          <div className="space-y-3 text-sm">
            {profile.trading_plan.map((r) => (
              <div key={r.label} className="flex justify-between py-1.5 border-b border-brand-light/30 last:border-0">
                <span className="text-gray-500">{r.label}</span>
                <span className="text-gray-900 font-medium text-right">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {propAccounts.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-brand-light/40">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Prop Firm Accounts</h3>
          <div className="space-y-3">
            {propAccounts.map((a) => (
              <div key={a.id} className="p-3 bg-brand-light/80 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-900">{a.account_name}</span>
                  <div className="flex items-center gap-2"><Badge variant="info">{a.status}</Badge><span className="text-xs text-emerald-500 font-medium">{a.pnl}</span></div>
                </div>
                <ProgressBar value={a.progress} color="bg-brand" />
                <span className="text-[10px] text-gray-400 mt-1 block">{a.progress}% to target</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {profile.trader_type && (
        <div className="lg:col-span-2 glass rounded-2xl p-5 border border-brand-light/40">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Trader Type & Identity</h3>
          <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{profile.trader_type}</p>
        </div>
      )}
    </div>
  );
}

// ─── Reusable Editable Score List ────────────────────────────────────────────

function EditableScoreList({ items, onChange, color }: {
  items: { label: string; score: number }[];
  onChange: (items: { label: string; score: number }[]) => void;
  color: "emerald" | "red";
}) {
  function update(idx: number, field: "label" | "score", val: string) {
    const next = [...items];
    if (field === "score") next[idx] = { ...next[idx], score: parseInt(val) || 0 };
    else next[idx] = { ...next[idx], label: val };
    onChange(next);
  }

  function remove(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }

  function add() {
    onChange([...items, { label: "", score: 50 }]);
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={item.label}
            onChange={(e) => update(i, "label", e.target.value)}
            placeholder="Label..."
            className="flex-1 text-xs px-2 py-1.5 bg-white/60 border border-brand-light/40 rounded text-gray-900"
          />
          <input
            type="number"
            value={item.score}
            onChange={(e) => update(i, "score", e.target.value)}
            min={0}
            max={100}
            className="w-16 text-xs px-2 py-1.5 bg-white/60 border border-brand-light/40 rounded text-gray-900 text-center"
          />
          <span className={`text-[10px] ${color === "emerald" ? "text-emerald-500" : "text-red-500"}`}>%</span>
          <button onClick={() => remove(i)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-1 text-[10px] text-brand hover:text-brand-dark">
        <Plus size={12} /> Add item
      </button>
    </div>
  );
}
