'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import apiClient from '@/lib/api';
import AppShell from '@/components/AppShell';
import AuthGuard from '@/components/AuthGuard';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import FormField from '@/components/ui/FormField';
import ConfirmDialog from '@/components/ConfirmDialog';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Banknote, CreditCard, CheckCircle2, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

const emptyForm = {
  lease_id: '',
  tenant_id: '',
  amount: '',
  payment_date: new Date().toISOString().split('T')[0],
  due_date: new Date().toISOString().split('T')[0],
  payment_method: 'cash',
  description: '',
  notes: '',
};

const chapaEmpty = {
  lease_id: '',
  tenant_id: '',
  amount: '',
  email: '',
  first_name: '',
  last_name: '',
  phone_number: '',
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PaymentsPage() {
  const { isAuthenticated, isOwner, isAdmin, isTenant } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showChapaModal, setShowChapaModal] = useState(false);
  const [chapaSaving, setChapaSaving] = useState(false);
  const [leases, setLeases] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [chapaFormData, setChapaFormData] = useState(chapaEmpty);

  const canManage = isOwner || isAdmin;

  const totalCollected = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const completedPayments = payments.filter((p) => p.status === 'completed');

  const fetchPayments = useCallback(async () => {
    try {
      const response = await apiClient.getPayments();
      if (response.success) setPayments(response.data);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      toast.error('Unable to load payments.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchLeases = useCallback(async () => {
    try {
      const response = await apiClient.getLeases();
      if (response.success) setLeases(response.data.filter((l) => l.status === 'active'));
    } catch (error) {
      console.error('Failed to fetch leases:', error);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    const load = async () => {
      await fetchPayments();
      if (!isTenant) await fetchLeases();
    };
    load();
  }, [isAuthenticated, isTenant, router, fetchPayments, fetchLeases]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await apiClient.createPayment(formData);
      if (response.success) {
        toast.success('Payment recorded.');
        setShowModal(false);
        setFormData(emptyForm);
        fetchPayments();
      } else {
        toast.error(response.message || 'Unable to record payment.');
      }
    } catch (error) {
      console.error('Failed to create payment:', error);
      toast.error('Unable to record payment.');
    } finally {
      setSaving(false);
    }
  };

  const handleChapaSubmit = async (e) => {
    e.preventDefault();
    setChapaSaving(true);
    try {
      const response = await apiClient.initiateChapaPayment(chapaFormData);
      if (response.success) {
        toast.success('Redirecting to Chapa...');
        setShowChapaModal(false);
        setChapaFormData(chapaEmpty);
        if (response.data?.checkout_url) window.open(response.data.checkout_url, '_blank');
        fetchPayments();
      } else {
        toast.error(response.message || 'Unable to start Chapa payment.');
      }
    } catch (error) {
      console.error('Failed to initiate Chapa payment:', error);
      toast.error('Unable to start Chapa payment.');
    } finally {
      setChapaSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await apiClient.deletePayment(id);
      toast.success('Payment deleted.');
      fetchPayments();
    } catch (error) {
      console.error('Failed to delete payment:', error);
      toast.error('Unable to delete the payment.');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10">
          <PageHeader eyebrow="Finance" title="Payments" description="Track rent collections, bank transfers and Chapa payments." />
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AuthGuard>
      <AppShell>
      <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10">
        <PageHeader
          eyebrow="Finance"
          title={`Payments (${payments.length})`}
          description="Track rent collections, bank transfers and Chapa payments."
          actions={
            <div className="flex flex-wrap gap-2">
              {isTenant && (
                <button type="button" onClick={() => setShowChapaModal(true)} className="btn btn-primary">
                  <CreditCard size={16} />
                  Pay with Chapa
                </button>
              )}
              {canManage && (
                <button type="button" onClick={() => setShowModal(true)} className="btn btn-secondary">
                  <Banknote size={16} />
                  Record payment
                </button>
              )}
            </div>
          }
        />

        {/* Summary cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryCard icon={Banknote} label="Collected" value={`ETB ${totalCollected.toLocaleString()}`} accent="emerald" />
          <SummaryCard icon={Clock} label="Pending" value={String(pendingPayments.length)} accent="amber" />
          <SummaryCard icon={CheckCircle2} label="Completed" value={String(completedPayments.length)} accent="emerald" />
        </div>

        {payments.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={Banknote}
              title="No payments yet"
              description={isTenant ? 'Make your first rent payment via Chapa or ask your landlord to record one.' : 'Record your first payment or collect via Chapa.'}
              actionLabel={isTenant ? 'Pay with Chapa' : canManage ? 'Record payment' : undefined}
              onAction={isTenant ? () => setShowChapaModal(true) : canManage ? () => setShowModal(true) : undefined}
            />
          </div>
        ) : (
          <div className="mt-8 card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-6 py-3 font-medium">Tenant</th>
                    <th className="px-6 py-3 font-medium">Amount</th>
                    <th className="px-6 py-3 font-medium">Dates</th>
                    <th className="px-6 py-3 font-medium">Method</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Reference</th>
                    <th className="px-6 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="transition hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{payment.tenant?.user?.name || 'Tenant'}</p>
                        <p className="text-xs text-slate-500">Unit {payment.lease?.unit?.unit_number || '—'}</p>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-950">ETB {Number(payment.amount || 0).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <p className="text-slate-700">{formatDate(payment.payment_date)}</p>
                        <p className="text-xs text-slate-400">Due {formatDate(payment.due_date)}</p>
                      </td>
                      <td className="px-6 py-4 capitalize text-slate-600">{payment.payment_method?.replace('_', ' ') || '—'}</td>
                      <td className="px-6 py-4"><Badge status={payment.status} /></td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{payment.reference_number || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <button type="button" onClick={() => router.push(`/payments/${payment.id}`)} className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 transition hover:text-teal-900">
                          View
                          <ArrowRight size={12} />
                        </button>
                        {canManage && (
                          <button type="button" onClick={() => setDeleteId(payment.id)} className="ml-3 inline-flex items-center gap-1 text-xs font-semibold text-red-600 transition hover:text-red-800">
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Record Payment Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Record payment"
        description="Log a manual rent collection or bank transfer."
        size="lg"
        footer={
          <>
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" form="payment-form" disabled={saving} className="btn btn-primary">
              {saving ? 'Saving...' : 'Record payment'}
            </button>
          </>
        }
      >
        <form id="payment-form" onSubmit={handleSubmit} className="space-y-5">
          <FormField label="Active lease" required hint="Select the lease this payment relates to.">
            <select
              className="field-input"
              required
              value={formData.lease_id}
              onChange={(e) => {
                const selected = leases.find((l) => l.id === e.target.value);
                setFormData({ ...formData, lease_id: e.target.value, tenant_id: selected?.tenant_id || '' });
              }}
            >
              <option value="">Select a lease</option>
              {leases.map((lease) => (
                <option key={lease.id} value={lease.id}>
                  {lease.tenant?.user?.name} — Unit {lease.unit?.unit_number} (ETB {lease.monthly_rent?.toLocaleString()}/mo)
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid gap-5 sm:grid-cols-3">
            <FormField label="Amount (ETB)" required>
              <input type="number" min="0" step="0.01" className="field-input" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="e.g. 25000" />
            </FormField>
            <FormField label="Payment date" required>
              <input type="date" className="field-input" required value={formData.payment_date} onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })} />
            </FormField>
            <FormField label="Due date" required>
              <input type="date" className="field-input" required value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
            </FormField>
          </div>

          <FormField label="Payment method" required>
            <select className="field-input" required value={formData.payment_method} onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="check">Check</option>
              <option value="chapa">Chapa</option>
              <option value="other">Other</option>
            </select>
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Description">
              <input className="field-input" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="e.g. September rent" />
            </FormField>
            <FormField label="Notes">
              <textarea className="field-input resize-none" rows={2} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes" />
            </FormField>
          </div>
        </form>
      </Modal>

      {/* Chapa Payment Modal */}
      <Modal
        open={showChapaModal}
        onClose={() => setShowChapaModal(false)}
        title="Pay with Chapa"
        description="Make a test payment via Chapa. No real money will be transferred."
        size="lg"
        footer={
          <>
            <button type="button" onClick={() => setShowChapaModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" form="chapa-form" disabled={chapaSaving} className="btn btn-primary bg-teal-600 hover:bg-teal-700">
              {chapaSaving ? 'Redirecting...' : 'Proceed to payment'}
            </button>
          </>
        }
      >
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={16} className="mt-0.5 text-amber-600" />
            <p className="text-sm text-amber-800">
              <strong className="font-semibold">Test Mode.</strong> This is a sandbox environment — no actual funds will be transferred.
            </p>
          </div>
        </div>

        <form id="chapa-form" onSubmit={handleChapaSubmit} className="space-y-5">
          <FormField label="Active lease" required>
            <select
              className="field-input"
              required
              value={chapaFormData.lease_id}
              onChange={(e) => {
                const selected = leases.find((l) => l.id === e.target.value);
                setChapaFormData({ ...chapaFormData, lease_id: e.target.value, tenant_id: selected?.tenant_id || '', amount: selected?.monthly_rent || '' });
              }}
            >
              <option value="">Select a lease</option>
              {leases.map((lease) => (
                <option key={lease.id} value={lease.id}>
                  {lease.tenant?.user?.name} — Unit {lease.unit?.unit_number} (ETB {lease.monthly_rent?.toLocaleString()}/mo)
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Amount (ETB)" required>
            <input type="number" min="0" step="0.01" className="field-input" required value={chapaFormData.amount} onChange={(e) => setChapaFormData({ ...chapaFormData, amount: e.target.value })} placeholder="e.g. 25000" />
          </FormField>

          <FormField label="Email" required>
            <input type="email" className="field-input" required value={chapaFormData.email} onChange={(e) => setChapaFormData({ ...chapaFormData, email: e.target.value })} placeholder="e.g. tenant@example.com" />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="First name" required>
              <input className="field-input" required value={chapaFormData.first_name} onChange={(e) => setChapaFormData({ ...chapaFormData, first_name: e.target.value })} placeholder="e.g. Hanna" />
            </FormField>
            <FormField label="Last name" required>
              <input className="field-input" required value={chapaFormData.last_name} onChange={(e) => setChapaFormData({ ...chapaFormData, last_name: e.target.value })} placeholder="e.g. Abate" />
            </FormField>
          </div>

          <FormField label="Phone number" required>
            <input type="tel" className="field-input" required value={chapaFormData.phone_number} onChange={(e) => setChapaFormData({ ...chapaFormData, phone_number: e.target.value })} placeholder="e.g. +251911000000" />
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete payment?"
        message="This will remove the payment record from your workspace. This action cannot be undone."
        onCancel={() => setDeleteId(null)}
        onConfirm={() => handleDelete(deleteId)}
        loading={deleting}
      />
    </AppShell>
    </AuthGuard>
  );
}

function SummaryCard({ icon: Icon, label, value, accent }) {
  const accentStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  };

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ${accentStyles[accent] || accentStyles.emerald}`}>
          <Icon size={18} />
        </span>
        <div>
          <p className="text-xs font-medium text-slate-400">{label}</p>
          <p className="text-lg font-semibold text-slate-950">{value}</p>
        </div>
      </div>
    </div>
  );
}