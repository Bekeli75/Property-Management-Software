import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function formatTrend(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  return num > 0
    ? { direction: 'up', text: `+${num.toLocaleString(undefined, { maximumFractionDigits: 1 })}%` }
    : num < 0
      ? { direction: 'down', text: `${num.toLocaleString(undefined, { maximumFractionDigits: 1 })}%` }
      : { direction: 'flat', text: '0%' };
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendLabel = 'vs last month',
  tone = 'default',
  className = '',
}) {
  const trendInfo = formatTrend(trend);

  const toneStyles = {
    default: {
      iconBg: 'bg-teal-50 text-teal-600',
      valueColor: 'text-slate-950',
    },
    gold: {
      iconBg: 'bg-amber-50 text-amber-600',
      valueColor: 'text-amber-700',
    },
    danger: {
      iconBg: 'bg-red-50 text-red-600',
      valueColor: 'text-red-700',
    },
    success: {
      iconBg: 'bg-emerald-50 text-emerald-600',
      valueColor: 'text-emerald-700',
    },
  };

  const style = toneStyles[tone] || toneStyles.default;

  return (
    <div className={`card group p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        {Icon && <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${style.iconBg} transition-transform duration-200 group-hover:scale-105`}><Icon size={20} strokeWidth={1.75} /></div>}
        {trendInfo && (
          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
            trendInfo.direction === 'up' ? 'text-emerald-600' :
            trendInfo.direction === 'down' ? 'text-red-600' :
            'text-slate-400'
          }`}>
            {trendInfo.direction === 'up' ? <TrendingUp size={14} /> : trendInfo.direction === 'down' ? <TrendingDown size={14} /> : <Minus size={14} />}
            {trendInfo.text}
          </span>
        )}
      </div>
      <p className={`mt-5 truncate text-2xl font-semibold tracking-tight ${style.valueColor}`}>{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
      {trendInfo && <p className="mt-0.5 text-xs text-slate-400">{trendLabel}</p>}
    </div>
  );
}
