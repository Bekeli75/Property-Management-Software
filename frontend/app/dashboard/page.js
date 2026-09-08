'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import Logo from '@/components/Logo';
import GlobalSearch from '@/components/GlobalSearch';
import NotificationPopover from '@/components/NotificationPopover';

const roleLabels = {
  administrator: 'Administrator',
  owner: 'Property owner',
  manager: 'Property manager',
  tenant: 'Tenant',
};

const roleDashboard = {
  administrator: {
    eyebrow: 'Platform command center',
    title: 'Keep the entire operation under control.',
    description: 'Review platform health, users, properties, payments, and unresolved work from one administrative view.',
    primaryAction: { label: 'Review all properties', path: '/properties' },
    actions: [
      { label: 'Manage users', path: '/admin/users', detail: 'Manage people and access' },
      { label: 'Review properties', path: '/properties', detail: 'Oversee the portfolio' },
      { label: 'Resolve maintenance', path: '/maintenance', detail: 'Monitor every request' },
    ],
    access: 'You have platform-wide visibility across properties, users, leases, payments, and maintenance.',
    nav: [
      { label: 'User access', path: '/admin/users' },
      { label: 'Properties', path: '/properties' },
      { label: 'Tenants', path: '/tenants' },
      { label: 'Leases', path: '/leases' },
      { label: 'Maintenance', path: '/maintenance' },
      { label: 'Payments', path: '/payments' },
      { label: 'Discussion', path: '/discussion' },
      { label: 'Notifications', path: '/notifications' },
      { label: 'Reports', path: '/reports' },
      { label: 'Settings', path: '/settings' },
    ],
  },
  owner: {
    eyebrow: 'Portfolio command center',
    title: 'See how your properties are performing.',
    description: 'Track occupancy, income, expenses, leases, and the maintenance work affecting your investment.',
    primaryAction: { label: 'Manage my properties', path: '/properties' },
    actions: [
      { label: 'Add a property', path: '/properties', detail: 'Grow your portfolio' },
      { label: 'Review income', path: '/payments', detail: 'Track collected rent' },
      { label: 'Review expenses', path: '/maintenance', detail: 'Protect property value' },
    ],
    access: 'You control your properties, units, leases, financial activity, and portfolio maintenance.',
    nav: [
      { label: 'My properties', path: '/properties' },
      { label: 'Tenants', path: '/tenants' },
      { label: 'Leases', path: '/leases' },
      { label: 'Maintenance', path: '/maintenance' },
      { label: 'Payments', path: '/payments' },
      { label: 'Discussion', path: '/discussion' },
      { label: 'Notifications', path: '/notifications' },
      { label: 'Reports', path: '/reports' },
      { label: 'Settings', path: '/settings' },
    ],
  },
  manager: {
    eyebrow: 'Operations command center',
    title: 'Keep assigned properties running smoothly.',
    description: 'Stay ahead of occupancy, tenants, leases, payments, and maintenance across the properties assigned to you.',
    primaryAction: { label: 'Open assigned properties', path: '/properties' },
    actions: [
      { label: 'Review tenants', path: '/tenants', detail: 'Handle tenant needs' },
      { label: 'Review leases', path: '/leases', detail: 'Keep leases current' },
      { label: 'Resolve maintenance', path: '/maintenance', detail: 'Coordinate open work' },
    ],
    access: 'You operate the properties assigned to you and coordinate tenants, leases, and maintenance.',
    nav: [
      { label: 'Assigned properties', path: '/properties' },
      { label: 'Tenants', path: '/tenants' },
      { label: 'Leases', path: '/leases' },
      { label: 'Maintenance', path: '/maintenance' },
      { label: 'Payments', path: '/payments' },
      { label: 'Discussion', path: '/discussion' },
      { label: 'Notifications', path: '/notifications' },
      { label: 'Reports', path: '/reports' },
      { label: 'Settings', path: '/settings' },
    ],
  },
  tenant: {
    eyebrow: 'Resident workspace',
    title: 'Stay on top of your home.',
    description: 'View your lease, follow payments, and send maintenance requests to your property team.',
    primaryAction: { label: 'View my lease', path: '/leases' },
    actions: [
      { label: 'View my lease', path: '/leases', detail: 'Review rent and dates' },
      { label: 'View payments', path: '/payments', detail: 'See payment history' },
      { label: 'Request maintenance', path: '/maintenance', detail: 'Report a new issue' },
    ],
    access: 'You can view your own lease, payments, and maintenance requests.',
    nav: [
      { label: 'My lease', path: '/leases' },
      { label: 'Maintenance', path: '/maintenance' },
      { label: 'Payments', path: '/payments' },
      { label: 'Discussion', path: '/discussion' },
      { label: 'Notifications', path: '/notifications' },
      { label: 'Profile', path: '/profile' },
    ],
  },
};

const statLabels = {
  total_properties: 'Properties',
  assigned_properties: 'Assigned properties',
  total_units: 'Units',
  occupied_units: 'Occupied units',
  vacant_units: 'Vacant units',
  active_leases: 'Active leases',
  total_tenants: 'Tenants',
  total_users: 'Users',
  total_rent_collected: 'Rent collected',
  total_paid: 'Total paid',
  total_expenses: 'Expenses',
  net_income: 'Net income',
  total_payments: 'Payments',
  outstanding_rent: 'Outstanding rent',
  maintenance_requests: 'Maintenance requests',
  pending_maintenance: 'Pending maintenance',
  active_lease: 'Active lease',
};

const currencyStats = new Set([
  'total_rent_collected',
  'total_paid',
  'total_expenses',
  'net_income',
  'total_payments',
  'outstanding_rent',
]);

function formatStat(key, value) {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (currencyStats.has(key)) {
    return `ETB ${Number(value || 0).toLocaleString()}`;
  }

  return typeof value === 'number' ? value.toLocaleString() : value;
}

function formatDate(value) {
  if (!value) return 'No date';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DashboardPage() {
  const {
    user,
    loading,
    isAuthenticated,
    logout,
  } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    let active = true;

    const loadDashboard = async () => {
      setDataLoading(true);
      setDashboardError('');
      try {
        const response = await apiClient.getDashboard();
        if (active && response.success) {
          setDashboardData(response.data);
        } else if (active) {
          setDashboardError(response.message || 'Dashboard data is unavailable right now.');
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        if (active) setDashboardError('Dashboard data is unavailable right now.');
      } finally {
        if (active) {
          setDataLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-[#f6f8fb] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-teal-600 mx-auto" />
          <p className="mt-4 text-sm text-slate-500">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const role = roleLabels[user.role] || 'Workspace member';
  const dashboard = roleDashboard[user.role] || roleDashboard.tenant;
  const statistics = Object.entries(dashboardData?.statistics || {});
  const navigation = [
    { label: 'Dashboard', path: '/dashboard', active: true },
    ...dashboard.nav,
  ];

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-24 items-center border-b border-slate-100 px-7">
          <Logo size="md" />
        </div>
        <div className="flex-1 px-4 py-7">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{user.role === 'tenant' ? 'My Account' : 'Workspace'}</p>
          <nav className="mt-4 space-y-1">
            {navigation.map((item) => (
              <button
                key={item.label}
                onClick={() => router.push(item.path)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${item.active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <span>{item.label}</span>
                {item.active && <span className="h-1.5 w-1.5 rounded-full bg-teal-300" />}
              </button>
            ))}
          </nav>
        </div>
        <div className="border-t border-slate-100 p-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-500">Signed in as</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="mt-1 text-xs text-teal-700">{role}</p>
          </div>
          <button onClick={handleLogout} className="mt-3 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-700">Sign out</button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="border-b border-slate-200 bg-white">
          <div className="flex min-h-24 items-center justify-between px-5 py-5 sm:px-8">
            <div>
              <p className="text-sm font-medium text-teal-700">{dashboard.eyebrow}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Good to see you, {user.name.split(' ')[0]}.</h1>
            </div>
            <div className="flex w-full max-w-xl items-center justify-end gap-3 lg:w-auto">
              <GlobalSearch />
              <NotificationPopover />
              <button onClick={handleLogout} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900 lg:hidden">Sign out</button>
            </div>
          </div>
          <nav className="flex gap-5 overflow-x-auto border-t border-slate-100 px-5 py-3 lg:hidden sm:px-8">
            {navigation.map((item) => (
              <button key={item.label} onClick={() => router.push(item.path)} className={`whitespace-nowrap text-sm font-medium ${item.active ? 'text-teal-700' : 'text-slate-500'}`}>{item.label}</button>
            ))}
          </nav>
        </header>

        <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10">
          <section className="mb-8 flex flex-col justify-between gap-5 rounded-2xl bg-slate-900 px-6 py-7 text-white shadow-sm sm:flex-row sm:items-end sm:px-8">
            <div>
              <p className="text-sm font-medium text-teal-300">{dashboard.eyebrow}</p>
              <h2 className="mt-2 max-w-xl text-2xl font-semibold tracking-tight">{dashboard.title}</h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">{dashboard.description}</p>
            </div>
            <button onClick={() => router.push(dashboard.primaryAction.path)} className="w-fit rounded-lg bg-teal-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-teal-300">{dashboard.primaryAction.label}</button>
          </section>

          {dashboardError && (
            <section className="mb-8 rounded-xl border border-red-200 bg-red-50 p-5" role="alert">
              <p className="text-sm font-semibold text-red-800">{dashboardError}</p>
              <button onClick={() => window.location.reload()} className="mt-3 rounded-lg bg-red-700 px-3 py-2 text-xs font-semibold text-white hover:bg-red-800">Try again</button>
            </section>
          )}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statistics.map(([key, value], index) => (
              <div key={key} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-slate-500">{statLabels[key] || key.replace(/_/g, ' ')}</p>
                  <span className={`h-2 w-2 rounded-full ${index % 2 ? 'bg-teal-400' : 'bg-slate-900'}`} />
                </div>
                <p className="mt-5 truncate text-2xl font-semibold tracking-tight text-slate-950">{formatStat(key, value)}</p>
              </div>
            ))}
          </section>

          {user.role !== 'tenant' && (
            <section className="dashboard-surface mt-8 rounded-2xl border border-slate-200 p-6 shadow-sm sm:p-7">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">{user.role === 'manager' ? 'Assigned portfolio' : 'Property portfolio'}</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">{user.role === 'administrator' ? 'Platform properties' : user.role === 'manager' ? 'Properties to operate' : 'Your properties'}</h2>
                  <p className="mt-1 text-sm text-slate-500">{user.role === 'manager' ? 'Review the homes and buildings currently assigned to your team.' : 'Keep property details, occupancy, and day-to-day work organized.'}</p>
                </div>
                <button onClick={() => router.push('/properties')} className="w-fit text-sm font-semibold text-teal-700 hover:text-teal-900">View all properties</button>
              </div>
              {dashboardData?.recent_properties?.length ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {dashboardData.recent_properties.slice(0, 6).map((property) => (
                    <button key={property.id} onClick={() => router.push(`/properties/${property.id}`)} className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition hover:-translate-y-0.5 hover:border-teal-400 hover:shadow-md">
                      <div className="property-card-banner flex h-24 items-end justify-between p-4">
                        <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-700">{property.status || 'active'}</span>
                        <span className="text-xs font-semibold text-white/90">{property.property_type || 'Property'}</span>
                      </div>
                      <div className="p-4">
                        <h3 className="truncate text-sm font-semibold text-slate-950 group-hover:text-teal-700">{property.name}</h3>
                        <p className="mt-1 truncate text-xs text-slate-500">{[property.city, property.state].filter(Boolean).join(', ') || property.address || 'Location not added'}</p>
                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500"><span>{property.year_built ? `Built ${property.year_built}` : 'Property overview'}</span><span className="font-semibold text-teal-700">Open &rarr;</span></div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white/70 p-8 text-center"><p className="text-sm font-semibold text-slate-700">No properties to display yet.</p><p className="mt-1 text-sm text-slate-500">Use the properties workspace to add or assign your first property.</p><button onClick={() => router.push('/properties')} className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Open properties</button></div>
              )}
            </section>
          )}

          <section className="mt-8 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">{role} actions</p><h2 className="mt-1 text-lg font-semibold text-slate-950">Move work forward</h2></div>
                <span className="hidden text-xs text-slate-400 sm:block">{role}</span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {dashboard.actions.map((action) => (
                  <button key={action.label} onClick={() => router.push(action.path)} className="group rounded-lg border border-slate-200 p-4 text-left hover:border-teal-400 hover:bg-teal-50/40">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-sm font-bold text-slate-700 group-hover:bg-teal-100 group-hover:text-teal-800">+</span>
                    <p className="mt-4 text-sm font-semibold text-slate-900">{action.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{action.detail}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Your access</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">{role} dashboard</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">{dashboard.access}</p>
              <div className="mt-5 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">Role access is controlled by the administrator.</div>
            </div>
          </section>

          {user.role === 'tenant' && (
            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">My home</p><h2 className="mt-1 text-lg font-semibold text-slate-950">Active lease</h2></div><button onClick={() => router.push('/leases')} className="text-sm font-semibold text-teal-700 hover:text-teal-900">View details</button></div>
              {dashboardData?.lease ? <div className="mt-5 grid gap-4 sm:grid-cols-4"><div><p className="text-xs text-slate-400">Property</p><p className="mt-1 text-sm font-semibold">{dashboardData.lease.unit?.property?.name || 'Not assigned'}</p></div><div><p className="text-xs text-slate-400">Unit</p><p className="mt-1 text-sm font-semibold">{dashboardData.lease.unit?.unit_number || 'Not assigned'}</p></div><div><p className="text-xs text-slate-400">Monthly rent</p><p className="mt-1 text-sm font-semibold">ETB {Number(dashboardData.lease.monthly_rent || 0).toLocaleString()}</p></div><div><p className="text-xs text-slate-400">Ends</p><p className="mt-1 text-sm font-semibold">{formatDate(dashboardData.lease.end_date)}</p></div></div> : <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No active lease is linked to this account yet.</p>}
            </section>
          )}

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <ActivityList title="Recent payments" items={dashboardData?.recent_payments} empty="No payments to show yet." renderItem={(item) => <><div><p className="text-sm font-semibold text-slate-900">ETB {Number(item.amount || 0).toLocaleString()}</p><p className="mt-1 text-xs text-slate-500">{formatDate(item.payment_date)}</p></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-700">{item.status || 'pending'}</span></>} />
            <ActivityList title="Maintenance activity" items={dashboardData?.recent_maintenance || dashboardData?.maintenance_requests} empty="No maintenance activity to show." renderItem={(item) => <><div><p className="text-sm font-semibold text-slate-900">{item.title || 'Maintenance request'}</p><p className="mt-1 text-xs text-slate-500">{formatDate(item.requested_date || item.created_at)}</p></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold capitalize text-amber-700">{(item.status || 'pending').replace('_', ' ')}</span></>} />
          </section>
        </main>
      </div>
    </div>
  );
}

function ActivityList({ title, items = [], empty, renderItem }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-950">{title}</h2><span className="text-xs font-medium text-slate-400">Latest</span></div>
      {items.length ? <div className="mt-4 divide-y divide-slate-100">{items.slice(0, 5).map((item) => <div key={item.id} className="flex items-center justify-between gap-4 py-3">{renderItem(item)}</div>)}</div> : <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">{empty}</p>}
    </div>
  );
}
