'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <Header router={router} logout={logout} />
      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        <p className="text-sm font-semibold text-teal-700">My account</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-2 text-sm text-slate-500">Keep your contact details current so your property team can reach you.</p>
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-lg font-semibold text-white">{user.name.charAt(0).toUpperCase()}</div>
            <div><h2 className="font-semibold text-slate-950">{user.name}</h2><p className="mt-1 text-sm capitalize text-teal-700">{user.role}</p></div>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2"><Info label="Full name" value={user.name} /><Info label="Email address" value={user.email} /><Info label="Phone number" value={user.phone || 'Not added yet'} /><Info label="Account type" value="Tenant account" /></div>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-slate-50 p-4"><p className="text-sm leading-6 text-slate-500">Update your name and phone number from workspace settings.</p><button onClick={() => router.push('/settings')} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Edit profile</button></div>
        </section>
      </main>
    </div>
  );
}

function Info({ label, value }) {
  return <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-sm font-medium text-slate-800">{value}</p></div>;
}

function Header({ router, logout }) {
  return <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8"><button onClick={() => router.push('/dashboard')} aria-label="Back to dashboard"><Logo size="md" /></button><div className="flex items-center gap-4"><button onClick={() => router.push('/dashboard')} className="text-sm font-semibold text-slate-600 hover:text-slate-950">Back to dashboard</button><button onClick={logout} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-950">Sign out</button></div></div></header>;
}
