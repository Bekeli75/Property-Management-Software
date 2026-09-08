'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import Logo from '@/components/Logo';
import AuthGuard from '@/components/AuthGuard';

const roleLabels = {
  administrator: 'Administrator',
  owner: 'Owner',
  manager: 'Manager',
  tenant: 'Tenant',
};

export default function AdminUsersPage() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'manager',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }

    let active = true;
    const loadUsers = async () => {
      try {
        const response = await apiClient.getUsers();
        if (active && response.success) setUsers(response.data);
      } catch (loadError) {
        if (active) setError('We could not load the user list. Please try again.');
        console.error(loadError);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadUsers();

    return () => {
      active = false;
    };
  }, [isAuthenticated, isAdmin, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await apiClient.createUser(formData);
      if (!response.success) throw new Error('Unable to create user');
      setUsers((current) => [...current, response.data]);
      setFormData({ name: '', email: '', phone: '', password: '', role: 'manager' });
      setShowForm(false);
      setMessage(`${roleLabels[formData.role]} account created successfully.`);
    } catch (saveError) {
      setError(saveError.message || 'We could not create this account.');
    } finally {
      setSaving(false);
    }
  };

  const updateRole = async (account, role) => {
    setError('');
    setMessage('');
    try {
      const response = await apiClient.updateUserRole(account.id, role);
      if (!response.success) throw new Error('Unable to update role');
      setUsers((current) => current.map((item) => item.id === account.id ? { ...item, role } : item));
      setMessage(`${account.name} is now a ${roleLabels[role].toLowerCase()}.`);
    } catch (updateError) {
      setError(updateError.message || 'We could not update this role.');
    }
  };

  const visibleUsers = filter === 'all' ? users : users.filter((account) => account.role === filter);
  const countFor = (role) => users.filter((account) => account.role === role).length;

  if (!user || !isAdmin) return null;

  return (
    <AuthGuard roles={['administrator']}>
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <button onClick={() => router.push('/dashboard')} aria-label="Back to dashboard"><Logo size="md" /></button>
          <div className="flex items-center gap-4"><span className="hidden text-sm text-slate-500 sm:block">Administrator workspace</span><button onClick={() => router.push('/dashboard')} className="text-sm font-semibold text-slate-600 hover:text-slate-950">Back to dashboard</button><button onClick={logout} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-950">Sign out</button></div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="text-sm font-semibold text-teal-700">Access control</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">User management</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Create owners and managers, review tenant accounts, and keep platform access under administrator control.</p></div>
          <button onClick={() => setShowForm((visible) => !visible)} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">{showForm ? 'Close form' : 'Add staff account'}</button>
        </div>

        {message && <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{message}</div>}
        {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</div>}

        {showForm && <form onSubmit={handleSubmit} className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Create staff account</h2><p className="mt-1 text-sm text-slate-500">Only administrators can create owner and manager accounts.</p></div><span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">Admin only</span></div><div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Full name"><input required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} /></Field><Field label="Email"><input required type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} /></Field><Field label="Phone"><input value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} /></Field><Field label="Temporary password"><input required minLength={8} type="password" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} /></Field><Field label="Role"><select value={formData.role} onChange={(event) => setFormData({ ...formData, role: event.target.value })}><option value="manager">Manager</option><option value="owner">Owner</option></select></Field></div><button disabled={saving} className="mt-5 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">{saving ? 'Creating...' : 'Create account'}</button></form>}

        <div className="mt-8 grid gap-4 sm:grid-cols-4"><SummaryCard label="All accounts" value={users.length} /><SummaryCard label="Owners" value={countFor('owner')} /><SummaryCard label="Managers" value={countFor('manager')} /><SummaryCard label="Tenants" value={countFor('tenant')} /></div>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center"><div><h2 className="font-semibold text-slate-950">Accounts and roles</h2><p className="mt-1 text-sm text-slate-500">Change staff roles when responsibilities change.</p></div><div className="flex gap-2 overflow-x-auto">{['all', 'administrator', 'owner', 'manager', 'tenant'].map((value) => <button key={value} onClick={() => setFilter(value)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold capitalize ${filter === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-900'}`}>{value}</button>)}</div></div><div className="overflow-x-auto">{loading ? <p className="p-6 text-sm text-slate-500">Loading accounts...</p> : <table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3 font-semibold">User</th><th className="px-5 py-3 font-semibold">Email</th><th className="px-5 py-3 font-semibold">Role</th><th className="px-5 py-3 font-semibold">Access</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleUsers.map((account) => <tr key={account.id}><td className="px-5 py-4"><p className="font-semibold text-slate-900">{account.name}</p><p className="mt-1 text-xs text-slate-400">{account.phone || 'No phone added'}</p></td><td className="px-5 py-4 text-slate-500">{account.email}</td><td className="px-5 py-4"><span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">{roleLabels[account.role]}</span></td><td className="px-5 py-4">{account.role === 'administrator' ? <span className="text-xs font-medium text-slate-400">Protected</span> : <select aria-label={`Change role for ${account.name}`} value={account.role} onChange={(event) => updateRole(account, event.target.value)} className="rounded-md border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-700"><option value="tenant">Tenant</option><option value="manager">Manager</option><option value="owner">Owner</option></select>}</td></tr>)}</tbody></table>}</div></section>
      </main>
    </div>
    </AuthGuard>
  );
}

function Field({ label, children }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<span className="mt-2 block">{children}</span></label>;
}

function SummaryCard({ label, value }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p></div>;
}
