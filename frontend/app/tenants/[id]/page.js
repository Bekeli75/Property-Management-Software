'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import AppShell from '@/components/AppShell';
import AuthGuard from '@/components/AuthGuard';
import Badge from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  CalendarClock,
  Banknote,
  Wrench,
  ChevronRight,
} from 'lucide-react';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return '—';
  return `ETB ${Number(value).toLocaleString()}`;
}

export default function TenantDetailPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let active = true;

    const load = async () => {
      try {
        const response = await apiClient.getTenant(params.id);
        if (active && response.success) setTenant(response.data);
        else if (active) setError(response.message || 'Unable to load this tenant.');
      } catch (err) {
        console.error('Failed to fetch tenant:', err);
        if (active) setError('Unable to load this tenant.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [isAuthenticated, params.id]);

  if (authLoading || loading) {
    return (
      <AppShell>
        <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10">
          <SkeletonCard className="h-72" />
        </main>
      </AppShell>
    );
  }

  if (error || !tenant) {
    return (
      <AppShell>
        <main className="mx-auto max-w-[1500px] px-5 py-10">
          <div className="card p-8 text-center">
            <p className="text-sm font-semibold text-red-700">{error || 'Tenant not found.'}</p>
            <button type="button" onClick={() => router.push('/tenants')} className="btn btn-secondary mt-5">Back to tenants</button>
          </div>
        </main>
      </AppShell>
    );
  }

  const activeLease = tenant.leases?.find((l) => l.status === 'active');
  const leases = tenant.leases || [];
  const payments = tenant.payments || [];
  const maintenance = tenant.maintenanceRequests || [];

  return (
    <AuthGuard roles={['administrator', 'owner', 'manager']}>
      <AppShell>
      <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10">
        <button type="button" onClick={() => router.push('/tenants')} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-teal-700">
          <ArrowLeft size={16} />
          Back to tenants
        </button>

        {/* Hero */}
        <section className="dashboard-hero rounded-2xl p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium text-teal-300">
                <User size={15} />
                Tenant profile
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{tenant.user?.name || 'Tenant'}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-300">
                {tenant.user?.email && (
                  <span className="flex items-center gap-1.5"><Mail size={14} /> {tenant.user.email}</span>
                )}
                {tenant.user?.phone && (
                  <span className="flex items-center gap-1.5"><Phone size={14} /> {tenant.user.phone}</span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge status={tenant.status || 'active'} />
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Active lease */}
            <section className="card p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="page-eyebrow">Current tenancy</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-950">Active lease</h2>
                </div>
                {activeLease && (
                  <button type="button" onClick={() => router.push(`/leases/${activeLease.id}`)} className="btn btn-secondary py-2 text-xs">
                    Open lease
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>

              {activeLease ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                    <p className="text-xs text-slate-400">Unit</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {activeLease.unit?.unit_number} · {activeLease.unit?.property?.name}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                    <p className="text-xs text-slate-400">Monthly rent</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{formatMoney(activeLease.monthly_rent)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                    <p className="text-xs text-slate-400">Term</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatDate(activeLease.start_date)} → {formatDate(activeLease.end_date)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50/40 p-6 text-center">
                  <p className="text-sm font-semibold text-slate-700">No active lease</p>
                  <p className="mt-1 text-xs text-slate-500">This tenant has no active lease right now.</p>
                </div>
              )}
            </section>

            {/* Payment history */}
            <section className="card p-6 sm:p-7">
              <p className="page-eyebrow">Finance</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Payment history</h2>
              {payments.length ? (
                <ul className="mt-5 space-y-3">
                  {payments.map((payment) => (
                    <li key={payment.id} className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Banknote size={16} className="shrink-0 text-slate-400" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{formatMoney(payment.amount)}</p>
                          <p className="text-xs text-slate-500">{formatDate(payment.payment_date)}</p>
                        </div>
                      </div>
                      <Badge status={payment.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 text-sm text-slate-500">No payments recorded yet.</p>
              )}
            </section>

            {/* Maintenance history */}
            <section className="card p-6 sm:p-7">
              <p className="page-eyebrow">Operations</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Maintenance requests</h2>
              {maintenance.length ? (
                <ul className="mt-5 space-y-3">
                  {maintenance.map((request) => (
                    <button key={request.id} type="button" onClick={() => router.push(`/maintenance/${request.id}`)} className="flex w-full items-center justify-between gap-4 rounded-lg border border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50">
                      <div className="flex min-w-0 items-center gap-3">
                        <Wrench size={16} className="shrink-0 text-slate-400" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{request.title}</p>
                          <p className="truncate text-xs text-slate-500">{request.unit?.unit_number} · {formatDate(request.requested_date)}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge status={request.priority} />
                        <Badge status={request.status} />
                      </div>
                    </button>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 text-sm text-slate-500">No maintenance requests recorded yet.</p>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <section className="card p-6">
              <p className="page-eyebrow">Identity</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Details</h2>
              <dl className="mt-4 space-y-3">
                <Row label="ID number" value={tenant.id_number || '—'} />
                <Row label="ID type" value={String(tenant.id_type || '—').replace('_', ' ')} />
                <Row label="Date of birth" value={formatDate(tenant.date_of_birth)} />
                <Row label="Status" value={String(tenant.status || 'active')} />
              </dl>
            </section>

            <section className="card p-6">
              <p className="page-eyebrow">Contact</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Emergency contact</h2>
              <dl className="mt-4 space-y-3">
                <Row label="Name" value={tenant.emergency_contact_name || '—'} />
                <Row label="Phone" value={tenant.emergency_contact_phone || '—'} />
              </dl>
            </section>

            <section className="card p-6">
              <p className="page-eyebrow">Employment</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Screening</h2>
              <dl className="mt-4 space-y-3">
                <Row label="Status" value={String(tenant.employment_status || '—').replace('_', ' ')} />
                <Row label="Employer" value={tenant.employer_name || '—'} />
                <Row label="Monthly income" value={formatMoney(tenant.monthly_income)} />
              </dl>
            </section>

            {leases.length > 0 && (
              <section className="card p-6">
                <p className="page-eyebrow">History</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">All leases</h2>
                <ul className="mt-4 space-y-2.5">
                  {leases.map((lease) => (
                    <li key={lease.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <CalendarClock size={12} className="text-slate-400" />
                        <span>{lease.unit?.unit_number} · {formatDate(lease.start_date)}</span>
                      </div>
                      <Badge status={lease.status} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {tenant.notes && (
              <section className="card p-6">
                <p className="page-eyebrow">Notes</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">Staff notes</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{tenant.notes}</p>
              </section>
            )}
          </div>
        </div>
      </main>
    </AppShell>
    </AuthGuard>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="truncate text-sm font-semibold capitalize text-slate-900">{value}</dd>
    </div>
  );
}