"use client";

import { User, Upload, FileSpreadsheet, ArrowRight } from "lucide-react";
import { ProfileSkeleton } from "@/components/ui/Skeleton";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import ProfileTabs from "@/components/profile/ProfileTabs";
import ProfileUploader from "@/components/profile/ProfileUploader";
import { useTraderProfile } from "@/hooks/use-trader-profile";
import { useState } from "react";

export default function ProfilePage() {
  const { profile, propAccounts, loading, hasData, refresh } = useTraderProfile();
  const [showUploader, setShowUploader] = useState(false);

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
        <button
          onClick={() => setShowUploader(!showUploader)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/50 border border-pink-200/40 hover:bg-pink-50 text-gray-600 text-xs rounded-xl transition-colors"
        >
          <Upload size={12} /> Upload Profile
        </button>
      </div>

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
