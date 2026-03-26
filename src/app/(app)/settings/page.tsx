"use client";

import { Bot } from "lucide-react";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { useSettings } from "@/hooks/use-settings";

export default function SettingsPage() {
  const { settings, tradingConfig, loading } = useSettings();

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-32" />
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-xl h-64 border border-slate-700" />
          <div className="bg-slate-800 rounded-xl h-64 border border-slate-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure your trading copilot
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-4">
              Trading Configuration
            </h3>
            <div className="space-y-3">
              {tradingConfig.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0"
                >
                  <span className="text-xs text-slate-400">{s.label}</span>
                  <span className="text-xs text-white font-medium bg-slate-700 px-3 py-1 rounded">
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-4">
              Data Connections
            </h3>
            <div className="space-y-2">
              {settings.data_connections.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                >
                  <div>
                    <div className="text-xs text-white font-medium">
                      {c.name}
                    </div>
                    <div className="text-[10px] text-slate-500">{c.desc}</div>
                  </div>
                  <button
                    className={`text-xs px-3 py-1 rounded-lg ${
                      c.connected
                        ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800/50"
                        : "bg-slate-700 text-slate-400 hover:bg-slate-600"
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
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-4">
              News Sources
            </h3>
            <div className="space-y-2">
              {settings.news_sources.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between p-2 bg-slate-700/30 rounded"
                >
                  <div>
                    <div className="text-xs text-white">{s.name}</div>
                    <div className="text-[10px] text-slate-500">{s.url}</div>
                  </div>
                  <ToggleSwitch
                    defaultOn={s.active}
                    activeColor="bg-indigo-600"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-4">
              Copilot Skills
            </h3>
            <div className="space-y-2">
              {settings.copilot_skills.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between p-2 bg-slate-700/30 rounded"
                >
                  <div className="flex items-center gap-2">
                    <Bot size={14} className="text-indigo-400" />
                    <div>
                      <div className="text-xs text-white">{s.name}</div>
                      <div className="text-[10px] text-slate-500">
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
