"use client";

import { Bot, FileSpreadsheet } from "lucide-react";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import SheetsConnector from "@/components/sheets/SheetsConnector";
import { useSettings } from "@/hooks/use-settings";

export default function SettingsPage() {
  const { settings, tradingConfig, loading } = useSettings();

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-white/50 rounded w-32" />
        <div className="grid grid-cols-2 gap-6">
          <div className="glass rounded-2xl h-64 border border-pink-200/40" />
          <div className="glass rounded-2xl h-64 border border-pink-200/40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure your trading copilot
        </p>
      </div>

      {/* Google Sheets Integration — full width */}
      <div className="glass rounded-2xl p-5 border border-pink-200/40">
        <div className="flex items-center gap-2 mb-4">
          <FileSpreadsheet size={16} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-gray-900">
            Google Sheets Trading Tracker
          </h3>
        </div>
        <SheetsConnector />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="glass rounded-2xl p-5 border border-pink-200/40">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Trading Configuration
            </h3>
            <div className="space-y-3">
              {tradingConfig.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between py-2 border-b border-pink-200/30 last:border-0"
                >
                  <span className="text-xs text-gray-500">{s.label}</span>
                  <span className="text-xs text-gray-900 font-medium bg-pink-100/60 px-3 py-1 rounded">
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-5 border border-pink-200/40">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Data Connections
            </h3>
            <div className="space-y-2">
              {settings.data_connections.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between p-3 bg-pink-50/80 rounded-lg"
                >
                  <div>
                    <div className="text-xs text-gray-900 font-medium">
                      {c.name}
                    </div>
                    <div className="text-[10px] text-gray-400">{c.desc}</div>
                  </div>
                  <button
                    className={`text-xs px-3 py-1 rounded-lg ${
                      c.connected
                        ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800/50"
                        : "bg-pink-100/60 text-gray-500 hover:bg-slate-600"
                    }`}
                  >
                    {c.connected ? "Connected" : "Connect"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-2xl p-5 border border-pink-200/40">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              News Sources
            </h3>
            <div className="space-y-2">
              {settings.news_sources.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between p-2 bg-pink-50/80 rounded"
                >
                  <div>
                    <div className="text-xs text-gray-900">{s.name}</div>
                    <div className="text-[10px] text-gray-400">{s.url}</div>
                  </div>
                  <ToggleSwitch
                    defaultOn={s.active}
                    activeColor="bg-pink-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-5 border border-pink-200/40">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Copilot Skills
            </h3>
            <div className="space-y-2">
              {settings.copilot_skills.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between p-2 bg-pink-50/80 rounded"
                >
                  <div className="flex items-center gap-2">
                    <Bot size={14} className="text-pink-500" />
                    <div>
                      <div className="text-xs text-gray-900">{s.name}</div>
                      <div className="text-[10px] text-gray-400">
                        {s.desc}
                      </div>
                    </div>
                  </div>
                  <ToggleSwitch
                    defaultOn={s.active}
                    activeColor="bg-emerald-600"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
