'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';

function relativeTime(value) {
  if (!value) return 'Recently';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function NotificationPopover() {
  const router = useRouter();
  const containerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.getNotifications();
      if (response.success) setNotifications(response.data);
      else setError(response.message || 'Notifications are unavailable.');
    } catch {
      setError('Notifications are unavailable right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(loadNotifications);
    const handleOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const unreadCount = notifications.filter((item) => !item.read_at).length;

  const markRead = async (id) => {
    await apiClient.markNotificationRead(id);
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString() } : item));
  };

  const markAllRead = async () => {
    await apiClient.markAllNotificationsRead();
    setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        onClick={() => {
          setOpen((current) => !current);
            if (!open) loadNotifications();
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
      >
        <span aria-hidden="true" className="text-lg">&#128276;</span>
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div><h2 className="text-sm font-semibold text-slate-900">Notifications</h2><p className="mt-0.5 text-xs text-slate-500">{unreadCount ? `${unreadCount} unread` : 'All caught up'}</p></div>
            {unreadCount > 0 && <button onClick={markAllRead} className="text-xs font-semibold text-teal-700 hover:text-teal-900">Mark all read</button>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading && <p className="px-4 py-5 text-sm text-slate-500">Loading notifications...</p>}
            {!loading && error && <p className="px-4 py-5 text-sm text-red-700">{error}</p>}
            {!loading && !error && !notifications.length && <p className="px-4 py-5 text-sm text-slate-500">No notifications yet.</p>}
            {!loading && !error && notifications.slice(0, 8).map((item) => (
              <article key={item.id} className={`border-b border-slate-100 px-4 py-3 last:border-0 ${item.read_at ? '' : 'bg-teal-50/40'}`}>
                <div className="flex items-start gap-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal-500" /><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold text-slate-900">{item.title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{item.message}</p><div className="mt-2 flex items-center justify-between gap-3"><span className="text-[11px] text-slate-400">{relativeTime(item.created_at)}</span>{!item.read_at && <button onClick={() => markRead(item.id)} className="text-[11px] font-semibold text-teal-700">Mark read</button>}</div></div></div>
              </article>
            ))}
          </div>
          <button onClick={() => { setOpen(false); router.push('/notifications'); }} className="w-full border-t border-slate-100 px-4 py-3 text-center text-xs font-semibold text-slate-600 hover:bg-slate-50">View all notifications</button>
        </div>
      )}
    </div>
  );
}
