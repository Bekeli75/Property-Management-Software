'use client';

/**
 * @typedef {Object} SkeletonProps
 * @property {string} [className]
 * @property {'text'|'circular'|'rectangular'} [variant]
 * @property {string|number} [width]
 * @property {string|number} [height]
 */

export default function Skeleton({ className = '', variant = 'text', width, height }) {
  const baseClasses = 'skeleton animate-pulse';
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} style={style} aria-hidden="true" />
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`card p-6 ${className}`}>
      <Skeleton variant="rectangular" width="100%" height={24} className="mb-4" />
      <Skeleton variant="text" width="60%" height={16} className="mb-2" />
      <Skeleton variant="text" width="40%" height={16} className="mb-2" />
      <Skeleton variant="text" width="30%" height={16} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div className="card overflow-hidden">
      <div className="bg-slate-50/70 px-6 py-3 border-b border-slate-100">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} variant="text" width="80px" height="12px" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-slate-50">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4 flex gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} variant="text" width="80px" height="16px" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({ items = 5, hasAvatar = true }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          {hasAvatar && <Skeleton variant="circular" width={40} height={40} />}
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="40%" height={16} />
            <Skeleton variant="text" width="60%" height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonStat({ className = '' }) {
  return (
    <div className={`card p-6 ${className}`}>
      <Skeleton variant="text" width="80px" height={14} className="mb-4" />
      <Skeleton variant="text" width="100px" height={32} className="mb-2" />
      <Skeleton variant="text" width="60px" height={12} />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-6">
            <Skeleton variant="text" width="80px" height={14} className="mb-4" />
            <Skeleton variant="text" width="100px" height={32} className="mb-2" />
            <Skeleton variant="text" width="60px" height={12} />
          </div>
        ))}
      </div>
      <SkeletonTable rows={5} columns={4} />
    </div>
  );
}