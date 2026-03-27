import {
  Upload,
  Shield,
  Calendar,
  Newspaper,
  BookOpen,
  CheckCircle,
  Lightbulb,
  FileText,
  Globe,
  AlertCircle,
  Bot,
  Play,
  Timer,
} from "lucide-react";
import Badge from "@/components/ui/Badge";

const WORKFLOW_STEPS = [
  { phase: "0A", title: "Extract Weekly Trading Data", icon: "Upload" as const, desc: "Navigate to Google Sheets tracker. Extract latest week\u2019s trading data. Update performance records.", agents: ["Performance File Updater", "Traders Profile Updater"], status: "ready" as const },
  { phase: "0B", title: "Verify Data Extraction", icon: "Shield" as const, desc: "Verification agent cross-checks extracted data against source spreadsheet.", agents: ["Verification Agent"], status: "ready" as const },
  { phase: "1", title: "Receive Economic Calendar", icon: "Calendar" as const, desc: "Paste raw economic calendar for the upcoming week. Convert to CET. Parse high/medium impact events.", agents: [], status: "manual" as const },
  { phase: "2", title: "Extract FX Articles", icon: "Newspaper" as const, desc: "Navigate to EUR/USD and DXY news pages. Extract top article links from each.", agents: ["EUR/USD Article Reader", "DXY Article Reader"], status: "ready" as const },
  { phase: "3", title: "Deep Read Articles", icon: "BookOpen" as const, desc: "Open each article, read full text, extract key institutional insights \u2014 not just headlines.", agents: ["Agent 1: EUR/USD Reader", "Agent 2: DXY Reader"], status: "ready" as const },
  { phase: "4", title: "Verification Gate", icon: "CheckCircle" as const, desc: "Cross-checks article summaries to confirm genuine deep-dive analysis, not headline scraping.", agents: ["Verification Agent"], status: "ready" as const },
  { phase: "5", title: "Simplification Pass", icon: "Lightbulb" as const, desc: "Simplifies complex terminology. Keeps key terms but explains in plain English for gradual learning.", agents: ["Simplification Agent"], status: "ready" as const },
  { phase: "6", title: "Compile & Deliver Briefing", icon: "FileText" as const, desc: "Compile weekly briefing from all sources. Inject previous week\u2019s trading insights. Generate briefing.", agents: ["Briefing Compiler"], status: "ready" as const },
];

const DATA_SOURCES = [
  { name: "Google Sheets Tracker", status: "connected" as const, icon: "FileText" as const },
  { name: "FX Street EUR/USD", status: "connected" as const, icon: "Globe" as const },
  { name: "FX Street DXY", status: "connected" as const, icon: "Globe" as const },
  { name: "Economic Calendar", status: "manual" as const, icon: "Calendar" as const },
];

const SCHEDULE_CONFIGS = [
  { name: "Daily Briefing", status: "Active", desc: "Runs Phase 1\u20136 \u00b7 Mon\u2013Fri at 06:00 CET", note: "Skips Phase 0A/0B (weekly only)" },
  { name: "Full Weekly Run", status: "Active", desc: "Runs Phase 0A\u20136 \u00b7 Sunday at 19:00 CET", note: "Includes data extraction + performance update" },
  { name: "Monthly Evaluation", status: "Planned", desc: "Last Sunday of month \u00b7 Full performance report", note: null },
];

const STEP_ICONS = {
  Upload,
  Shield,
  Calendar,
  Newspaper,
  BookOpen,
  CheckCircle,
  Lightbulb,
  FileText,
} as const;

const SOURCE_ICONS = {
  FileText,
  Globe,
  Calendar,
  AlertCircle,
} as const;

export default function WorkflowPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Copilot Workflow</h1>
          <p className="text-sm text-gray-500 mt-1">
            The automation pipeline that powers your trading copilot
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-brand-light/60 text-gray-600 text-xs rounded-lg hover:bg-slate-600 transition-colors">
            <Timer size={12} /> Schedule
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm rounded-lg hover:bg-brand-dark transition-colors">
            <Play size={14} /> Run Full Pipeline
          </button>
        </div>
      </div>

      {/* Pipeline Phases */}
      <div className="glass rounded-2xl p-5 border border-brand-light/40">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Pipeline Phases
        </h3>
        <div className="space-y-3">
          {WORKFLOW_STEPS.map((s, i) => {
            const Icon = STEP_ICONS[s.icon];
            const isManual = s.status === "manual";
            return (
              <div key={s.phase} className="flex gap-4 items-start">
                {/* Icon + connector line */}
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isManual
                        ? "bg-amber-900/30 border border-amber-800/50"
                        : "bg-brand-light/50 border border-brand-light/50"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={
                        isManual ? "text-amber-400" : "text-brand"
                      }
                    />
                  </div>
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <div className="w-px h-8 bg-brand-light/60 mt-2" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400 font-mono">
                      Phase {s.phase}
                    </span>
                    <h4 className="text-sm font-semibold text-gray-900">
                      {s.title}
                    </h4>
                    {isManual ? (
                      <Badge variant="warning">Manual Input</Badge>
                    ) : (
                      <Badge variant="info">Automated</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{s.desc}</p>
                  {s.agents.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {s.agents.map((a) => (
                        <span
                          key={a}
                          className="text-[10px] px-2 py-0.5 bg-brand-light/60 rounded text-gray-600 flex items-center gap-1"
                        >
                          <Bot size={10} /> {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Sources + Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Data Sources */}
        <div className="glass rounded-2xl p-5 border border-brand-light/40">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Data Sources
          </h3>
          <div className="space-y-2">
            {DATA_SOURCES.map((s) => {
              const SIcon = SOURCE_ICONS[s.icon];
              return (
                <div
                  key={s.name}
                  className="flex items-center justify-between p-2 bg-brand-light/80 rounded"
                >
                  <div className="flex items-center gap-2">
                    <SIcon size={14} className="text-gray-500" />
                    <span className="text-xs text-gray-600">{s.name}</span>
                  </div>
                  <Badge
                    variant={
                      s.status === "connected"
                        ? "success"
                        : s.status === "manual"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {s.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Schedule Configuration */}
        <div className="glass rounded-2xl p-5 border border-brand-light/40">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Schedule Configuration
          </h3>
          <div className="space-y-3">
            {SCHEDULE_CONFIGS.map((cfg) => (
              <div key={cfg.name} className="p-3 bg-brand-light/80 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-900 font-medium">
                    {cfg.name}
                  </span>
                  <Badge
                    variant={cfg.status === "Active" ? "success" : "info"}
                  >
                    {cfg.status}
                  </Badge>
                </div>
                <div className="text-[10px] text-gray-500">{cfg.desc}</div>
                {cfg.note && (
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {cfg.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
