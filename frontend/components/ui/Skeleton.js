export default function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`card p-5 ${className}`} aria-hidden="true">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="mt-4 h-8 w-1/2" />
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-3/4" />
    </div>
  );
}

export function SkeletonTable({ rows = 6, cols = 5, className = '' }) {
  return (
    <div className={`card overflow-hidden ${className}`} aria-hidden="true">
      <div className="grid gap-4 border-b border-slate-100 bg-slate-50/60 p-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`h${i}`} className="h-3 w-16" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-4 border-b border-slate-50 p-4 last:border-0" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={`${r}-${c}`} className="h-4 w-24" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStat({ className = '' }) {
  return (
    <div className={`card p-5 ${className}`} aria-hidden="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="mt-5 h-8 w-24" />
      <Skeleton className="mt-2 h-3 w-16" />
    </div>
  );
}
