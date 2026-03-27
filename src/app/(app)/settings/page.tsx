"use client";

import { useState } from "react";
import { Bot, FileSpreadsheet, History } from "lucide-react";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import SheetsConnector from "@/components/sheets/SheetsConnector";
import SyncHistory from "@/components/sheets/SyncHistory";
import { useSettings } from "@/hooks/use-settings";

export default function SettingsPage() {
  const { settings, tradingConfig, loading } = useSettings();
  const [syncRefreshKey, setSyncRefreshKey] = useState(0);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-white/50 rounded w-32" />
        <div className="grid grid-cols-2 gap-6">
          <div className="glass rounded-2xl h-64 border border-brand-light/40" />
          <div className="glass rounded-2xl h-64 border border-brand-light/40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure your trading copilot</p>
      </div>

      {/* Google Sheets Integration */}
      <div className="glass rounded-2xl p-5 border border-brand-light/40">
        <div className="flex items-center gap-2 mb-4">
          <FileSpreadsheet size={16} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-gray-900">Google Sheets Trading Tracker</h3>
        </div>
        <SheetsConnector onSyncComplete={() => setSyncRefreshKey((k) => k + 1)} />
      </div>

      {/* Sync History */}
      <div className="glass rounded-2xl p-5 border border-brand-light/40">
        <div className="flex items-center gap-2 mb-4">
          <History size={16} className="text-brand" />
          <h3 className="text-sm font-semibold text-gray-900">Sync History</h3>
          <span className="text-[10px] text-gray-400">Track every import run</span>
        </div>
        <SyncHistory refreshKey={syncRefreshKey} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="glass rounded-2xl p-5 border border-brand-light/40">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Trading Configuration</h3>
            <div className="space-y-3">
              {tradingConfig.map((s) => (
                <div key={s.label} className="flex items-center justify-between py-2 border-b border-brand-light/30 last:border-0">
                  <span className="text-xs text-gray-500">{s.label}</span>
                  <span className="text-xs text-gray-900 font-medium bg-brand-light/60 px-3 py-1 rounded">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-5 border border-brand-light/40">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Data Connections</h3>
            <div className="space-y-2">
              {settings.data_connections.map((c) => (
                <div key={c.name} className="flex items-center justify-between p-3 bg-brand-light/80 rounded-lg">
                  <div>
                    <div className="text-xs text-gray-900 font-medium">{c.name}</div>
                    <div className="text-[10px] text-gray-400">{c.desc}</div>
                  </div>
                  <button className={`text-xs px-3 py-1 rounded-lg ${c.connected ? "bg-emerald-50 text-emerald-500 border border-emerald-200/50" : "bg-brand-light/60 text-gray-500 hover:bg-brand-light"}`}>
                    {c.connected ? "Connected" : "Connect"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-2xl p-5 border border-brand-light/40">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">News Sources</h3>
            <div className="space-y-2">
              {settings.news_sources.map((s) => (
                <div key={s.name} className="flex items-center justify-between p-2 bg-brand-light/80 rounded">
                  <div>
                    <div className="text-xs text-gray-900">{s.name}</div>
                    <div className="text-[10px] text-gray-400">{s.url}</div>
                  </div>
                  <ToggleSwitch defaultOn={s.active} activeColor="bg-brand" />
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-5 border border-brand-light/40">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Copilot Skills</h3>
            <div className="space-y-2">
              {settings.copilot_skills.map((s) => (
                <div key={s.name} className="flex items-center justify-between p-2 bg-brand-light/80 rounded">
                  <div className="flex items-center gap-2">
                    <Bot size={14} className="text-brand" />
                    <div>
                      <div className="text-xs text-gray-900">{s.name}</div>
                      <div className="text-[10px] text-gray-400">{s.desc}</div>
                    </div>
                  </div>
                  <ToggleSwitch defaultOn={s.active} activeColor="bg-emerald-600" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
