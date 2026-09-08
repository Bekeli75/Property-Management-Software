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
  useEffect(() => {
    if (authLoading) return undefined;
    if (!isAuthenticated) {
      router.replace('/login');
      return undefined;
    }

    let active = true;
    apiClient.getReports().then((response) => { if (active && response.success) setData(response.data); }).catch((error) => console.error(error));
    return () => { active = false; };
  }, [authLoading, isAuthenticated, router]);
  if (authLoading || !user) return null;
  const stats = [
    ...Object.entries(data?.portfolio || {}),
    ...Object.entries(data?.financial || {}),
    ...Object.entries(data?.leases || {}).filter(([key]) => ['active', 'expiring_soon'].includes(key)),
    ['urgent', data?.maintenance?.urgent || 0],
  ];
  return <div className="min-h-screen bg-[#f6f8fb] text-slate-900"><Header router={router} logout={logout} /><main className="mx-auto max-w-6xl px-5 py-8 sm:px-8"><p className="text-sm font-semibold text-teal-700">{user.role === 'administrator' ? 'Platform reporting' : 'Performance reporting'}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Reports</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">A clear snapshot of authorized portfolio performance.</p><section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map(([key, value], index) => <div key={`${key}-${index}`} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{labels[key] || key.replace(/_/g, ' ')}</p><p className="mt-4 text-2xl font-semibold text-slate-950">{money.has(key) ? `ETB ${Number(value || 0).toLocaleString()}` : key.includes('rate') ? `${Number(value || 0).toLocaleString()}%` : Number(value || 0).toLocaleString()}</p></div>)}</section><section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-semibold text-slate-950">Maintenance and lease attention</h2><div className="mt-4 grid gap-4 sm:grid-cols-4">{Object.entries(data?.maintenance || {}).map(([key, value]) => <div key={key}><p className="text-xs capitalize text-slate-500">{key.replace(/_/g, ' ')}</p><p className="mt-1 text-lg font-semibold">{value}</p></div>)}</div></section></main></div>;
}

function Header({ router, logout }) { return <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8"><button onClick={() => router.push('/dashboard')} aria-label="Back to dashboard"><Logo size="md" /></button><div className="flex items-center gap-4"><button onClick={() => router.push('/dashboard')} className="text-sm font-semibold text-slate-600 hover:text-slate-950">Back to dashboard</button><button onClick={logout} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600">Sign out</button></div></div></header>; }
