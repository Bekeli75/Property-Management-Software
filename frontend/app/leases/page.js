'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import apiClient from '@/lib/api';
import { tenantFull } from '@/lib/tenantLabel';
import ConfirmDialog from '@/components/ConfirmDialog';
import FileUpload from '@/components/FileUpload';
import AppShell from '@/components/AppShell';
import AuthGuard from '@/components/AuthGuard';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import FormField from '@/components/ui/FormField';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonStat } from '@/components/ui/Skeleton';
import {
  FileText,
  Plus,
  User,
  CalendarRange,
  Banknote,
  ArrowRight,
  Trash2,
  XCircle,
} from 'lucide-react';

const emptyForm = {
  tenant_id: '',
  property_id: '',
  unit_id: '',
  start_date: '',
  end_date: '',
  monthly_rent: '',
  security_deposit: '',
  payment_frequency: 'monthly',
  payment_day: 1,
  terms: '',
  notes: '',
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function LeasesPage() {
  const { isAuthenticated, isOwner, isManager, isAdmin, isTenant, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [terminateLease, setTerminateLease] = useState(null);
  const [terminationForm, setTerminationForm] = useState({ termination_reason: '', termination_effective_date: '' });
  const [terminating, setTerminating] = useState(false);
  const [approveLease, setApproveLease] = useState(null);
  const [approving, setApproving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const canManage = !isTenant && (isOwner || isManager || isAdmin);

  const fetchLeases = useCallback(async () => {
    try {
      const response = await apiClient.getLeases();
      if (response.success) setLeases(response.data);
    } catch (error) {
      console.error('Failed to fetch leases:', error);
      toast.error('Unable to load your leases.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchTenants = useCallback(async (forLeaseCreation = false) => {
    try {
      const response = await apiClient.getTenants(forLeaseCreation);
      if (response.success) setTenants(response.data);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    }
  }, []);

  const fetchUnits = useCallback(async () => {
    try {
      const response = await apiClient.getUnits();
      if (response.success) setUnits(response.data);
    } catch (error) {
      console.error('Failed to fetch units:', error);
    }
  }, []);

  const fetchProperties = useCallback(async () => {
    try {
      const response = await apiClient.getProperties();
      if (response.success) setProperties(response.data);
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return undefined;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    const load = async () => {
      await fetchLeases();
      if (!isTenant) {
        await fetchTenants(true); // bypass role filtering for lease creation
        await fetchUnits();
        await fetchProperties();
      }
    };
    load();
  }, [authLoading, isAuthenticated, isTenant, router, fetchLeases, fetchTenants, fetchUnits, fetchProperties]);

  const availableUnits = useMemo(() => {
    const base = units.filter((u) => u.status === 'available');
    if (!formData.property_id) return base;
    return base.filter((u) => Number(u.property_id) === Number(formData.property_id));
  }, [units, formData.property_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let payload;
      if (attachments.length) {
        payload = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          if (value !== '' && value !== null && value !== undefined) payload.append(key, value);
        });
        attachments.forEach((file) => payload.append('attachments[]', file));
      } else {
        payload = formData;
      }

      const response = await apiClient.createLease(payload);
      if (response.success) {
        toast.success('Lease created successfully.');
        setShowModal(false);
        setFormData(emptyForm);
        setAttachments([]);
        fetchLeases();
        fetchUnits();
      } else {
        toast.error(response.message || 'Unable to create the lease.');
      }
    } catch (error) {
      console.error('Failed to create lease:', error);
      toast.error(error.message || 'Unable to create the lease.');
    } finally {
      setSaving(false);
    }
  };

  const handleTerminate = async (e) => {
    e.preventDefault();
    setTerminating(true);
    try {
      const response = await apiClient.terminateLease(terminateLease.id, terminationForm);
      if (response.success) {
        toast.success('Termination request submitted.');
        setTerminateLease(null);
        setTerminationForm({ termination_reason: '', termination_effective_date: '' });
        fetchLeases();
      } else {
        toast.error(response.message || 'Unable to submit the request.');
      }
    } catch (error) {
      console.error('Failed to terminate lease:', error);
      toast.error(error.message || 'Unable to submit the request.');
    } finally {
      setTerminating(false);
    }
  };

  const handleApproveTermination = async () => {
    setApproving(true);
    try {
      const response = await apiClient.approveTerminationLease(approveLease.id);
      if (response.success) {
        toast.success('Lease terminated. The unit is now available.');
        setApproveLease(null);
        fetchLeases();
      } else {
        toast.error(response.message || 'Unable to approve the termination.');
      }
    } catch (error) {
      console.error('Failed to approve termination:', error);
      toast.error(error.message || 'Unable to approve the termination.');
    } finally {
      setApproving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await apiClient.deleteLease(id);
      toast.success('Lease deleted.');
      fetchLeases();
    } catch (error) {
      console.error('Failed to delete lease:', error);
      toast.error('Unable to delete the lease.');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10">
          <PageHeader eyebrow="Management" title="Leases" description="Keep tenant agreements, rent terms, and attachments organized." />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)}
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
          eyebrow={isTenant ? 'My account' : 'Management'}
          title={isTenant ? 'My lease' : `All leases (${leases.length})`}
          description={
            isTenant
              ? 'Review your rent, dates, and terms of your current agreement.'
              : 'Keep tenant agreements, rent terms, and attachments organized.'
          }
          actions={
            canManage && (
              <button type="button" onClick={() => setShowModal(true)} className="btn btn-primary">
                <Plus size={16} />
                Create lease
              </button>
            )
          }
        />

        {leases.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={FileText}
              title="No leases yet"
              description={canManage ? 'Create your first lease to link a tenant with a unit.' : 'No lease is linked to this account yet.'}
              actionLabel={canManage ? 'Create your first lease' : undefined}
              onAction={canManage ? () => setShowModal(true) : undefined}
            />
          </div>
        ) : (
          <div className="card mt-8 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/70">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Tenant</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Monthly rent</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {leases.map((lease) => (
                    <tr key={lease.id} className="premium-table-row">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-semibold text-slate-900">{lease.tenant?.user?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{lease.tenant?.user?.email || ''}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-slate-900">{lease.unit?.unit_number} — {lease.unit?.property?.name}</p>
                        <p className="text-xs capitalize text-slate-500">{lease.unit?.type}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-slate-900">{formatDate(lease.start_date)}</p>
                        <p className="text-xs text-slate-500">to {formatDate(lease.end_date)}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-semibold text-slate-900">ETB {Number(lease.monthly_rent || 0).toLocaleString()}</p>
                        <p className="text-xs capitalize text-slate-500">{lease.payment_frequency}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge status={lease.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button type="button" onClick={() => router.push(`/leases/${lease.id}`)} className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900">
                          View
                          <ArrowRight size={14} />
                        </button>
                        {lease.status === 'active' && (canManage || isTenant) && (
                          <button type="button" onClick={() => setTerminateLease(lease)} className="ml-4 inline-flex items-center gap-1 text-amber-600 hover:text-amber-800">
                            <XCircle size={14} />
                            {isTenant ? 'Request termination' : 'Terminate'}
                          </button>
                        )}
                        {lease.status === 'pending_termination' && canManage && (
                          <button type="button" onClick={() => setApproveLease(lease)} className="ml-4 inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800">
                            Approve
                          </button>
                        )}
                        {canManage && (
                          <button type="button" onClick={() => setDeleteId(lease.id)} className="ml-4 inline-flex items-center gap-1 text-red-600 hover:text-red-900">
                            <Trash2 size={14} />
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

      {/* Create lease modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Create new lease"
        description="Link a tenant to a unit and set the rental terms."
        size="xl"
        footer={
          <>
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" form="lease-form" disabled={saving} className="btn btn-primary">
              {saving ? 'Creating...' : 'Create lease'}
            </button>
          </>
        }
      >
        <form id="lease-form" onSubmit={handleSubmit} className="space-y-7">
          {/* Tenant & property */}
          <section>
            <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <User size={15} className="text-teal-600" />
              Tenant &amp; unit
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Tenant" required>
                <select className="field-input" required value={formData.tenant_id} onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}>
                  <option value="">Select a tenant</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>{tenantFull(tenant)}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Property">
                <select className="field-input" value={formData.property_id} onChange={(e) => setFormData({ ...formData, property_id: e.target.value, unit_id: '' })}>
                  <option value="">Filter units by property</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>{property.name}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Unit" required>
                <select className="field-input" required value={formData.unit_id} onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}>
                  <option value="">Select an available unit</option>
                  {availableUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.unit_number} — {unit.property?.name} (ETB {Number(unit.base_rent || 0).toLocaleString()}/mo)
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </section>

          {/* Dates */}
          <section>
            <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <CalendarRange size={15} className="text-teal-600" />
              Lease period
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Start date" required>
                <input type="date" className="field-input" required min={tomorrow} value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
              </FormField>
              <FormField label="End date" required hint="Lease becomes active at midnight on the start date.">
                <input type="date" className="field-input" required min={formData.start_date || tomorrow} value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
              </FormField>
            </div>
          </section>

          {/* Rent */}
          <section>
            <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Banknote size={15} className="text-teal-600" />
              Rent &amp; deposit
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Monthly rent (ETB)" required>
                <input type="number" min="0" step="0.01" required className="field-input" value={formData.monthly_rent} onChange={(e) => setFormData({ ...formData, monthly_rent: parseFloat(e.target.value) })} placeholder="e.g. 25000" />
              </FormField>
              <FormField label="Security deposit (ETB)">
                <input type="number" min="0" step="0.01" className="field-input" value={formData.security_deposit} onChange={(e) => setFormData({ ...formData, security_deposit: parseFloat(e.target.value) })} placeholder="e.g. 25000" />
              </FormField>
              <FormField label="Payment frequency" required>
                <select className="field-input" required value={formData.payment_frequency} onChange={(e) => setFormData({ ...formData, payment_frequency: e.target.value })}>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="semi_annual">Semi-annual</option>
                  <option value="annual">Annual</option>
                </select>
              </FormField>
              <FormField label="Payment day" required hint="Day of the month rent is due.">
                <input type="number" min="1" max="31" required className="field-input" value={formData.payment_day} onChange={(e) => setFormData({ ...formData, payment_day: parseInt(e.target.value) || 1 })} />
              </FormField>
            </div>
          </section>

          {/* Terms */}
          <section>
            <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <FileText size={15} className="text-teal-600" />
              Terms &amp; attachments
            </p>
            <div className="grid gap-5">
              <FormField label="Terms" hint="Conditions, house rules, or renewal terms.">
                <textarea className="field-input resize-none" rows={3} value={formData.terms} onChange={(e) => setFormData({ ...formData, terms: e.target.value })} placeholder="e.g. No subletting, quiet hours after 10 PM" />
              </FormField>
              <FormField label="Notes">
                <textarea className="field-input resize-none" rows={2} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Add renewal terms, special conditions, or internal notes." />
              </FormField>
              <FileUpload
                id="lease-attachments"
                label="Attachments"
                hint="Signed lease PDF or ID photos, up to 10 MB each."
                accept={['pdf', 'jpg', 'jpeg', 'png', 'webp']}
                maxSizeMB={10}
                files={attachments}
                onChange={setAttachments}
              />
            </div>
          </section>
        </form>
      </Modal>

      {/* Termination modal */}
      <Modal
        open={terminateLease !== null}
        onClose={() => { setTerminateLease(null); setTerminationForm({ termination_reason: '', termination_effective_date: '' }); }}
        title="Request lease termination"
        description={terminateLease ? `Terminating the lease for ${terminateLease.tenant?.user?.name || 'this tenant'} on ${terminateLease.unit?.unit_number || 'this unit'}.` : ''}
        footer={
          <>
            <button type="button" onClick={() => setTerminateLease(null)} className="btn btn-secondary">Cancel</button>
            <button type="submit" form="terminate-form" disabled={terminating} className="btn btn-danger">
              {terminating ? 'Submitting...' : 'Submit request'}
            </button>
          </>
        }
      >
        <form id="terminate-form" onSubmit={handleTerminate} className="space-y-5">
          <FormField label="Reason for termination" required>
            <textarea className="field-input resize-none" rows={3} required value={terminationForm.termination_reason} onChange={(e) => setTerminationForm({ ...terminationForm, termination_reason: e.target.value })} placeholder="Explain why this lease is ending" />
          </FormField>
          <FormField label="Effective date" required>
            <input type="date" className="field-input" required min={tomorrow} value={terminationForm.termination_effective_date} onChange={(e) => setTerminationForm({ ...terminationForm, termination_effective_date: e.target.value })} />
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        open={approveLease !== null}
        title="Approve lease termination?"
        message={approveLease ? `This will mark the lease for ${approveLease.tenant?.user?.name || 'this tenant'} as terminated and make unit ${approveLease.unit?.unit_number || ''} available again. This action cannot be undone.` : ''}
        onCancel={() => setApproveLease(null)}
        onConfirm={handleApproveTermination}
        loading={approving}
      />

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete lease?"
        message="This will remove the lease record and its history from your workspace. This action cannot be undone."
        onCancel={() => setDeleteId(null)}
        onConfirm={() => handleDelete(deleteId)}
        loading={deleting}
      />
    </AppShell>
    </AuthGuard>
  );
}