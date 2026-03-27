export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-brand-light/40 rounded-xl ${className}`} />
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`glass rounded-2xl p-4 border border-brand-light/40 ${className}`}>
      <div className="animate-pulse space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-brand-light/60 rounded" />
          <div className="h-3 bg-brand-light/60 rounded w-20" />
        </div>
        <div className="h-7 bg-brand-light/60 rounded w-16" />
        <div className="h-2 bg-brand-light/40 rounded w-24" />
      </div>
    </div>
  );
}

export function SkeletonChart({ className = "" }: { className?: string }) {
  return (
    <div className={`glass rounded-2xl p-5 border border-brand-light/40 ${className}`}>
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-brand-light/60 rounded w-32" />
        <div className="h-48 bg-brand-light/30 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <div className="animate-pulse flex gap-3 py-2">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-4 bg-brand-light/40 rounded flex-1" />
      ))}
    </div>
  );
}

export function SkeletonText({ width = "w-32" }: { width?: string }) {
  return <div className={`animate-pulse h-4 bg-brand-light/50 rounded ${width}`} />;
}

/** Full dashboard skeleton */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="animate-pulse h-8 bg-brand-light/50 rounded w-64" />
        <div className="animate-pulse h-4 bg-brand-light/30 rounded w-48" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} className="h-28" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SkeletonChart className="lg:col-span-2" />
        <SkeletonChart />
      </div>
    </div>
  );
}

/** Performance page skeleton */
export function PerformanceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="animate-pulse h-8 bg-brand-light/50 rounded w-56" />
          <div className="animate-pulse h-4 bg-brand-light/30 rounded w-72" />
        </div>
        <div className="animate-pulse h-9 bg-brand-light/40 rounded-xl w-64" />
      </div>
      <SkeletonCard className="h-32" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonChart />
        <SkeletonChart />
      </div>
      <div className="glass rounded-2xl p-5 border border-brand-light/40 space-y-2">
        {[...Array(4)].map((_, i) => <SkeletonTableRow key={i} />)}
      </div>
    </div>
  );
}

/** Journal page skeleton */
export function JournalSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="animate-pulse h-8 bg-brand-light/50 rounded w-56" />
        <div className="animate-pulse h-4 bg-brand-light/30 rounded w-72" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <SkeletonCard key={i} className="h-24" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonChart />
        <SkeletonChart />
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse glass rounded-2xl h-16 border border-brand-light/40" />
        ))}
      </div>
    </div>
  );
}

/** Discipline page skeleton */
export function DisciplineSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="animate-pulse h-8 bg-brand-light/50 rounded w-40" />
        <div className="animate-pulse h-4 bg-brand-light/30 rounded w-64" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <SkeletonCard className="lg:col-span-2 h-32" />
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} className="h-24" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonChart />
        <SkeletonChart />
      </div>
    </div>
  );
}

/** Profile page skeleton */
export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="animate-pulse h-8 bg-brand-light/50 rounded w-48" />
        <div className="animate-pulse h-4 bg-brand-light/30 rounded w-64" />
      </div>
      <div className="glass rounded-2xl p-6 border border-brand-light/40">
        <div className="animate-pulse flex items-start gap-6">
          <div className="w-20 h-20 bg-brand-light/60 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-brand-light/50 rounded w-32" />
            <div className="h-4 bg-brand-light/30 rounded w-64" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-brand-light/30 rounded" />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
