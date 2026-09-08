'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import Logo from '@/components/Logo';

const notifications = [
  { title: 'Your account is ready', detail: 'Your tenant workspace is available.', time: 'Just now', tone: 'bg-teal-50 text-teal-700' },
  { title: 'Stay up to date', detail: 'Payment and maintenance updates will appear here.', time: 'Account notice', tone: 'bg-slate-100 text-slate-600' },
];

export default function NotificationsPage() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (authLoading) return undefined;
    if (!isAuthenticated) {
      router.replace('/login');
      return undefined;
    }

    let active = true;
    apiClient.getNotifications().then((response) => {
      if (active && response.success) setNotifications(response.data);
    }).catch((error) => console.error(error));
    return () => { active = false; };
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !user) return null;

  const markRead = async (id) => {
    await apiClient.markNotificationRead(id);
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString() } : item));
  };

  return <div className="min-h-screen bg-[#f6f8fb] text-slate-900"><Header router={router} logout={logout} /><main className="mx-auto max-w-3xl px-5 py-8 sm:px-8"><p className="text-sm font-semibold text-teal-700">My account</p><div className="mt-1 flex items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-tight">Notifications</h1><p className="mt-2 text-sm text-slate-500">Important updates about your home, payments, and requests.</p></div><span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">{notifications.filter((item) => !item.read_at).length} unread</span></div><section className="mt-8 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">{notifications.length ? notifications.map((item) => <article key={item.id} className="flex gap-4 p-5"><span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-teal-700">!</span><div className="flex-1"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold text-slate-900">{item.title}</h2>{!item.read_at && <button onClick={() => markRead(item.id)} className="text-xs font-semibold text-teal-700">Mark read</button>}</div><p className="mt-1 text-sm leading-6 text-slate-500">{item.message}</p></div></article>) : <p className="p-5 text-sm text-slate-500">No notifications yet.</p>}</section></main></div>;
}

function Header({ router, logout }) {
  return <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8"><button onClick={() => router.push('/dashboard')} aria-label="Back to dashboard"><Logo size="md" /></button><div className="flex items-center gap-4"><button onClick={() => router.push('/dashboard')} className="text-sm font-semibold text-slate-600 hover:text-slate-950">Back to dashboard</button><button onClick={logout} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-950">Sign out</button></div></div></header>;
}
