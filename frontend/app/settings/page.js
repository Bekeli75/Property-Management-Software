'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import Logo from '@/components/Logo';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  if (!user) return null;

  const update = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus('');
    try {
      await apiClient.updateProfile(formData);
      setStatus('Your profile was updated successfully.');
    } catch (error) {
      setStatus(error.message || 'We could not update your profile.');
    } finally {
      setSaving(false);
    }
  };

  return <div className="min-h-screen bg-[#f6f8fb] text-slate-900"><Header router={router} logout={logout} /><main className="mx-auto max-w-3xl px-5 py-8 sm:px-8"><p className="text-sm font-semibold text-teal-700">Workspace settings</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Settings</h1><p className="mt-2 text-sm text-slate-500">Manage the contact details used by your property workspace.</p><form onSubmit={update} className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><div className="grid gap-5 sm:grid-cols-2"><Field label="Full name"><input required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} /></Field><Field label="Phone number"><input value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} /></Field><Field label="Email address"><input disabled value={user.email} /></Field><Field label="Role"><input disabled value={user.role} className="capitalize" /></Field></div>{status && <p className="mt-5 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{status}</p>}<button disabled={saving} className="mt-6 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save changes'}</button></form></main></div>;
}

function Field({ label, children }) { return <label className="block text-sm font-medium text-slate-700">{label}<span className="mt-2 block">{children}</span></label>; }
function Header({ router, logout }) { return <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8"><button onClick={() => router.push('/dashboard')} aria-label="Back to dashboard"><Logo size="md" /></button><div className="flex items-center gap-4"><button onClick={() => router.push('/dashboard')} className="text-sm font-semibold text-slate-600 hover:text-slate-950">Back to dashboard</button><button onClick={logout} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600">Sign out</button></div></div></header>; }
