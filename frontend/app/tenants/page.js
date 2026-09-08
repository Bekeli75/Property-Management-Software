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
import { Users, UserPlus, Trash2, ChevronRight, ShieldCheck } from 'lucide-react';

const emptyForm = {
  user_id: '',
  id_number: '',
  id_type: 'national_id',
  date_of_birth: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  employment_status: '',
  employer_name: '',
  monthly_income: '',
  notes: '',
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TenantsPage() {
  const { isAuthenticated, isOwner, isManager, isAdmin } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState(emptyForm);

  const canManage = isOwner || isAdmin;

  const fetchTenants = useCallback(async () => {
    try {
      const response = await apiClient.getTenants();
      if (response.success) setTenants(response.data);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
      toast.error('Unable to load tenants.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await apiClient.getUsers('tenant');
      if (response.success) setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isOwner && !isManager && !isAdmin) {
      router.push('/dashboard');
      return;
    }
    const load = async () => {
      await fetchTenants();
      await fetchUsers();
    };
    load();
  }, [isAuthenticated, isOwner, isManager, isAdmin, router, fetchTenants, fetchUsers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await apiClient.createTenant(formData);
      if (response.success) {
        toast.success('Tenant profile created.');
        setShowModal(false);
        setFormData(emptyForm);
        fetchTenants();
      } else {
        toast.error(response.message || 'Unable to create tenant.');
      }
    } catch (error) {
      console.error('Failed to create tenant:', error);
      toast.error('Unable to create tenant.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await apiClient.deleteTenant(id);
      toast.success('Tenant removed.');
      fetchTenants();
    } catch (error) {
      console.error('Failed to delete tenant:', error);
      toast.error('Unable to delete the tenant.');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10">
          <PageHeader eyebrow="People" title="Tenants" description="Manage tenant profiles and lease associations." />
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AuthGuard roles={['administrator', 'owner', 'manager']}>
      <AppShell>
      <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10">
        <PageHeader
          eyebrow="People"
          title={`Tenants (${tenants.length})`}
          description="Tenant profiles linked to active and past leases."
          actions={
            canManage ? (
              <button type="button" onClick={() => setShowModal(true)} className="btn btn-primary">
                <UserPlus size={16} />
                Add tenant
              </button>
            ) : undefined
          }
        />

        {tenants.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={Users}
              title="No tenants yet"
              description="Tenant records are created when users register with the tenant role."
              actionLabel={canManage ? 'Add tenant' : undefined}
              onAction={canManage ? () => setShowModal(true) : undefined}
            />
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tenants.map((tenant) => {
              const lease = tenant.activeLease;
              const unit = lease?.unit;
              const property = unit?.property;
              return (
                <button
                  key={tenant.id}
                  type="button"
                  onClick={() => router.push(`/tenants/${tenant.id}`)}
                  className="card flex w-full flex-col items-start gap-4 p-6 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex w-full items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                        <Users size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">{tenant.user?.name || 'Tenant'}</p>
                        <p className="truncate text-xs text-slate-500">{tenant.user?.email || ''}</p>
                      </div>
                    </div>
                    <Badge status={tenant.status || 'active'} />
                  </div>

                  <dl className="w-full space-y-2 border-t border-slate-100 pt-4 text-xs">
                    {unit && (
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-slate-400" /> Unit</span>
                        <span className="font-medium text-slate-800">{unit.unit_number} · {property?.name || '—'}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-slate-500">
                      <span>ID</span>
                      <span className="font-medium text-slate-800">{tenant.id_number || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Employment</span>
                      <span className="font-medium capitalize text-slate-800">{tenant.employment_status?.replace('_', ' ') || '—'}</span>
                    </div>
                    {tenant.monthly_income && (
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Income</span>
                        <span className="font-medium text-slate-800">ETB {Number(tenant.monthly_income).toLocaleString()}</span>
                      </div>
                    )}
                  </dl>

                  <span className="btn btn-secondary mt-auto flex w-full items-center justify-center gap-1 py-2.5 text-xs">
                    View profile
                    <ChevronRight size={14} />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Tenant Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add new tenant"
        description="Link a tenant user to their profile information."
        size="lg"
        footer={
          <>
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" form="tenant-form" disabled={saving} className="btn btn-primary">
              {saving ? 'Creating...' : 'Create tenant'}
            </button>
          </>
        }
      >
        <form id="tenant-form" onSubmit={handleSubmit} className="space-y-5">
          <FormField label="Tenant user" required hint="Select a user already registered with the tenant role.">
            <select className="field-input" required value={formData.user_id} onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}>
              <option value="">Select a user</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="ID number" required>
              <input className="field-input" required value={formData.id_number} onChange={(e) => setFormData({ ...formData, id_number: e.target.value })} placeholder="e.g. 1234567890" />
            </FormField>
            <FormField label="ID type" required>
              <select className="field-input" required value={formData.id_type} onChange={(e) => setFormData({ ...formData, id_type: e.target.value })}>
                <option value="national_id">National ID</option>
                <option value="passport">Passport</option>
                <option value="driver_license">Driver&apos;s License</option>
                <option value="other">Other</option>
              </select>
            </FormField>
          </div>

          <FormField label="Date of birth">
            <input type="date" className="field-input" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Emergency contact name">
              <input className="field-input" value={formData.emergency_contact_name} onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })} placeholder="e.g. Tata Mulugeta" />
            </FormField>
            <FormField label="Emergency contact phone">
              <input className="field-input" value={formData.emergency_contact_phone} onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })} placeholder="e.g. +251911000000" />
            </FormField>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <FormField label="Employment status">
              <select className="field-input" value={formData.employment_status} onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}>
                <option value="">Select status</option>
                <option value="employed">Employed</option>
                <option value="self_employed">Self Employed</option>
                <option value="unemployed">Unemployed</option>
                <option value="student">Student</option>
                <option value="retired">Retired</option>
              </select>
            </FormField>
            <FormField label="Employer name">
              <input className="field-input" value={formData.employer_name} onChange={(e) => setFormData({ ...formData, employer_name: e.target.value })} placeholder="e.g. Ethiopian Airlines" />
            </FormField>
            <FormField label="Monthly income (ETB)">
              <input type="number" min="0" className="field-input" value={formData.monthly_income} onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })} placeholder="e.g. 45000" />
            </FormField>
          </div>

          <FormField label="Notes">
            <textarea className="field-input resize-none" rows={2} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes" />
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete tenant record?"
        message="This will remove the tenant record. The tenant user will no longer be associated with this workspace."
        onCancel={() => setDeleteId(null)}
        onConfirm={() => handleDelete(deleteId)}
        loading={deleting}
      />
    </AppShell>
    </AuthGuard>
  );
}