"use client";

import { User } from "lucide-react";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import ProfileTabs from "@/components/profile/ProfileTabs";
import { useTraderProfile } from "@/hooks/use-trader-profile";

export default function ProfilePage() {
  const { profile, propAccounts, loading, hasData } = useTraderProfile();

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-white/50 rounded w-48" />
        <div className="glass rounded-2xl h-32 border border-pink-200/40" />
        <div className="glass rounded-2xl h-64 border border-pink-200/40" />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trader Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Your comprehensive trading identity</p>
        </div>
        <div className="glass rounded-2xl border border-pink-200/40">
          <EmptyState
            icon={User}
            title="Profile not set up yet"
            description="Complete onboarding or connect your Google Sheet to build your trader profile with strengths, weaknesses, and trading plan."
          />
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trader Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Your comprehensive trading identity — built from your data</p>
      </div>

      <div className="glass rounded-2xl p-6 border border-pink-200/40">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-3xl font-bold text-gray-900 shrink-0">
            {profile.avatar_initial}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-gray-900">{profile.full_name}</h2>
              <Badge variant="info">{profile.stage}</Badge>
              <Badge variant="success">{profile.funded_status}</Badge>
            </div>
            <p className="text-sm text-gray-500 mb-3">{profile.bio || "No bio set"}</p>
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
