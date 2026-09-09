'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import AppShell from '@/components/AppShell';
import AuthGuard from '@/components/AuthGuard';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import ErrorState from '@/components/ui/ErrorState';
import { SkeletonStat } from '@/components/ui/Skeleton';
import TrendChart from '@/components/charts/TrendChart';
import DonutChart from '@/components/charts/DonutChart';
import { CalendarRange, CheckCircle2 } from 'lucide-react';

const statMeta = {
  properties: { label: 'Properties', icon: null },
  units: { label: 'Units', icon: null },
  occupied: { label: 'Occupied units', icon: null },
  vacant: { label: 'Vacant units', icon: null },
  occupancy_rate: { label: 'Occupancy rate', icon: null },
  tenants: { label: 'Tenants', icon: null },
  collected: { label: 'Collected', icon: null },
  expected_monthly: { label: 'Expected monthly', icon: null },
  outstanding: { label: 'Outstanding', icon: null },
  expenses: { label: 'Expenses', icon: null },
  net: { label: 'Net income', icon: null },
  collection_rate: { label: 'Collection rate', icon: null },
  active: { label: 'Active leases', icon: null },
  expiring_soon: { label: 'Expiring leases', icon: null },
  urgent: { label: 'Urgent maintenance', icon: null },
};

const moneyKeys = new Set(['collected', 'expected_monthly', 'outstanding', 'expenses', 'net']);

function isRateKey(key) {
  return key === 'occupancy_rate' || key === 'collection_rate';
}

function formatValue(key, value) {
  const num = Number(value || 0);
  if (moneyKeys.has(key)) return `ETB ${num.toLocaleString()}`;
  if (isRateKey(key)) return `${num.toLocaleString()}%`;
  return num.toLocaleString();
}

export default function ReportsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({ date_from: '', date_to: '' });
  const [appliedFilters, setAppliedFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return undefined;
    if (!isAuthenticated) {
      router.replace('/login');
      return undefined;
    }

    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await apiClient.getReports(appliedFilters);
        if (!active) return;
        if (response.success) setData(response.data);
        else setError(response.message || 'Reports are unavailable right now.');
      } catch (error) {
        if (active) setError('Reports are unavailable right now.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [appliedFilters, authLoading, isAuthenticated, router]);

  if (authLoading || loading) {
    return (
      <AppShell>
        <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10">
          <PageHeader eyebrow="Performance reporting" title="Reports" description="A clear snapshot of authorized portfolio performance." />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)}
          </div>
        </main>
      </AppShell>
    );
  }

  if (!user) return null;

  const stats = [
    ...Object.entries(data?.portfolio || {}),
    ...Object.entries(data?.financial || {}),
    ...Object.entries(data?.leases || {}).filter(([key]) => ['active', 'expiring_soon'].includes(key)),
    ['urgent', data?.maintenance?.urgent || 0],
  ];

  const occupancy = Number(data?.portfolio?.occupancy_rate || 0);
  const collection = Number(data?.financial?.collection_rate || 0);

  const occupancyData = [
    { name: 'Occupied', value: Number(data?.portfolio?.occupied || 0) },
    { name: 'Vacant', value: Number(data?.portfolio?.vacant || 0) },
  ];

  const maintenanceData = [
    { name: 'Open', value: Number(data?.maintenance?.open || 0), color: '#f59e0b' },
    { name: 'In progress', value: Number(data?.maintenance?.in_progress || 0), color: '#3b82f6' },
    { name: 'Completed', value: Number(data?.maintenance?.completed || 0), color: '#14b8a6' },
  ];

  return (
    <AuthGuard roles={['administrator', 'owner']}>
      <AppShell>
      <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10">
        <PageHeader
          eyebrow={user.role === 'administrator' ? 'Platform reporting' : 'Performance reporting'}
          title="Reports"
          description="A clear snapshot of authorized portfolio performance."
        />

        {/* Period filter */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setLoading(true);
            setError('');
            setAppliedFilters(filters);
          }}
          className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <label className="text-xs font-semibold text-slate-600">
            From
            <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} className="field-input mt-1" />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            To
            <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} className="field-input mt-1" />
          </label>
          <button type="submit" className="btn btn-primary">
            <CalendarRange size={16} />
            Apply period
          </button>
        </form>

        {error ? (
          <ErrorState message={error} onRetry={() => setAppliedFilters({ ...filters })} className="mt-6" />
        ) : (
          <>
            <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map(([key, value]) => (
                <StatCard
                  key={key}
                  icon={statMeta[key]?.icon}
                  label={statMeta[key]?.label || key.replace(/_/g, ' ')}
                  tone={key === 'outstanding' || key === 'urgent' ? 'gold' : 'default'}
                  value={formatValue(key, value)}
                />
              ))}
            </section>

            <section className="mt-8 grid gap-4 sm:grid-cols-2">
              <ProgressCard label="Occupancy" value={occupancy} detail={`${formatValue('occupied', data?.portfolio?.occupied)} of ${formatValue('units', data?.portfolio?.units)} units leased`} color="bg-teal-500" />
              <ProgressCard label="Collection rate" value={collection} detail={`${formatValue('collected', data?.financial?.collected)} of ${formatValue('expected_monthly', data?.financial?.expected_monthly)} expected`} color="bg-teal-600" />
            </section>

            {/* Trend chart */}
            <section className="card mt-8 p-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="page-eyebrow">Cash flow</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-950">Collections vs expenses, last 6 months</h2>
                </div>
              </div>
              <div className="mt-5">
                <TrendChart data={data?.trends || {}} />
              </div>
            </section>

            {/* Donuts */}
            <section className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="card p-6">
                <p className="page-eyebrow">Portfolio</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">Occupancy split</h2>
                <div className="mt-4">
                  <DonutChart data={occupancyData} height={240} centerLabel={`${occupancy.toFixed(1)}%`} />
                </div>
              </div>
              <div className="card p-6">
                <p className="page-eyebrow">Maintenance</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">Requests by status</h2>
                <div className="mt-4">
                  <DonutChart data={maintenanceData} height={240} />
                </div>
                <p className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500">
                  <CheckCircle2 size={14} className="text-teal-600" />
                  Completed requests included for this period
                </p>
              </div>
            </section>
          </>
        )}
      </main>
    </AppShell>
    </AuthGuard>
  );
}

function ProgressCard({ label, value, detail, color }) {
  return (
    <section className="card p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-semibold text-slate-950">{label}</h2>
          <p className="mt-1 text-sm text-slate-500">{detail}</p>
        </div>
        <p className="text-2xl font-semibold text-slate-950">{Number(value || 0).toFixed(1)}%</p>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${label} progress`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={value}>
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, Number(value || 0)))}%` }} />
      </div>
    </section>
  );
}