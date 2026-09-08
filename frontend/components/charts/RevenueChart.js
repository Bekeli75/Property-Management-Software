'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

function formatCurrency(value) {
  return `ETB ${Number(value).toLocaleString()}`;
}

export default function RevenueChart({ data = [], height = 280, showGrid = true }) {
  if (!data.length) {
    return (
      <div className="flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-6 text-center">
        <p className="text-sm font-semibold text-slate-600">No revenue data yet</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          Revenue collected each month will appear here as payments are recorded.
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />}
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            dy={6}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => (value >= 1000 ? `${Math.round(value / 1000)}k` : String(value))}
            width={42}
          />
          <Tooltip
            cursor={{ stroke: '#14b8a6', strokeWidth: 1, strokeDasharray: '4 4' }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-1 text-base font-bold text-slate-900">{formatCurrency(payload[0].value)}</p>
                  <p className="mt-0.5 text-xs text-slate-500">Rent collected</p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="collected"
            stroke="#14b8a6"
            strokeWidth={2.5}
            fill="url(#revenueFill)"
            activeDot={{ r: 5, fill: '#0f766e', stroke: '#ffffff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}