"use client";

import { useState, useMemo } from "react";
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Cloud,
  Frown,
  Meh,
  Smile,
  Star,
  TrendingUp,
  Plus,
  Pencil,
  Save,
  X,
  Trash2,
  Calendar,
} from "lucide-react";
import { JournalSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import EmotionTimelineChart from "@/components/charts/EmotionTimelineChart";
import EffortScatterChart from "@/components/charts/EffortScatterChart";
import { useJournals } from "@/hooks/use-journals";
import { useTrades } from "@/hooks/use-trades";
import { usePsychology } from "@/hooks/use-psychology";
import { computeJournalPatterns, type JournalPattern } from "@/lib/compute-journal-patterns";
import { createClient } from "@/lib/supabase/client";
import { getWeekStart, formatWeekRange } from "@/lib/date-utils";
import type { DailyJournal } from "@/lib/types";

const EMOTION_ICONS: Record<number, typeof Smile> = { 1: Frown, 2: Frown, 3: Meh, 4: Smile, 5: Smile };
const EMOTION_COLORS: Record<number, string> = { 1: "text-red-400", 2: "text-amber-400", 3: "text-gray-500", 4: "text-emerald-400", 5: "text-emerald-400" };
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function emotionToNum(emotion: string): number {
  const lower = emotion.toLowerCase().trim();
  if (lower.includes("confident") || lower.includes("excited")) return 5;
  if (lower.includes("focused") || lower.includes("calm") || lower.includes("observant")) return 4;
  if (lower.includes("stressed") || lower.includes("doubt") || lower.includes("anxious")) return 2;
  if (lower.includes("frustrat") || lower.includes("fear") || lower.includes("angry")) return 1;
  return 3;
}

function emptyJournal(): Partial<DailyJournal> {
  return {
    journal_date: new Date().toISOString().split("T")[0],
    day_of_week: DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1],
    market_mood: "",
    fundamentals_summary: "",
    emotion_before: "Neutral",
    emotion_during: "Neutral",
    emotion_after: "Neutral",
    effort_rating: 3,
    journal_text: "",
    trades_taken: 0,
    pips_positive: 0,
    pips_negative: 0,
    pips_overall: 0,
    rs_total: 0,
  };
}

export default function JournalPage() {
  const { journals, loading: jLoading, refresh } = useJournals();
  const { trades, loading: tLoading } = useTrades();
  const psych = usePsychology(journals, trades);
  const patterns = useMemo(() => computeJournalPatterns(journals), [journals]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [collapsedWeeks, setCollapsedWeeks] = useState<Set<string>>(new Set());
  const [showReflection, setShowReflection] = useState(false);
  const [reflectionData, setReflectionData] = useState({ went_well: "", do_differently: "", key_lesson: "", next_focus: "" });
  const [reflectionSaving, setReflectionSaving] = useState(false);
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<DailyJournal>>({});
  const [addingNew, setAddingNew] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<DailyJournal>>(emptyJournal());
  const [saving, setSaving] = useState(false);

  // Group journals by week
  const weekGroups = useMemo(() => {
    const groups = new Map<string, DailyJournal[]>();
    for (const j of journals) {
      const ws = j.week_start || getWeekStart(j.journal_date);
      if (!groups.has(ws)) groups.set(ws, []);
      groups.get(ws)!.push(j);
    }
    // Sort weeks descending (most recent first)
    return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [journals]);

  function toggleWeek(ws: string) {
    setCollapsedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(ws)) next.delete(ws); else next.add(ws);
      return next;
    });
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  function startEdit(j: DailyJournal) {
    setEditingId(j.id);
    setEditData({ ...j });
    setExpandedId(j.id);
  }

  function cancelEdit() { setEditingId(null); setEditData({}); }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    const supabase = createClient();
    const updates = { ...editData };
    delete updates.id;
    delete updates.user_id;
    await supabase.from("daily_journals").update(updates).eq("id", editingId);
    setSaving(false);
    cancelEdit();
    refresh();
  }

  async function deleteJournal(id: string) {
    const supabase = createClient();
    await supabase.from("daily_journals").delete().eq("id", id);
    refresh();
  }

  async function addJournal() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    await supabase.from("daily_journals").insert({
      user_id: user.id,
      week_start: getWeekStart(newEntry.journal_date || new Date().toISOString().split("T")[0]),
      ...newEntry,
    });
    setSaving(false);
    setAddingNew(false);
    setNewEntry(emptyJournal());
    refresh();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (jLoading || tLoading) return <JournalSkeleton />;

  if (journals.length === 0 && !addingNew) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Journal & Psychology</h1>
            <p className="text-sm text-gray-500 mt-1">Daily trading journal with emotional tracking</p>
          </div>
          <button onClick={() => setAddingNew(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500 hover:bg-pink-600 text-white text-xs rounded-lg transition-colors">
            <Plus size={12} /> New Entry
          </button>
        </div>
        {addingNew ? (
          <JournalEditor data={newEntry} setData={setNewEntry} onSave={addJournal} onCancel={() => { setAddingNew(false); setNewEntry(emptyJournal()); }} saving={saving} isNew />
        ) : (
          <div className="glass rounded-2xl border border-pink-200/40">
            <EmptyState icon={Brain} title="No journal entries yet" description="Use Full Sync on your Google Sheet or add entries manually." />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Journal & Psychology</h1>
          <p className="text-sm text-gray-500 mt-1">Daily trading journal with emotional tracking and pattern analysis</p>
        </div>
        <button onClick={() => setAddingNew(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500 hover:bg-pink-600 text-white text-xs rounded-lg transition-colors">
          <Plus size={12} /> New Entry
        </button>
      </div>

      {/* New entry form */}
      {addingNew && (
        <JournalEditor data={newEntry} setData={setNewEntry} onSave={addJournal} onCancel={() => { setAddingNew(false); setNewEntry(emptyJournal()); }} saving={saving} isNew />
      )}

      {/* Emotion summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Avg Before Session", value: psych.avgEmotionBefore, color: "text-purple-400" },
          { label: "Avg During Session", value: psych.avgEmotionDuring, color: "text-pink-500" },
          { label: "Avg After Session", value: psych.avgEmotionAfter, color: "text-emerald-400" },
        ].map((s) => {
          const Icon = EMOTION_ICONS[Math.round(s.value)] || Meh;
          return (
            <div key={s.label} className="glass rounded-2xl p-4 border border-pink-200/40">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className={EMOTION_COLORS[Math.round(s.value)] || "text-gray-500"} />
                <span className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</span>
              </div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}/5</div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5 border border-pink-200/40">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Emotion Timeline</h3>
          <EmotionTimelineChart data={psych.emotionTimeline} />
          <div className="flex justify-center gap-4 mt-3 text-[10px] text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Before</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> During</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> After</span>
          </div>
        </div>
        <div className="glass rounded-2xl p-5 border border-pink-200/40">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Effort vs Results</h3>
          {psych.effortVsResults.length > 0 ? (
            <EffortScatterChart data={psych.effortVsResults} />
          ) : (
            <p className="text-xs text-gray-400 py-16 text-center">No effort data yet</p>
          )}
        </div>
      </div>

      {/* Emotion-PnL correlation */}
      {psych.emotionPnlCorrelation.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-pink-200/40">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Emotion vs Performance</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {psych.emotionPnlCorrelation.map((e) => (
              <div key={e.emotion} className="p-3 bg-pink-50/80 rounded-lg text-center">
                <div className="text-xs text-gray-500 mb-1">{e.emotion}</div>
                <div className={`text-lg font-bold ${e.avgPips >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {e.avgPips > 0 ? "+" : ""}{e.avgPips}p
                </div>
                <div className="text-[10px] text-gray-400">{e.count} days</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pattern Detection */}
      {patterns.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-pink-200/40">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-pink-500" />
              <h3 className="text-sm font-semibold text-gray-900">Pattern Detection</h3>
            </div>
            <span className="text-[10px] text-gray-400 max-w-[250px] text-right">
              Patterns detected from journal text, correlated with daily trading results
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {patterns.map((p) => (
              <PatternCard key={p.keyword} pattern={p} />
            ))}
          </div>
        </div>
      )}

      {/* Weekly Reflection */}
      <div className="glass rounded-2xl p-5 border border-pink-200/40">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Weekly Reflection</h3>
          {!showReflection && (
            <button
              onClick={() => setShowReflection(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500 hover:bg-pink-600 text-white text-xs rounded-lg transition-colors"
            >
              <Pencil size={12} /> Write Reflection
            </button>
          )}
        </div>

        {showReflection && (
          <div className="space-y-3">
            {[
              { key: "went_well", label: "What went well this week?", placeholder: "Your wins, good decisions, moments of discipline..." },
              { key: "do_differently", label: "What would I do differently?", placeholder: "Mistakes to avoid, lessons from losses..." },
              { key: "key_lesson", label: "Key lesson learned", placeholder: "The most important takeaway..." },
              { key: "next_focus", label: "Focus for next week", placeholder: "What to prioritize going forward..." },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-xs text-gray-500 mb-1">{field.label}</label>
                <textarea
                  value={reflectionData[field.key as keyof typeof reflectionData]}
                  onChange={(e) => setReflectionData({ ...reflectionData, [field.key]: e.target.value })}
                  rows={2}
                  placeholder={field.placeholder}
                  className="w-full bg-white/40 border border-pink-200/40 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-pink-400 resize-y"
                />
              </div>
            ))}
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  setReflectionSaving(true);
                  const supabase = createClient();
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) {
                    const ws = getWeekStart(new Date().toISOString().split("T")[0]);
                    const we = new Date(ws);
                    we.setDate(we.getDate() + 4);
                    await supabase.from("weekly_summaries").upsert({
                      user_id: user.id,
                      week_start: ws,
                      week_end: we.toISOString().split("T")[0],
                      week_label: `Week of ${ws}`,
                      overall_summary: JSON.stringify(reflectionData),
                    }, { onConflict: "user_id,week_start" });
                  }
                  setReflectionSaving(false);
                  setReflectionSaved(true);
                  setShowReflection(false);
                  setTimeout(() => setReflectionSaved(false), 3000);
                }}
                disabled={reflectionSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg transition-colors"
              >
                <Save size={12} /> {reflectionSaving ? "Saving..." : "Save Reflection"}
              </button>
              <button
                onClick={() => setShowReflection(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/50 border border-pink-200/40 text-gray-600 text-xs rounded-lg"
              >
                <X size={12} /> Cancel
              </button>
            </div>
          </div>
        )}

        {reflectionSaved && (
          <div className="p-3 bg-emerald-50/60 border border-emerald-200/40 rounded-xl text-xs text-emerald-600">
            Reflection saved successfully
          </div>
        )}

        {!showReflection && !reflectionSaved && (
          <p className="text-xs text-gray-400">Take a moment to reflect on your trading week.</p>
        )}
      </div>

      {/* Weekly grouped journal entries */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Daily Entries</h3>
        <div className="space-y-4">
          {weekGroups.map(([weekStart, entries]) => {
            const isCollapsed = collapsedWeeks.has(weekStart);
            return (
              <div key={weekStart}>
                {/* Week header */}
                <button
                  onClick={() => toggleWeek(weekStart)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-white/50 border border-pink-200/40 rounded-lg hover:bg-pink-50/60 transition-colors mb-2"
                >
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-pink-500" />
                    <span className="text-xs font-semibold text-gray-900">{formatWeekRange(weekStart)}</span>
                    <span className="text-[10px] text-gray-400">{entries.length} entries</span>
                  </div>
                  {isCollapsed ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronUp size={14} className="text-gray-400" />}
                </button>

                {/* Entries */}
                {!isCollapsed && (
                  <div className="space-y-2 ml-2 border-l-2 border-pink-200/40 pl-4">
                    {entries.map((j) => {
                      const isExpanded = expandedId === j.id;
                      const isEditing = editingId === j.id;
                      const emotionNum = emotionToNum(j.emotion_during);
                      const EmIcon = EMOTION_ICONS[emotionNum] || Meh;

                      if (isEditing) {
                        return (
                          <JournalEditor
                            key={j.id}
                            data={editData}
                            setData={setEditData}
                            onSave={saveEdit}
                            onCancel={cancelEdit}
                            saving={saving}
                          />
                        );
                      }

                      return (
                        <div key={j.id} className="glass rounded-2xl border border-pink-200/40 overflow-hidden">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : j.id)}
                            className="w-full flex items-center justify-between p-3 text-left hover:bg-pink-50/40 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col items-center w-10">
                                <span className="text-xs font-bold text-gray-900">{(j.day_of_week || "").slice(0, 3)}</span>
                                <span className="text-[10px] text-gray-400">{(j.journal_date || "").slice(5)}</span>
                              </div>
                              <EmIcon size={16} className={EMOTION_COLORS[emotionNum]} />
                              <div className="flex items-center gap-2 flex-wrap">
                                {j.market_mood && <span className="flex items-center gap-1 text-[11px] text-gray-500"><Cloud size={11} /> {j.market_mood}</span>}
                                {j.effort_rating > 0 && <span className="flex items-center gap-1 text-[11px] text-amber-400"><Star size={11} /> {j.effort_rating}/5</span>}
                                {j.pips_overall !== 0 && (
                                  <span className={`flex items-center gap-1 text-[11px] ${j.pips_overall >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                    <TrendingUp size={11} /> {j.pips_overall > 0 ? "+" : ""}{j.pips_overall}p
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="hidden sm:flex gap-1 text-[10px]">
                                <span className="px-1.5 py-0.5 bg-pink-100/60 rounded text-gray-500">{j.emotion_before || "—"}</span>
                                <span className="text-gray-300">→</span>
                                <span className="px-1.5 py-0.5 bg-pink-100/60 rounded text-gray-500">{j.emotion_during || "—"}</span>
                                <span className="text-gray-300">→</span>
                                <span className="px-1.5 py-0.5 bg-pink-100/60 rounded text-gray-500">{j.emotion_after || "—"}</span>
                              </div>
                              {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-4 pb-4 border-t border-pink-200/40 pt-3 space-y-3">
                              {/* Action buttons */}
                              <div className="flex justify-end gap-2">
                                <button onClick={() => startEdit(j)} className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-500 hover:text-pink-500 transition-colors">
                                  <Pencil size={10} /> Edit
                                </button>
                                <button onClick={() => deleteJournal(j.id)} className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-500 hover:text-red-400 transition-colors">
                                  <Trash2 size={10} /> Delete
                                </button>
                              </div>

                              {/* Metadata */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                <div className="p-2 bg-pink-50/80 rounded">
                                  <span className="text-gray-400">Market Mood</span>
                                  <div className="text-gray-900 font-medium">{j.market_mood || "—"}</div>
                                </div>
                                <div className="p-2 bg-pink-50/80 rounded">
                                  <span className="text-gray-400">Fundamentals</span>
                                  <div className="text-gray-900 font-medium">{j.fundamentals_summary || "—"}</div>
                                </div>
                                <div className="p-2 bg-pink-50/80 rounded">
                                  <span className="text-gray-400">Trades Taken</span>
                                  <div className="text-gray-900 font-medium">{j.trades_taken || 0}</div>
                                </div>
                                <div className="p-2 bg-pink-50/80 rounded">
                                  <span className="text-gray-400">R&apos;s Total</span>
                                  <div className={`font-medium ${j.rs_total >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                    {j.rs_total > 0 ? "+" : ""}{j.rs_total}R
                                  </div>
                                </div>
                              </div>

                              {j.journal_text && (
                                <div>
                                  <div className="text-[10px] text-pink-500 font-semibold mb-1 uppercase tracking-wide">Daily Journal</div>
                                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{j.journal_text}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Journal Editor ──────────────────────────────────────────────────────────

function JournalEditor({
  data,
  setData,
  onSave,
  onCancel,
  saving,
  isNew,
}: {
  data: Partial<DailyJournal>;
  setData: (d: Partial<DailyJournal>) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  isNew?: boolean;
}) {
  function update<K extends keyof DailyJournal>(key: K, value: DailyJournal[K]) {
    setData({ ...data, [key]: value });
  }

  return (
    <div className="glass rounded-2xl p-5 border border-pink-300/50 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">{isNew ? "New Journal Entry" : "Edit Entry"}</h4>
        <div className="flex gap-2">
          <button onClick={onSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg transition-colors">
            <Save size={12} /> {saving ? "Saving..." : "Save"}
          </button>
          <button onClick={onCancel} className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-100/60 hover:bg-slate-600 text-gray-900 text-xs rounded-lg transition-colors">
            <X size={12} /> Cancel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-[10px] text-gray-400 mb-1">Date</label>
          <input type="date" value={data.journal_date || ""} onChange={(e) => update("journal_date", e.target.value)}
            className="w-full bg-white/60 border border-pink-200/40 rounded px-2 py-1.5 text-xs text-gray-900 focus:border-pink-400 focus:outline-none" />
        </div>
        <div>
          <label className="block text-[10px] text-gray-400 mb-1">Day</label>
          <select value={data.day_of_week || ""} onChange={(e) => update("day_of_week", e.target.value)}
            className="w-full bg-white/60 border border-pink-200/40 rounded px-2 py-1.5 text-xs text-gray-900 focus:border-pink-400 focus:outline-none">
            {DAYS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-gray-400 mb-1">Market Mood</label>
          <input type="text" value={data.market_mood || ""} onChange={(e) => update("market_mood", e.target.value)} placeholder="Overall bearish"
            className="w-full bg-white/60 border border-pink-200/40 rounded px-2 py-1.5 text-xs text-gray-900 placeholder-slate-600 focus:border-pink-400 focus:outline-none" />
        </div>
        <div>
          <label className="block text-[10px] text-gray-400 mb-1">Fundamentals</label>
          <input type="text" value={data.fundamentals_summary || ""} onChange={(e) => update("fundamentals_summary", e.target.value)} placeholder="Low/quiet"
            className="w-full bg-white/60 border border-pink-200/40 rounded px-2 py-1.5 text-xs text-gray-900 placeholder-slate-600 focus:border-pink-400 focus:outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <div>
          <label className="block text-[10px] text-gray-400 mb-1">Before</label>
          <input type="text" value={data.emotion_before || ""} onChange={(e) => update("emotion_before", e.target.value)} placeholder="Neutral"
            className="w-full bg-white/60 border border-pink-200/40 rounded px-2 py-1.5 text-xs text-gray-900 placeholder-slate-600 focus:border-pink-400 focus:outline-none" />
        </div>
        <div>
          <label className="block text-[10px] text-gray-400 mb-1">During</label>
          <input type="text" value={data.emotion_during || ""} onChange={(e) => update("emotion_during", e.target.value)} placeholder="Focused"
            className="w-full bg-white/60 border border-pink-200/40 rounded px-2 py-1.5 text-xs text-gray-900 placeholder-slate-600 focus:border-pink-400 focus:outline-none" />
        </div>
        <div>
          <label className="block text-[10px] text-gray-400 mb-1">After</label>
          <input type="text" value={data.emotion_after || ""} onChange={(e) => update("emotion_after", e.target.value)} placeholder="Neutral"
            className="w-full bg-white/60 border border-pink-200/40 rounded px-2 py-1.5 text-xs text-gray-900 placeholder-slate-600 focus:border-pink-400 focus:outline-none" />
        </div>
        <div>
          <label className="block text-[10px] text-gray-400 mb-1">Effort (1-5)</label>
          <input type="number" min={1} max={5} value={data.effort_rating || 3} onChange={(e) => update("effort_rating", parseInt(e.target.value) || 3)}
            className="w-full bg-white/60 border border-pink-200/40 rounded px-2 py-1.5 text-xs text-gray-900 focus:border-pink-400 focus:outline-none" />
        </div>
        <div>
          <label className="block text-[10px] text-gray-400 mb-1">Trades</label>
          <input type="number" value={data.trades_taken || 0} onChange={(e) => update("trades_taken", parseInt(e.target.value) || 0)}
            className="w-full bg-white/60 border border-pink-200/40 rounded px-2 py-1.5 text-xs text-gray-900 focus:border-pink-400 focus:outline-none" />
        </div>
        <div>
          <label className="block text-[10px] text-gray-400 mb-1">Pips</label>
          <input type="number" step="any" value={data.pips_overall || 0} onChange={(e) => update("pips_overall", parseFloat(e.target.value) || 0)}
            className="w-full bg-white/60 border border-pink-200/40 rounded px-2 py-1.5 text-xs text-gray-900 focus:border-pink-400 focus:outline-none" />
        </div>
      </div>

      <div>
        <label className="block text-[10px] text-gray-400 mb-1">Daily Journal</label>
        <textarea
          value={data.journal_text || ""}
          onChange={(e) => update("journal_text", e.target.value)}
          rows={8}
          placeholder="Write your daily trading journal..."
          className="w-full bg-white/60 border border-pink-200/40 rounded px-3 py-2 text-xs text-gray-900 placeholder-slate-600 focus:border-pink-400 focus:outline-none resize-y leading-relaxed"
        />
      </div>
    </div>
  );
}

// ─── Pattern Card ────────────────────────────────────────────────────────────

function PatternCard({ pattern }: { pattern: JournalPattern }) {
  const colors = {
    positive: { bg: "bg-emerald-50/60 border-emerald-200/40", text: "text-emerald-600", badge: "text-emerald-500" },
    negative: { bg: "bg-red-50/60 border-red-200/40", text: "text-red-600", badge: "text-red-500" },
    neutral: { bg: "bg-amber-50/60 border-amber-200/40", text: "text-amber-600", badge: "text-amber-500" },
  };
  const c = colors[pattern.variant];

  return (
    <div className={`p-3 rounded-xl border ${c.bg}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-xs font-semibold capitalize ${c.text}`}>&quot;{pattern.keyword}&quot;</span>
        <span className={`text-[10px] font-bold ${c.badge}`}>
          {pattern.impact > 0 ? "+" : ""}{pattern.impact.toFixed(1)}p impact
        </span>
      </div>
      <div className="text-[11px] text-gray-600 space-y-0.5">
        <div>With keyword: <strong className={pattern.avgPipsWithKeyword >= 0 ? "text-emerald-500" : "text-red-500"}>
          {pattern.avgPipsWithKeyword > 0 ? "+" : ""}{pattern.avgPipsWithKeyword}p
        </strong> ({pattern.daysWithKeyword} days)</div>
        <div>Without: <strong className={pattern.avgPipsWithout >= 0 ? "text-emerald-500" : "text-red-500"}>
          {pattern.avgPipsWithout > 0 ? "+" : ""}{pattern.avgPipsWithout}p
        </strong> ({pattern.daysWithout} days)</div>
      </div>
    </div>
  );
}
