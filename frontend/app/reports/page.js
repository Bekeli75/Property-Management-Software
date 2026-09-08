'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import Logo from '@/components/Logo';

const labels = { properties: 'Properties', units: 'Units', occupied: 'Occupied units', vacant: 'Vacant units', occupancy_rate: 'Occupancy rate', tenants: 'Tenants', collected: 'Collected', expected_monthly: 'Expected monthly', outstanding: 'Outstanding', expenses: 'Expenses', net: 'Net income', collection_rate: 'Collection rate', active: 'Active leases', expiring_soon: 'Expiring leases', urgent: 'Urgent maintenance' };
const money = new Set(['collected', 'expected_monthly', 'outstanding', 'expenses', 'net']);

export default function ReportsPage() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
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
    apiClient.getReports(appliedFilters).then((response) => {
      if (!active) return;
      if (response.success) setData(response.data);
      else setError(response.message || 'Reports are unavailable right now.');
    }).catch(() => { if (active) setError('Reports are unavailable right now.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [appliedFilters, authLoading, isAuthenticated, router]);
  if (authLoading || loading || !user) return <main className="flex min-h-screen items-center justify-center bg-[#f6f8fb]"><p className="text-sm text-slate-500">Preparing reports...</p></main>;
  const stats = [
    ...Object.entries(data?.portfolio || {}),
    ...Object.entries(data?.financial || {}),
    ...Object.entries(data?.leases || {}).filter(([key]) => ['active', 'expiring_soon'].includes(key)),
    ['urgent', data?.maintenance?.urgent || 0],
  ];
  const occupancy = Number(data?.portfolio?.occupancy_rate || 0);
  const collection = Number(data?.financial?.collection_rate || 0);
  return <div className="min-h-screen bg-[#f6f8fb] text-slate-900"><Header router={router} logout={logout} /><main className="mx-auto max-w-6xl px-5 py-8 sm:px-8"><p className="text-sm font-semibold text-teal-700">{user.role === 'administrator' ? 'Platform reporting' : 'Performance reporting'}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Reports</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">A clear snapshot of authorized portfolio performance.</p><form onSubmit={(event) => { event.preventDefault(); setLoading(true); setError(''); setAppliedFilters(filters); }} className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><label className="text-xs font-semibold text-slate-600">From<input type="date" value={filters.date_from} onChange={(event) => setFilters({ ...filters, date_from: event.target.value })} className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label><label className="text-xs font-semibold text-slate-600">To<input type="date" value={filters.date_to} onChange={(event) => setFilters({ ...filters, date_to: event.target.value })} className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label><button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Apply period</button></form>{error ? <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : <><section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map(([key, value], index) => <div key={`${key}-${index}`} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{labels[key] || key.replace(/_/g, ' ')}</p><p className="mt-4 text-2xl font-semibold text-slate-950">{money.has(key) ? `ETB ${Number(value || 0).toLocaleString()}` : key.includes('rate') ? `${Number(value || 0).toLocaleString()}%` : Number(value || 0).toLocaleString()}</p></div>)}</section><section className="mt-8 grid gap-6 md:grid-cols-2"><ProgressCard label="Occupancy" value={occupancy} detail={`${data?.portfolio?.occupied || 0} occupied of ${data?.portfolio?.units || 0} units`} color="bg-teal-600" /><ProgressCard label="Collection rate" value={collection} detail={`ETB ${Number(data?.financial?.collected || 0).toLocaleString()} collected`} color="bg-indigo-600" /></section><section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-semibold text-slate-950">Maintenance and lease attention</h2><div className="mt-4 grid gap-4 sm:grid-cols-4">{Object.entries(data?.maintenance || {}).map(([key, value]) => <div key={key}><p className="text-xs capitalize text-slate-500">{key.replace(/_/g, ' ')}</p><p className="mt-1 text-lg font-semibold">{value}</p></div>)}</div></section></>}</main></div>;
}

function ProgressCard({ label, value, detail, color }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-end justify-between gap-4"><div><h2 className="font-semibold text-slate-950">{label}</h2><p className="mt-1 text-sm text-slate-500">{detail}</p></div><p className="text-2xl font-semibold text-slate-950">{value.toFixed(1)}%</p></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${label} progress`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={value}><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div></section>;
}

function Header({ router, logout }) {
  return <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8"><button onClick={() => router.push('/dashboard')} aria-label="Back to dashboard"><Logo size="md" /></button><div className="flex items-center gap-4"><button onClick={() => router.push('/dashboard')} className="text-sm font-semibold text-slate-600 hover:text-slate-950">Back to dashboard</button><button onClick={logout} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600">Sign out</button></div></div></header>;
}

