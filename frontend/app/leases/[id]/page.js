'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import apiClient from '@/lib/api';
import AppShell from '@/components/AppShell';
import AuthGuard from '@/components/AuthGuard';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import FormField from '@/components/ui/FormField';
import ConfirmDialog from '@/components/ConfirmDialog';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ArrowLeft, FileText, Paperclip, CreditCard, CalendarRange, Banknote, User, Building2, XCircle } from 'lucide-react';

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '—';
  return `ETB ${Number(value).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function LeaseDetailPage() {
  const { isAuthenticated, loading: authLoading, isTenant, user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const params = useParams();
  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminationForm, setTerminationForm] = useState({ termination_reason: '', termination_effective_date: '' });
  const [terminating, setTerminating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);

  const isStaff = !isTenant;
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let active = true;

    const load = async () => {
      try {
        const response = await apiClient.getLease(params.id);
        if (!active) return;
        if (!response.success) {
          setError(response.message || 'Unable to load this lease.');
        } else if (isTenant && response.data?.tenant_id !== user?.tenant?.id) {
          setError('Unable to load this lease.');
        } else {
          setLease(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch lease:', err);
        if (active) setError('Unable to load this lease.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [isAuthenticated, isTenant, user?.tenant?.id, params.id]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  const reloadLease = async () => {
    const response = await apiClient.getLease(params.id);
    if (response.success) setLease(response.data);
  };

  const handleTerminateSubmit = async (e) => {
    e.preventDefault();
    setTerminating(true);
    try {
      const response = await apiClient.terminateLease(lease.id, terminationForm);
      if (response.success) {
        toast.success('Termination request submitted.');
        setShowTerminateModal(false);
        setTerminationForm({ termination_reason: '', termination_effective_date: '' });
        await reloadLease();
      } else {
        toast.error(response.message || 'Unable to submit the request.');
      }
    } catch (err) {
      console.error('Failed to terminate lease:', err);
      toast.error(err.message || 'Unable to submit the request.');
    } finally {
      setTerminating(false);
    }
  };

  const handleApproveTermination = async () => {
    setConfirmApprove(false);
    setApproving(true);
    try {
      const response = await apiClient.approveTerminationLease(lease.id);
      if (response.success) {
        toast.success('Lease terminated. The unit is now available.');
        await reloadLease();
      } else {
        toast.error(response.message || 'Unable to approve the termination.');
      }
    } catch (err) {
      console.error('Failed to approve termination:', err);
      toast.error(err.message || 'Unable to approve the termination.');
    } finally {
      setApproving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AppShell>
        <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10">
          <SkeletonCard className="h-72" />
        </main>
      </AppShell>
    );
  }

  if (error || !lease) {
    return (
      <AppShell>
        <main className="mx-auto max-w-[1500px] px-5 py-10">
          <div className="card p-8 text-center">
            <p className="text-sm font-semibold text-red-700">{error || 'Lease not found.'}</p>
            <button type="button" onClick={() => router.push('/leases')} className="btn btn-secondary mt-5">Back to leases</button>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AuthGuard>
      <AppShell>
      <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10">
        <button type="button" onClick={() => router.push('/leases')} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-teal-700">
          <ArrowLeft size={16} />
          Back to leases
        </button>

        {/* Hero */}
        <section className="dashboard-hero rounded-2xl p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium text-teal-300">
                <FileText size={15} />
                Lease agreement
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {lease.tenant?.user?.name || 'Tenant'} · {lease.unit?.unit_number || 'Unit'}
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-300">
                <span className="flex items-center gap-1.5"><Building2 size={14} /> {lease.unit?.property?.name || 'Property'}</span>
                <span className="flex items-center gap-1.5"><User size={14} /> {lease.tenant?.user?.email || 'No email'}</span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <Badge status={lease.status} className="bg-white/90 text-slate-800" />
              <div className="flex flex-wrap gap-2">
                {lease.status === 'active' && (
                  <button
                    type="button"
                    onClick={() => setShowTerminateModal(true)}
                    className="btn btn-secondary"
                  >
                    <XCircle size={14} />
                    Request termination
                  </button>
                )}
                {lease.status === 'pending_termination' && isStaff && (
                  <button type="button" onClick={() => setConfirmApprove(true)} disabled={approving} className="btn btn-primary">
                    {approving ? 'Approving...' : 'Approve termination'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Terms */}
            <section className="card p-6 sm:p-7">
              <p className="page-eyebrow">Financial terms</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Rent &amp; terms</h2>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field icon={Banknote} label="Monthly rent" value={formatCurrency(lease.monthly_rent)} />
                <Field icon={Banknote} label="Security deposit" value={formatCurrency(lease.security_deposit)} />
                <Field icon={CalendarRange} label="Start date" value={formatDate(lease.start_date)} />
                <Field icon={CalendarRange} label="End date" value={formatDate(lease.end_date)} />
                <Field label="Payment frequency" value={String(lease.payment_frequency || '').replace('_', ' ')} />
                <Field label="Payment day" value={lease.payment_day ? `Day ${lease.payment_day}` : '—'} />
              </dl>

              {lease.terms && (
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Terms</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{lease.terms}</p>
                </div>
              )}
              {lease.notes && (
                <div className="mt-4 border-t border-slate-100 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{lease.notes}</p>
                </div>
              )}
            </section>

            {/* Payments */}
            <section className="card p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="page-eyebrow">Settlements</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-950">Payment history</h2>
                </div>
                <button type="button" onClick={() => router.push('/payments')} className="text-sm font-semibold text-teal-700 hover:text-teal-900">
                  View all
                </button>
              </div>

              {lease.payments?.length ? (
                <div className="mt-5 divide-y divide-slate-50">
                  {lease.payments.slice(0, 8).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between gap-4 py-3">
                      <div>
                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <CreditCard size={14} className="text-teal-600" />
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">{formatDate(payment.payment_date)}</p>
                      </div>
                      <Badge status={payment.status || 'pending'} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No payments recorded for this lease yet.</p>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <section className="card p-6">
              <p className="page-eyebrow">Documents</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Attachments</h2>

              {lease.attachments?.length ? (
                <ul className="mt-5 space-y-2">
                  {lease.attachments.map((attachment, index) => (
                    <li key={attachment.id || index}>
                      <a
                        href={attachment.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-teal-300 hover:bg-teal-50/30"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                          <Paperclip size={16} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-slate-800">{attachment.original_name || 'Attachment'}</span>
                          {attachment.size ? (
                            <span className="text-xs text-slate-400">{Math.round(attachment.size / 1024)} KB</span>
                          ) : null}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No attachments for this lease.</p>
              )}
            </section>

            {lease.termination_reason && (
              <section className="card p-6">
                <p className="page-eyebrow">Termination</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">Request details</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-slate-400">Reason</dt>
                    <dd className="mt-1 leading-5 text-slate-700">{lease.termination_reason}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400">Effective date</dt>
                    <dd className="mt-1 font-semibold text-slate-900">{formatDate(lease.termination_effective_date)}</dd>
                  </div>
                </dl>
              </section>
            )}
          </div>
        </div>
      </main>

      {/* Request termination modal */}
      <Modal
        open={showTerminateModal}
        onClose={() => { setShowTerminateModal(false); setTerminationForm({ termination_reason: '', termination_effective_date: '' }); }}
        title="Request lease termination"
        description={lease ? `Terminating the lease for ${lease.unit?.unit_number || 'this unit'}. This sends a request for the property manager to approve.` : ''}
        footer={
          <>
            <button type="button" onClick={() => setShowTerminateModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" form="terminate-form" disabled={terminating} className="btn btn-danger">
              {terminating ? 'Submitting...' : 'Submit request'}
            </button>
          </>
        }
      >
        <form id="terminate-form" onSubmit={handleTerminateSubmit} className="space-y-5">
          <FormField label="Reason for termination" required>
            <textarea className="field-input resize-none" rows={3} required minLength={10} value={terminationForm.termination_reason} onChange={(e) => setTerminationForm({ ...terminationForm, termination_reason: e.target.value })} placeholder="Explain why this lease is ending" />
          </FormField>
          <FormField label="Effective date" required>
            <input type="date" className="field-input" required min={tomorrow} value={terminationForm.termination_effective_date} onChange={(e) => setTerminationForm({ ...terminationForm, termination_effective_date: e.target.value })} />
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmApprove}
        title="Approve lease termination?"
        message="This will mark the lease as terminated and make the unit available again. This action cannot be undone."
        onCancel={() => setConfirmApprove(false)}
        onConfirm={handleApproveTermination}
        loading={approving}
      />
    </AppShell>
    </AuthGuard>
  );
}

function Field({ icon: Icon, label, value }) {
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