'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import AppShell from '@/components/AppShell';
import AuthGuard from '@/components/AuthGuard';
import StatCard from '@/components/ui/StatCard';
import RevenueChart from '@/components/charts/RevenueChart';
import { SkeletonStat } from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';
import ErrorState from '@/components/ui/ErrorState';
import {
  Building2,
  LayoutGrid,
  Users,
  FileText,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Wrench,
  Home,
  Banknote,
  ClipboardList,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';

const roleMeta = {
  administrator: {
    role: 'Administrator',
    eyebrow: 'Platform command center',
    title: 'Keep the entire operation under control.',
    description: 'Review platform health, users, properties, payments, and unresolved work from one administrative view.',
    primaryAction: { label: 'Review all properties', path: '/properties' },
  },
  owner: {
    role: 'Property owner',
    eyebrow: 'Portfolio command center',
    title: 'See how your properties are performing.',
    description: 'Track occupancy, income, expenses, leases, and the maintenance work affecting your investment.',
    primaryAction: { label: 'Manage my properties', path: '/properties' },
  },
  manager: {
    role: 'Property manager',
    eyebrow: 'Operations command center',
    title: 'Keep assigned properties running smoothly.',
    description: 'Stay ahead of occupancy, tenants, leases, payments, and maintenance across the properties assigned to you.',
    primaryAction: { label: 'Open assigned properties', path: '/properties' },
  },
  tenant: {
    role: 'Tenant',
    eyebrow: 'Resident workspace',
    title: 'Stay on top of your home.',
    description: 'View your lease, follow payments, and send maintenance requests to your property team.',
    primaryAction: { label: 'View my lease', path: '/leases' },
  },
};

const statConfig = {
  total_properties: { icon: Building2, label: 'Total properties' },
  assigned_properties: { icon: Building2, label: 'Assigned properties' },
  total_units: { icon: LayoutGrid, label: 'Total units' },
  occupied_units: { icon: Home, label: 'Occupied units' },
  vacant_units: { icon: LayoutGrid, label: 'Vacant units' },
  active_leases: { icon: FileText, label: 'Active leases' },
  total_tenants: { icon: Users, label: 'Tenants' },
  total_users: { icon: UserCheck, label: 'Users' },
  total_rent_collected: { icon: Banknote, label: 'Rent collected' },
  total_paid: { icon: Banknote, label: 'Total paid' },
  total_expenses: { icon: TrendingDown, label: 'Expenses' },
  net_income: { icon: TrendingUp, label: 'Net income' },
  total_payments: { icon: CreditCard, label: 'Payments' },
  outstanding_rent: { icon: AlertTriangle, label: 'Outstanding rent', tone: 'gold' },
  maintenance_requests: { icon: Wrench, label: 'Maintenance requests' },
  pending_maintenance: { icon: ClipboardList, label: 'Pending maintenance', tone: 'amber' },
  active_lease: { icon: FileText, label: 'Active lease' },
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
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (currencyStats.has(key)) return `ETB ${Number(value || 0).toLocaleString()}`;
  return typeof value === 'number' ? value.toLocaleString() : value;
}

function formatDate(value) {
  if (!value) return 'No date';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DashboardPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let active = true;

    const load = async () => {
      setDataLoading(true);
      setDashboardError('');
      try {
        const response = await apiClient.getDashboard();
        if (active && response.success) setData(response.data);
        else if (active) setDashboardError(response.message || 'Dashboard data is unavailable right now.');
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        if (active) setDashboardError('Dashboard data is unavailable right now.');
      } finally {
        if (active) setDataLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return undefined;
    if (!isAuthenticated) router.replace('/login');
    return undefined;
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !user) {
    return (
      <AppShell>
        <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)}
          </div>
        </main>
      </AppShell>
    );
  }

  const meta = roleMeta[user?.role] || roleMeta.tenant;
  const statistics = Object.entries(data?.statistics || {});
  const isStaff = user?.role && user.role !== 'tenant';

  return (
    <AuthGuard>
      <AppShell>
      <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10">
        {/* Hero */}
        <section className="dashboard-hero mb-8 flex flex-col justify-between gap-5 rounded-2xl px-6 py-7 text-white shadow-lg sm:flex-row sm:items-end sm:px-8">
          <div className="relative">
            <p className="text-sm font-medium text-teal-300">{meta.eyebrow}</p>
            <h2 className="mt-2 max-w-xl text-2xl font-semibold tracking-tight">Good to see you, {(user?.name || 'there').split(' ')[0]}.</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">{meta.description}</p>
          </div>
          <button
            type="button"
            onClick={() => router.push(meta.primaryAction.path)}
            className="relative w-fit rounded-lg bg-teal-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-teal-300"
          >
            {meta.primaryAction.label}
          </button>
        </section>

        {dashboardError ? (
          <ErrorState message={dashboardError} onRetry={() => window.location.reload()} className="mb-8" />
        ) : (
          <>
            {/* Stat cards */}
            {dataLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)}
              </div>
            ) : (
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {statistics.map(([key, value]) => {
                  const cfg = statConfig[key] || { icon: LayoutGrid, label: key.replace(/_/g, ' ') };
                  return (
                    <StatCard
                      key={key}
                      icon={cfg.icon}
                      label={cfg.label}
                      tone={cfg.tone || 'default'}
                      value={formatStat(key, value)}
                    />
                  );
                })}
              </section>
            )}

            {/* Revenue chart for staff */}
            {isStaff && (
              <section className="card mt-8 p-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                  <div>
                    <p className="page-eyebrow">Collection trend</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-950">Rent collected, last 6 months</h2>
                  </div>
                </div>
                <div className="mt-5">
                  {dataLoading ? (
                    <div className="skeleton h-56 w-full" />
                  ) : (
                    <RevenueChart data={data?.chart_data || []} />
                  )}
                </div>
              </section>
            )}

            {/* Property portfolio (staff) */}
            {isStaff && (
              <section className="dashboard-surface mt-8 rounded-2xl p-6 shadow-sm sm:p-7">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                  <div>
                    <p className="page-eyebrow">{user.role === 'manager' ? 'Assigned portfolio' : 'Property portfolio'}</p>
                    <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                      {user.role === 'administrator' ? 'Platform properties' : user.role === 'manager' ? 'Properties to operate' : 'Your properties'}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {user.role === 'manager'
                        ? 'Review the homes and buildings currently assigned to your team.'
                        : 'Keep property details, occupancy, and day-to-day work organized.'}
                    </p>
                  </div>
                  <button type="button" onClick={() => router.push('/properties')} className="w-fit text-sm font-semibold text-teal-700 hover:text-teal-900">
                    View all properties
                  </button>
                </div>

                {dataLoading ? (
                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-40 w-full" />)}
                  </div>
                ) : data?.recent_properties?.length ? (
                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {data.recent_properties.slice(0, 6).map((property) => (
                      <button
                        key={property.id}
                        type="button"
                        onClick={() => router.push(`/properties/${property.id}`)}
                        className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition hover:-translate-y-0.5 hover:border-teal-400 hover:shadow-md"
                      >
                        <div className="property-card-banner flex h-24 items-end justify-between p-4">
                          <Badge status={property.status || 'active'} className="bg-white/90 text-slate-700" />
                          <span className="text-xs font-semibold text-white/90">{property.property_type || 'Property'}</span>
                        </div>
                        <div className="p-4">
                          <h3 className="truncate text-sm font-semibold text-slate-950 group-hover:text-teal-700">{property.name}</h3>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {[property.city, property.state].filter(Boolean).join(', ') || property.address || 'Location not added'}
                          </p>
                          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                            <span>{property.year_built ? `Built ${property.year_built}` : 'Property overview'}</span>
                            <span className="font-semibold text-teal-700">Open &rarr;</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
                    <p className="text-sm font-semibold text-slate-700">No properties to display yet.</p>
                    <p className="mt-1 text-sm text-slate-500">Use the properties workspace to add or assign your first property.</p>
                    <button type="button" onClick={() => router.push('/properties')} className="btn btn-primary mt-4">
                      Open properties
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Move work forward + access */}
            {!dataLoading && data && (
              <section className="mt-8 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                <div className="card p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="page-eyebrow">{meta.role} actions</p>
                      <h2 className="mt-1 text-lg font-semibold text-slate-950">Move work forward</h2>
                    </div>
                    <span className="hidden text-xs text-slate-400 sm:block">{meta.role}</span>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {roleActions[user.role].map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() => router.push(action.path)}
                        className="group rounded-lg border border-slate-200 p-4 text-left transition hover:border-teal-400 hover:bg-teal-50/40"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-sm font-bold text-slate-700 transition group-hover:bg-teal-100 group-hover:text-teal-800">
                          <action.icon size={16} />
                        </span>
                        <p className="mt-4 text-sm font-semibold text-slate-900">{action.label}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{action.detail}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="card p-6">
                  <p className="page-eyebrow">Your access</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-950">{meta.role} dashboard</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{roleAccess[user.role]}</p>
                  <div className="mt-5 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
                    Role access is controlled by the administrator.
                  </div>
                </div>
              </section>
            )}

            {/* Tenant active lease */}
            {user.role === 'tenant' && !dataLoading && data && (
              <section className="card mt-6 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="page-eyebrow">My home</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-950">Active lease</h2>
                  </div>
                  <button type="button" onClick={() => router.push('/leases')} className="text-sm font-semibold text-teal-700 hover:text-teal-900">
                    View details
                  </button>
                </div>
                {data.lease ? (
                  <dl className="mt-5 grid gap-4 sm:grid-cols-4">
                    <div>
                      <dt className="text-xs text-slate-400">Property</dt>
                      <dd className="mt-1 text-sm font-semibold">{data.lease.unit?.property?.name || 'Not assigned'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-400">Unit</dt>
                      <dd className="mt-1 text-sm font-semibold">{data.lease.unit?.unit_number || 'Not assigned'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-400">Monthly rent</dt>
                      <dd className="mt-1 text-sm font-semibold">ETB {Number(data.lease.monthly_rent || 0).toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-400">Ends</dt>
                      <dd className="mt-1 text-sm font-semibold">{formatDate(data.lease.end_date)}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No active lease is linked to this account yet.</p>
                )}
              </section>
            )}

            {/* Recent activity */}
            {!dataLoading && data && (
              <section className="mt-6 grid gap-6 lg:grid-cols-2">
                <ActivityList
                  title="Recent payments"
                  items={data.recent_payments}
                  empty="No payments to show yet."
                  renderItem={(item) => (
                    <>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">ETB {Number(item.amount || 0).toLocaleString()}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(item.payment_date)}</p>
                      </div>
                      <Badge status={item.status || 'pending'} />
                    </>
                  )}
                />
                <ActivityList
                  title="Maintenance activity"
                  items={data.recent_maintenance || data.maintenance_requests}
                  empty="No maintenance activity to show."
                  renderItem={(item) => (
                    <>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.title || 'Maintenance request'}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(item.requested_date || item.created_at)}</p>
                      </div>
                      <Badge status={item.status || 'pending'} />
                    </>
                  )}
                />
              </section>
            )}
          </>
        )}
      </main>
    </AppShell>
    </AuthGuard>
  );
}

const roleActions = {
  administrator: [
    { label: 'Manage users', path: '/admin/users', detail: 'Manage people and access', icon: UserCheck },
    { label: 'Review properties', path: '/properties', detail: 'Oversee the portfolio', icon: Building2 },
    { label: 'Resolve maintenance', path: '/maintenance', detail: 'Monitor every request', icon: Wrench },
  ],
  owner: [
    { label: 'Add a property', path: '/properties', detail: 'Grow your portfolio', icon: Building2 },
    { label: 'Review income', path: '/payments', detail: 'Track collected rent', icon: Banknote },
    { label: 'Review expenses', path: '/maintenance', detail: 'Protect property value', icon: Wrench },
  ],
  manager: [
    { label: 'Review tenants', path: '/tenants', detail: 'Handle tenant needs', icon: Users },
    { label: 'Review leases', path: '/leases', detail: 'Keep leases current', icon: FileText },
    { label: 'Resolve maintenance', path: '/maintenance', detail: 'Coordinate open work', icon: Wrench },
  ],
  tenant: [
    { label: 'View my lease', path: '/leases', detail: 'Review rent and dates', icon: FileText },
    { label: 'View payments', path: '/payments', detail: 'See payment history', icon: CreditCard },
    { label: 'Request maintenance', path: '/maintenance', detail: 'Report a new issue', icon: Wrench },
  ],
};

const roleAccess = {
  administrator: 'You have platform-wide visibility across properties, users, leases, payments, and maintenance.',
  owner: 'You control your properties, units, leases, financial activity, and portfolio maintenance.',
  manager: 'You operate the properties assigned to you and coordinate tenants, leases, and maintenance.',
  tenant: 'You can view your own lease, payments, and maintenance requests.',
};

function ActivityList({ title, items = [], empty, renderItem }) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <span className="text-xs font-medium text-slate-400">Latest</span>
      </div>
      {items.length ? (
        <div className="mt-4 divide-y divide-slate-100">
          {items.slice(0, 5).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 py-3">
              {renderItem(item)}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">{empty}</p>
      )}
    </div>
  );
}