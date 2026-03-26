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
import {
  WORKFLOW_STEPS,
  DATA_SOURCES,
  SCHEDULE_CONFIGS,
} from "@/lib/mock-data";

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
          <h1 className="text-2xl font-bold text-white">Copilot Workflow</h1>
          <p className="text-sm text-slate-400 mt-1">
            The automation pipeline that powers your trading copilot
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 text-slate-300 text-xs rounded-lg hover:bg-slate-600 transition-colors">
            <Timer size={12} /> Schedule
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500 transition-colors">
            <Play size={14} /> Run Full Pipeline
          </button>
        </div>
      </div>

      {/* Pipeline Phases */}
      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-4">
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
                        : "bg-indigo-900/30 border border-indigo-800/50"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={
                        isManual ? "text-amber-400" : "text-indigo-400"
                      }
                    />
                  </div>
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <div className="w-px h-8 bg-slate-700 mt-2" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-500 font-mono">
                      Phase {s.phase}
                    </span>
                    <h4 className="text-sm font-semibold text-white">
                      {s.title}
                    </h4>
                    {isManual ? (
                      <Badge variant="warning">Manual Input</Badge>
                    ) : (
                      <Badge variant="info">Automated</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{s.desc}</p>
                  {s.agents.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {s.agents.map((a) => (
                        <span
                          key={a}
                          className="text-[10px] px-2 py-0.5 bg-slate-700 rounded text-slate-300 flex items-center gap-1"
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
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-3">
            Data Sources
          </h3>
          <div className="space-y-2">
            {DATA_SOURCES.map((s) => {
              const SIcon = SOURCE_ICONS[s.icon];
              return (
                <div
                  key={s.name}
                  className="flex items-center justify-between p-2 bg-slate-700/30 rounded"
                >
                  <div className="flex items-center gap-2">
                    <SIcon size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-300">{s.name}</span>
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
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-3">
            Schedule Configuration
          </h3>
          <div className="space-y-3">
            {SCHEDULE_CONFIGS.map((cfg) => (
              <div key={cfg.name} className="p-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white font-medium">
                    {cfg.name}
                  </span>
                  <Badge
                    variant={cfg.status === "Active" ? "success" : "info"}
                  >
                    {cfg.status}
                  </Badge>
                </div>
                <div className="text-[10px] text-slate-400">{cfg.desc}</div>
                {cfg.note && (
                  <div className="text-[10px] text-slate-500 mt-0.5">
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
