'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Shield,
  Building2,
  Users,
  FileText,
  CreditCard,
  Wrench,
  BarChart3,
  MessageSquare,
  Bell,
  Settings,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import GlobalSearch from '@/components/GlobalSearch';
import NotificationPopover from '@/components/NotificationPopover';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Properties', path: '/properties', icon: Building2, roles: ['administrator', 'owner', 'manager'] },
      { label: 'Tenants', path: '/tenants', icon: Users, roles: ['administrator', 'owner', 'manager'] },
      { label: 'Leases', path: '/leases', icon: FileText },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Payments', path: '/payments', icon: CreditCard },
      { label: 'Maintenance', path: '/maintenance', icon: Wrench },
      { label: 'Reports', path: '/reports', icon: BarChart3, roles: ['administrator', 'owner'] },
    ],
  },
  {
    label: 'Communication',
    items: [
      { label: 'Discussion', path: '/discussion', icon: MessageSquare },
      { label: 'Notifications', path: '/notifications', icon: Bell },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Settings', path: '/settings', icon: Settings },
      { label: 'Profile', path: '/profile', icon: User, roles: ['tenant'] },
    ],
  },
];

const adminItems = [
  { label: 'User access', path: '/admin/users', icon: Shield, roles: ['administrator'] },
];

const roleLabels = {
  administrator: 'Administrator',
  owner: 'Property owner',
  manager: 'Property manager',
  tenant: 'Tenant',
};

const tenantGroupLabels = {
  Management: 'My tenancy',
  Operations: 'My activity',
  Communication: 'Communication',
  Account: 'Account',
};

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const isActive = (item) =>
    pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(`${item.path}/`));

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => !item.roles || item.roles.includes(user.role))
        .map((item) =>
          user.role === 'tenant' && item.path === '/leases'
            ? { ...item, label: 'My lease' }
            : item
        ),
    }))
    .filter((group) => group.items.length > 0)
    .map((group) =>
      user.role === 'tenant'
        ? { ...group, label: tenantGroupLabels[group.label] || group.label }
        : group
    );

  const visibleAdminItems = adminItems.filter((item) => !item.roles || item.roles.includes(user.role));

  const NavContent = (
    <>
      <div className="flex h-20 shrink-0 items-center border-b border-white/[0.06] px-6">
        <Logo size="md" variant="light" />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6 scrollbar-dark" aria-label="Primary navigation">
        {visibleAdminItems.length > 0 && (
          <div>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Administration</p>
            <div className="mt-2 space-y-1">
              {visibleAdminItems.map((item) => (
                <NavItem key={item.path} item={item} active={isActive(item)} onClick={() => { setMobileOpen(false); router.push(item.path); }} />
              ))}
            </div>
          </div>
        )}

        {visibleGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{group.label}</p>
            <div className="mt-2 space-y-1">
              {group.items.map((item) => (
                <NavItem key={item.path} item={item} active={isActive(item)} onClick={() => { setMobileOpen(false); router.push(item.path); }} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/[0.06] p-4">
        <div className="rounded-xl bg-white/[0.05] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-sm font-bold text-teal-300">
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user.name}</p>
              <p className="mt-0.5 text-xs capitalize text-teal-400">{roleLabels[user.role] || user.role}</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-3 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-400 transition hover:bg-white/[0.06] hover:text-red-400"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-[#0b1220] md:flex">
        {NavContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="modal-backdrop absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-[#0b1220] shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-5 z-10 rounded-lg p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white"
            >
              <X size={18} />
            </button>
            {NavContent}
          </aside>
        </div>
      )}

      <div className="md:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-[#f0f4f8]/85 backdrop-blur-xl">
          <div className="flex min-h-20 flex-wrap items-center gap-3 px-4 py-3 sm:px-8">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-200/60 md:hidden"
              aria-label="Open navigation"
            >
              <Menu size={22} />
            </button>
            <button onClick={() => router.push('/dashboard')} className="md:hidden" aria-label="Go to dashboard">
              <Logo size="sm" markOnly />
            </button>
            <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
              <div className="hidden min-w-0 flex-1 sm:block sm:max-w-md lg:max-w-xl">
                <GlobalSearch />
              </div>
              <NotificationPopover />
              <button
                onClick={handleLogout}
                className="btn btn-secondary shrink-0 px-3 py-2 text-sm md:hidden"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}

function NavItem({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        active
          ? 'translate-x-1 bg-teal-500/[0.14] text-white shadow-[inset_2px_0_0_0_#14b8a6]'
          : 'text-slate-400 hover:translate-x-1 hover:bg-white/[0.06] hover:text-white'
      }`}
    >
      <Icon size={17} strokeWidth={active ? 2.1 : 1.7} className={active ? 'text-teal-300' : 'text-slate-500 group-hover:text-teal-300'} />
      <span className="flex-1 text-left">{item.label}</span>
      {active && <span className="h-1.5 w-1.5 rounded-full bg-teal-300" />}
    </button>
  );
}