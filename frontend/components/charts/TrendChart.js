'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

function formatCurrency(value) {
  return `ETB ${Number(value).toLocaleString()}`;
}

export default function TrendChart({ data = [], height = 300 }) {
  const merged = data.collection?.length
    ? data.collection.map((item, i) => ({
        month: item.month,
        collected: item.amount,
        expenses: data.expenses?.[i]?.amount || 0,
      }))
    : [];

  if (!merged.length) {
    return (
      <div className="flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-6 text-center">
        <p className="text-sm font-semibold text-slate-600">No trend data yet</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">Monthly collections and expenses will appear here.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={merged} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} dy={6} />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => (value >= 1000 ? `${Math.round(value / 1000)}k` : String(value))}
            width={42}
          />
          <Tooltip
            cursor={{ fill: 'rgba(20, 184, 166, 0.06)' }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                  {payload.map((entry) => (
                    <p key={entry.dataKey} className="mt-1 text-sm font-semibold" style={{ color: entry.color }}>
                      {entry.name}: {formatCurrency(entry.value)}
                    </p>
                  ))}
                </div>
              );
            }}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) => <span className="capitalize text-slate-600">{value}</span>}
          />
          <Bar dataKey="collected" name="Collected" fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={36} />
          <Bar dataKey="expenses" name="Expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}