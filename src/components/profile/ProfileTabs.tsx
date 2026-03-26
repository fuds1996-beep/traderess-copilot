"use client";

import { useState } from "react";
import { CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
import ProgressBar from "@/components/ui/ProgressBar";
import Badge from "@/components/ui/Badge";
import SkillRadarChart from "@/components/charts/SkillRadarChart";
import type { TraderProfile, PropFirmAccount } from "@/lib/types";

const TABS = ["overview", "psychology", "plan"] as const;
type Tab = (typeof TABS)[number];

export default function ProfileTabs({
  profile,
  propAccounts,
}: {
  profile: TraderProfile;
  propAccounts: PropFirmAccount[];
}) {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <>
      <div className="flex gap-2 border-b border-pink-200/40 pb-0">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-pink-400 text-pink-500"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab profile={profile} />}
      {tab === "psychology" && <PsychologyTab profile={profile} />}
      {tab === "plan" && (
        <PlanTab profile={profile} propAccounts={propAccounts} />
      )}
    </>
  );
}

function OverviewTab({ profile }: { profile: TraderProfile }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="glass rounded-2xl p-5 border border-pink-200/40">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle size={16} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-gray-900">Strengths</h3>
        </div>
        <div className="space-y-3">
          {profile.strengths.map((s, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">{s.label}</span>
                <span className="text-emerald-400">{s.score}%</span>
              </div>
              <ProgressBar value={s.score} color="bg-emerald-500" />
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-5 border border-pink-200/40">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-amber-400" />
          <h3 className="text-sm font-semibold text-gray-900">Weaknesses</h3>
        </div>
        <div className="space-y-3">
          {profile.weaknesses.map((w, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">{w.label}</span>
                <span className="text-red-400">{w.score}%</span>
              </div>
              <ProgressBar value={w.score} color="bg-red-500" />
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 glass rounded-2xl p-5 border border-pink-200/40">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Trading Skill Radar
        </h3>
        <div className="flex justify-center">
          <SkillRadarChart data={profile.radar_scores} />
        </div>
      </div>
    </div>
  );
}

function PsychologyTab({ profile }: { profile: TraderProfile }) {
  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-5 border border-pink-200/40">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          SPACE Method Assessment
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {profile.space_method.map((s) => (
            <div
              key={s.letter}
              className={`p-4 rounded-lg border ${
                s.status === "good"
                  ? "bg-emerald-900/20 border-emerald-800/50"
                  : "bg-amber-900/20 border-amber-800/50"
              }`}
            >
              <div
                className={`text-2xl font-bold mb-1 ${
                  s.status === "good" ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {s.letter}
              </div>
              <div className="text-xs font-medium text-gray-900 mb-1">
                {s.word}
              </div>
              <div className="text-[10px] text-gray-500 leading-relaxed">
                {s.note}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-5 border border-pink-200/40">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Behavioural Pattern Matrix
        </h3>
        <div className="space-y-2">
          {profile.behavioural_patterns.map((p) => (
            <div
              key={p.pattern}
              className="flex items-start gap-4 p-3 bg-pink-50/80 rounded-lg"
            >
              <AlertCircle
                size={16}
                className={`mt-0.5 shrink-0 ${
                  p.severity === "high" ? "text-red-400" : "text-amber-400"
                }`}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {p.pattern}
                  </span>
                  <Badge
                    variant={p.severity === "high" ? "danger" : "warning"}
                  >
                    {p.severity}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Frequency: {p.frequency}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Trigger: {p.trigger}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlanTab({
  profile,
  propAccounts,
}: {
  profile: TraderProfile;
  propAccounts: PropFirmAccount[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="glass rounded-2xl p-5 border border-pink-200/40">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Trading Plan Summary
        </h3>
        <div className="space-y-3 text-sm">
          {profile.trading_plan.map((r) => (
            <div
              key={r.label}
              className="flex justify-between py-1.5 border-b border-pink-200/30 last:border-0"
            >
              <span className="text-gray-500">{r.label}</span>
              <span className="text-gray-900 font-medium text-right">
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-5 border border-pink-200/40">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Prop Firm Accounts
        </h3>
        <div className="space-y-3">
          {propAccounts.map((a) => (
            <div key={a.id} className="p-3 bg-pink-50/80 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-900">
                  {a.account_name}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="info">{a.status}</Badge>
                  <span className="text-xs text-emerald-400 font-medium">
                    {a.pnl}
                  </span>
                </div>
              </div>
              <ProgressBar value={a.progress} color="bg-indigo-500" />
              <span className="text-[10px] text-gray-400 mt-1 block">
                {a.progress}% to target
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
