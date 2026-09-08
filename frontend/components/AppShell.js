'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import GlobalSearch from '@/components/GlobalSearch';
import NotificationPopover from '@/components/NotificationPopover';

const baseNavigation = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'User access', path: '/admin/users', roles: ['administrator'] },
  { label: 'Properties', path: '/properties', roles: ['administrator', 'owner', 'manager'] },
  { label: 'Tenants', path: '/tenants', roles: ['administrator', 'owner', 'manager'] },
  { label: 'Leases', path: '/leases' },
  { label: 'Payments', path: '/payments' },
  { label: 'Maintenance', path: '/maintenance' },
  { label: 'Discussion', path: '/discussion' },
  { label: 'Reports', path: '/reports', roles: ['administrator', 'owner', 'manager'] },
  { label: 'Notifications', path: '/notifications' },
  { label: 'Settings', path: '/settings' },
  { label: 'Profile', path: '/profile', roles: ['tenant'] },
];

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!user) return null;

  const navigation = baseNavigation.filter((item) => !item.roles || item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-24 items-center border-b border-slate-100 px-7"><Logo size="md" /></div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-7" aria-label="Primary navigation">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Workspace</p>
          <div className="mt-4 space-y-1">
            {navigation.map((item) => {
              const active = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(`${item.path}/`));
              return <button key={item.path} onClick={() => router.push(item.path)} aria-current={active ? 'page' : undefined} className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}><span>{item.label}</span>{active && <span className="h-1.5 w-1.5 rounded-full bg-teal-300" />}</button>;
            })}
          </div>
        </nav>
        <div className="border-t border-slate-100 p-4">
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">Signed in as</p><p className="mt-1 truncate text-sm font-semibold text-slate-900">{user.name}</p><p className="mt-1 text-xs capitalize text-teal-700">{user.role}</p></div>
          <button onClick={logout} className="mt-3 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-700">Sign out</button>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="border-b border-slate-200 bg-white">
          <div className="flex min-h-20 items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <button onClick={() => router.push('/dashboard')} className="lg:hidden" aria-label="Go to dashboard"><Logo size="sm" /></button>
            <div className="ml-auto flex w-full max-w-xl items-center justify-end gap-3"><GlobalSearch /><NotificationPopover /><button onClick={logout} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 lg:hidden">Sign out</button></div>
          </div>
          <nav className="flex gap-5 overflow-x-auto border-t border-slate-100 px-5 py-3 lg:hidden sm:px-8" aria-label="Mobile navigation">
            {navigation.map((item) => <button key={item.path} onClick={() => router.push(item.path)} className={`whitespace-nowrap text-sm font-medium ${pathname === item.path ? 'text-teal-700' : 'text-slate-500'}`}>{item.label}</button>)}
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
