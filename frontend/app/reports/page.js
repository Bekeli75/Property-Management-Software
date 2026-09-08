'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import Logo from '@/components/Logo';

const labels = { total_properties: 'Properties', assigned_properties: 'Assigned properties', total_units: 'Units', occupied_units: 'Occupied units', vacant_units: 'Vacant units', active_leases: 'Active leases', total_tenants: 'Tenants', total_users: 'Users', total_rent_collected: 'Rent collected', total_expenses: 'Expenses', net_income: 'Net income', total_payments: 'Payments', pending_maintenance: 'Pending maintenance' };
const money = new Set(['total_rent_collected', 'total_expenses', 'net_income', 'total_payments']);

export default function ReportsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  useEffect(() => {
    let active = true;
    apiClient.getDashboard().then((response) => { if (active && response.success) setData(response.data); }).catch((error) => console.error(error));
    return () => { active = false; };
  }, []);
  if (!user) return null;
  const stats = Object.entries(data?.statistics || {});
  return <div className="min-h-screen bg-[#f6f8fb] text-slate-900"><Header router={router} logout={logout} /><main className="mx-auto max-w-6xl px-5 py-8 sm:px-8"><p className="text-sm font-semibold text-teal-700">{user.role === 'administrator' ? 'Platform reporting' : 'Performance reporting'}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Reports</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">A clear snapshot of the data available to your {user.role} workspace.</p><section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map(([key, value]) => <div key={key} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{labels[key] || key.replace(/_/g, ' ')}</p><p className="mt-4 text-2xl font-semibold text-slate-950">{money.has(key) ? `ETB ${Number(value || 0).toLocaleString()}` : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : Number(value || 0).toLocaleString()}</p></div>)}</section><section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-semibold text-slate-950">Report scope</h2><p className="mt-2 text-sm leading-6 text-slate-500">{user.role === 'administrator' ? 'This report covers the complete platform.' : user.role === 'owner' ? 'This report covers properties you own.' : user.role === 'manager' ? 'This report covers properties assigned to you.' : 'This report covers your lease and account activity.'}</p></section></main></div>;
}

function Header({ router, logout }) { return <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8"><button onClick={() => router.push('/dashboard')} aria-label="Back to dashboard"><Logo size="md" /></button><div className="flex items-center gap-4"><button onClick={() => router.push('/dashboard')} className="text-sm font-semibold text-slate-600 hover:text-slate-950">Back to dashboard</button><button onClick={logout} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600">Sign out</button></div></div></header>; }
