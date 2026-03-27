"use client";

import { User, Upload, Brain, Loader2, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { ProfileSkeleton } from "@/components/ui/Skeleton";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import ProfileTabs from "@/components/profile/ProfileTabs";
import ProfileUploader from "@/components/profile/ProfileUploader";
import { useTraderProfile } from "@/hooks/use-trader-profile";
import { useState } from "react";

interface AnalysisResult {
  summary: string;
  old: { strengths: { label: string; score: number }[]; weaknesses: { label: string; score: number }[]; radar_scores: { trait: string; value: number }[] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new: { strengths: any[]; weaknesses: any[]; radar_scores: any[] };
  tradeCount: number;
  journalCount: number;
}

export default function ProfilePage() {
  const { profile, propAccounts, loading, hasData, refresh } = useTraderProfile();
  const [showUploader, setShowUploader] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  if (loading) return <ProfileSkeleton />;

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trader Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Your comprehensive trading identity</p>
        </div>
        <div className="glass rounded-2xl p-8 border border-pink-200/40">
          <div className="max-w-md mx-auto text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/20">
              <User size={28} className="text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Build Your Trader Profile</h3>
            <p className="text-sm text-gray-500 mb-4">
              Upload your Trader Profile CSV to create a comprehensive psychology profile with strengths, weaknesses, fears, successes, hobbies, and goals.
            </p>
            <div className="flex justify-center gap-6 text-xs text-gray-400 mb-6">
              <div className="flex flex-col items-center gap-1">
                <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-500 flex items-center justify-center text-[10px] font-bold">1</span>
                Upload CSV
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-500 flex items-center justify-center text-[10px] font-bold">2</span>
                AI extracts data
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-500 flex items-center justify-center text-[10px] font-bold">3</span>
                Profile ready
              </div>
            </div>
          </div>
          <ProfileUploader onSuccess={refresh} />
        </div>
      </div>
    );
  }

  const profileMeta = [
    { label: "Tracking Since", value: profile.tracking_since ? profile.tracking_since.slice(0, 7).replace("-", " ") : "—" },
    { label: "Trading Plan", value: `${profile.primary_pair} + ${profile.confluence_pair}` },
    { label: "Session Focus", value: profile.session_focus },
    { label: "Risk Model", value: profile.risk_model || "—" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trader Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Your comprehensive trading identity — built from your data</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              setAnalyzing(true); setAnalyzeError(null); setAnalysisResult(null);
              try {
                const res = await fetch("/api/profile/analyze", { method: "POST" });
                const data = await res.json();
                if (!res.ok) { setAnalyzeError(data.error || "Analysis failed"); }
                else { setAnalysisResult(data); setShowComparison(true); refresh(); }
              } catch { setAnalyzeError("Request failed"); }
              finally { setAnalyzing(false); }
            }}
            disabled={analyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white text-xs rounded-xl transition-colors shadow-sm shadow-pink-500/20"
          >
            {analyzing ? <Loader2 size={12} className="animate-spin" /> : <Brain size={12} />}
            {analyzing ? "Analyzing..." : "Refresh Profile"}
          </button>
          <button
            onClick={() => setShowUploader(!showUploader)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/50 border border-pink-200/40 hover:bg-pink-50 text-gray-600 text-xs rounded-xl transition-colors"
          >
            <Upload size={12} /> Upload CSV
          </button>
        </div>
      </div>

      {/* Analysis error */}
      {analyzeError && (
        <div className="p-3 bg-red-50/60 border border-red-200/40 rounded-xl text-xs text-red-600">{analyzeError}</div>
      )}

      {/* Before/After comparison */}
      {analysisResult && showComparison && (
        <div className="glass rounded-2xl p-5 border border-pink-300/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-pink-500" />
              <h3 className="text-sm font-semibold text-gray-900">Profile Updated</h3>
              <span className="text-[10px] text-gray-400">Based on {analysisResult.tradeCount} trades + {analysisResult.journalCount} journals</span>
            </div>
            <button onClick={() => setShowComparison(false)} className="text-[10px] text-gray-400 hover:text-gray-600">Dismiss</button>
          </div>

          {analysisResult.summary && (
            <p className="text-xs text-gray-600 mb-4 p-3 bg-pink-50/60 rounded-lg italic">{analysisResult.summary}</p>
          )}

          {/* Radar comparison */}
          {analysisResult.old.radar_scores?.length > 0 && analysisResult.new.radar_scores?.length > 0 && (
            <div className="mb-4">
              <h4 className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-2">Skill Scores — Before vs After</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {analysisResult.new.radar_scores.map((newScore: { trait: string; value: number }) => {
                  const oldScore = analysisResult.old.radar_scores?.find((o) => o.trait === newScore.trait);
                  const oldVal = oldScore?.value || 0;
                  const diff = newScore.value - oldVal;
                  return (
                    <div key={newScore.trait} className="p-2 bg-pink-50/40 rounded-lg text-center">
                      <div className="text-[9px] text-gray-400 mb-1">{newScore.trait}</div>
                      <div className="text-lg font-bold text-gray-900">{newScore.value}</div>
                      {oldVal > 0 && (
                        <div className={`text-[10px] font-medium ${diff > 0 ? "text-emerald-500" : diff < 0 ? "text-red-500" : "text-gray-400"}`}>
                          {diff > 0 ? "↑" : diff < 0 ? "↓" : "="} {diff !== 0 ? Math.abs(diff) : "no change"}
                        </div>
                      )}
                      <ProgressBar value={newScore.value} color={newScore.value >= 70 ? "bg-emerald-500" : newScore.value >= 50 ? "bg-amber-500" : "bg-red-500"} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Strengths comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div>
              <h4 className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wide mb-1.5">Updated Strengths</h4>
              <div className="space-y-1.5">
                {(analysisResult.new.strengths || []).map((s: { label: string; score: number }, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-emerald-50/40 rounded-lg">
                    <span className="text-[11px] text-gray-700">{s.label}</span>
                    <span className="text-[11px] font-bold text-emerald-500">{s.score}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[10px] text-red-500 font-semibold uppercase tracking-wide mb-1.5">Updated Weaknesses</h4>
              <div className="space-y-1.5">
                {(analysisResult.new.weaknesses || []).map((w: { label: string; score: number }, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-red-50/40 rounded-lg">
                    <span className="text-[11px] text-gray-700">{w.label}</span>
                    <span className="text-[11px] font-bold text-red-500">{w.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showUploader && (
        <div className="glass rounded-2xl p-5 border border-pink-200/40">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Import Trader Profile</h3>
          <ProfileUploader onSuccess={() => { setShowUploader(false); refresh(); }} />
        </div>
      )}

      <div className="glass rounded-2xl p-6 border border-pink-200/40">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-3xl font-bold text-white shrink-0">
            {profile.avatar_initial}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-gray-900">{profile.full_name}</h2>
              <Badge variant="info">{profile.stage}</Badge>
              <Badge variant="success">{profile.funded_status}</Badge>
            </div>
            <p className="text-sm text-gray-500 mb-3">{profile.trader_type || profile.bio || "No bio set"}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {profileMeta.map((m) => (
                <div key={m.label}>
                  <span className="text-xs text-gray-400">{m.label}</span>
                  <div className="text-sm font-semibold text-gray-900">{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ProfileTabs profile={profile} propAccounts={propAccounts} />
    </div>
  );
}
