'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const palette = ['#14b8a6', '#f59e0b', '#3b82f6', '#94a3b8'];

export default function DonutChart({ data = [], height = 240, centerLabel }) {
  if (!data.length) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-6 text-center">
        <p className="text-sm font-semibold text-slate-600">No data yet</p>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);

  return (
    <div className="relative" style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={3}
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={entry.color || palette[index % palette.length]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0];
              return (
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
                  <p className="text-sm font-semibold text-slate-900">
                    {item.name}: <span className="text-teal-700">{(Number(item.value)).toLocaleString()}</span>
                  </p>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {centerLabel && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-slate-950">{centerLabel}</p>
          <p className="mt-0.5 text-xs text-slate-400">{total.toLocaleString()} total</p>
        </div>
      )}
    </div>
  );
}