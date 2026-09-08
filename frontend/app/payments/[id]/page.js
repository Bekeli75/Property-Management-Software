'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import AppShell from '@/components/AppShell';
import AuthGuard from '@/components/AuthGuard';
import Badge from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ArrowLeft, Banknote, Building2, DoorOpen, CalendarClock, Hash, CheckCircle2, FileText, ReceiptText } from 'lucide-react';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return '—';
  return `ETB ${Number(value).toLocaleString()}`;
}

export default function PaymentDetailPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [payment, setPayment] = useState(null);
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
        const response = await apiClient.getPayment(params.id);
        if (active && response.success) setPayment(response.data);
        else if (active) setError(response.message || 'Unable to load this payment.');
      } catch (err) {
        console.error('Failed to fetch payment:', err);
        if (active) setError('Unable to load this payment.');
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

  if (error || !payment) {
    return (
      <AppShell>
        <main className="mx-auto max-w-[1500px] px-5 py-10">
          <div className="card p-8 text-center">
            <p className="text-sm font-semibold text-red-700">{error || 'Payment not found.'}</p>
            <button type="button" onClick={() => router.push('/payments')} className="btn btn-secondary mt-5">Back to payments</button>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AuthGuard>
      <AppShell>
      <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10">
        <button type="button" onClick={() => router.push('/payments')} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-teal-700">
          <ArrowLeft size={16} />
          Back to payments
        </button>

        {/* Hero */}
        <section className="dashboard-hero rounded-2xl p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium text-teal-300">
                <ReceiptText size={15} />
                Payment {payment.reference_number ? `· ${payment.reference_number}` : ''}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">{formatMoney(payment.amount)}</h1>
              <p className="mt-2 text-sm text-slate-300">
                {payment.tenant?.user?.name || 'Tenant'} · {payment.lease?.unit?.unit_number} · {payment.lease?.unit?.property?.name}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge status={payment.status} className="bg-white/90 text-slate-800" />
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="card p-6 sm:p-7">
              <p className="page-eyebrow">Payment details</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Summary</h2>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <Info icon={Banknote} label="Amount" value={formatMoney(payment.amount)} />
                <Info icon={CheckCircle2} label="Status" value={String(payment.status || '—')} />
                <Info icon={CalendarClock} label="Paid on" value={formatDate(payment.payment_date)} />
                <Info icon={CalendarClock} label="Due on" value={formatDate(payment.due_date)} />
                <Info icon={Hash} label="Reference" value={payment.reference_number || '—'} />
                <Info icon={FileText} label="Method" value={String(payment.payment_method || '—').replace('_', ' ')} />
              </dl>
              {payment.is_test_payment && (
                <p className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  Test payment — no real funds moved
                </p>
              )}
            </section>

            {payment.description && (
              <section className="card p-6 sm:p-7">
                <p className="page-eyebrow">Notes</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">Description</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{payment.description}</p>
              </section>
            )}

            {payment.notes && (
              <section className="card p-6 sm:p-7">
                <p className="page-eyebrow">Notes</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">Staff notes</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{payment.notes}</p>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <section className="card p-6">
              <p className="page-eyebrow">Payer</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Tenant</h2>
              <dl className="mt-4 space-y-3">
                <Row label="Name" value={payment.tenant?.user?.name || '—'} />
                <Row label="Email" value={payment.tenant?.user?.email || '—'} />
              </dl>
            </section>

            <section className="card p-6">
              <p className="page-eyebrow">Place</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Lease context</h2>
              <dl className="mt-4 space-y-3">
                <Row icon={Building2} label="Property" value={payment.lease?.unit?.property?.name || '—'} />
                <Row icon={DoorOpen} label="Unit" value={payment.lease?.unit?.unit_number || '—'} />
              </dl>
              {payment.lease && (
                <button type="button" onClick={() => router.push(`/leases/${payment.lease.id}`)} className="btn btn-secondary mt-5 w-full py-2.5 text-xs">
                  View lease
                </button>
              )}
            </section>
          </div>
        </div>
      </main>
    </AppShell>
    </AuthGuard>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
      <dt className="flex items-center gap-1.5 text-xs text-slate-400">
        {Icon && <Icon size={13} />}
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold capitalize text-slate-900">{value}</dd>
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-1.5 text-sm text-slate-500">
        {Icon && <Icon size={13} className="text-slate-400" />}
        {label}
      </dt>
      <dd className="truncate text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}