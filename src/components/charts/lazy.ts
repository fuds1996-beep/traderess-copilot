import dynamic from "next/dynamic";

// Lazy load all Recharts-based chart components to reduce initial bundle size.
// Each chart is code-split into its own chunk and loaded on demand.

export const LazyPnlAreaChart = dynamic(() => import("./PnlAreaChart"), { ssr: false });
export const LazyWinLossPieChart = dynamic(() => import("./WinLossPieChart"), { ssr: false });
export const LazyAccountPnlBarChart = dynamic(() => import("./AccountPnlBarChart"), { ssr: false });
export const LazyWinRateLineChart = dynamic(() => import("./WinRateLineChart"), { ssr: false });
export const LazySessionBarChart = dynamic(() => import("./SessionBarChart"), { ssr: false });
export const LazyDayOfWeekBarChart = dynamic(() => import("./DayOfWeekBarChart"), { ssr: false });
export const LazyAccountBalanceLineChart = dynamic(() => import("./AccountBalanceLineChart"), { ssr: false });
export const LazyEmotionTimelineChart = dynamic(() => import("./EmotionTimelineChart"), { ssr: false });
export const LazyChartTimeBarChart = dynamic(() => import("./ChartTimeBarChart"), { ssr: false });
export const LazyCorrelationDualAxisChart = dynamic(() => import("./CorrelationDualAxisChart"), { ssr: false });
export const LazySkillRadarChart = dynamic(() => import("./SkillRadarChart"), { ssr: false });
export const LazyDisciplineRadarChart = dynamic(() => import("./DisciplineRadarChart"), { ssr: false });
export const LazyEffortScatterChart = dynamic(() => import("./EffortScatterChart"), { ssr: false });
