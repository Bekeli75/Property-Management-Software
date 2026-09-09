'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import apiClient from '@/lib/api';
import { tenantName } from '@/lib/tenantLabel';
import ConfirmDialog from '@/components/ConfirmDialog';
import FileUpload from '@/components/FileUpload';
import AppShell from '@/components/AppShell';
import AuthGuard from '@/components/AuthGuard';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import FormField from '@/components/ui/FormField';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { imageUrl } from '@/components/PropertyImageFields';
import { Wrench, Plus, Camera, MapPin, CalendarClock, ArrowRight, Trash2, UserCheck, CheckCircle } from 'lucide-react';

const emptyForm = {
  property_id: '',
  unit_id: '',
  tenant_id: '',
  title: '',
  description: '',
  priority: 'medium',
  category: 'other',
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MaintenancePage() {
  const { user, isAuthenticated, isOwner, isAdmin, isTenant, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [assigning, setAssigning] = useState(null);
  const [assignForm, setAssignForm] = useState({ assigned_to: '', scheduled_date: '' });
  const [assigningLoading, setAssigningLoading] = useState(false);
  const [completing, setCompleting] = useState(null);
  const [completeForm, setCompleteForm] = useState({ actual_cost: '', notes: '' });
  const [completingLoading, setCompletingLoading] = useState(false);

  const isStaff = !isTenant;

  const fetchRequests = useCallback(async () => {
    try {
      const response = await apiClient.getMaintenanceRequests();
      if (response.success) setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch maintenance requests:', error);
      toast.error('Unable to load maintenance requests.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchProperties = useCallback(async () => {
    try {
      const response = await apiClient.getProperties();
      if (response.success) setProperties(response.data);
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    }
  }, []);

  const fetchTenants = useCallback(async () => {
    try {
      const response = await apiClient.getTenants();
      if (response.success) setTenants(response.data);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    }
  }, []);

  const fetchUnits = useCallback(async (propertyId) => {
    try {
      const response = await apiClient.getUnitsByProperty(propertyId);
      if (response.success) setUnits(response.data);
    } catch (error) {
      console.error('Failed to fetch units:', error);
    }
  }, []);

  const fetchUnitsForTenant = useCallback(async () => {
    try {
      const response = await apiClient.getUnits();
      if (response.success) {
        const tenantId = user?.tenant?.id;
        const tenantUnits = (response.data || []).filter(
          (u) => u.activeLease?.tenant_id === tenantId
        );
        setUnits(tenantUnits);
      }
    } catch (error) {
      console.error('Failed to fetch units:', error);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return undefined;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    const load = async () => {
      await fetchRequests();
      if (isStaff) {
        await fetchProperties();
        await fetchTenants();
      } else if (isTenant) {
        await fetchUnitsForTenant();
      }
    };
    load();
  }, [authLoading, isAuthenticated, isStaff, isTenant, router, fetchRequests, fetchProperties, fetchTenants, fetchUnitsForTenant]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let payload;
      if (isTenant) {
        if (units.length === 0) {
          toast.error('You need an active lease before you can file a maintenance request.');
          setSaving(false);
          return;
        }
        if (!formData.unit_id) {
          toast.error('Please select a unit.');
          setSaving(false);
          return;
        }
        payload = { ...formData, property_id: formData.property_id || undefined, tenant_id: undefined };
        delete payload.tenant_id;
        payload = Object.fromEntries(Object.entries(payload).filter(([, v]) => v));
      } else if (photos.length) {
        payload = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          if (value !== '' && value !== null && value !== undefined) payload.append(key, value);
        });
        photos.forEach((file) => payload.append('photos[]', file));
      } else {
        payload = formData;
      }

      const response = await apiClient.createMaintenanceRequest(payload);
      if (response.success) {
        toast.success('Maintenance request created.');
        setShowModal(false);
        setFormData(emptyForm);
        setPhotos([]);
        fetchRequests();
      } else {
        toast.error(response.message || 'Unable to create the request.');
      }
    } catch (error) {
      console.error('Failed to create maintenance request:', error);
      toast.error(error.message || 'Unable to create the request.');
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setAssigningLoading(true);
    try {
      const response = await apiClient.assignMaintenanceRequest(assigning.id, assignForm);
      if (response.success) {
        toast.success('Request assigned.');
        setAssigning(null);
        setAssignForm({ assigned_to: '', scheduled_date: '' });
        fetchRequests();
      } else {
        toast.error(response.message || 'Unable to assign the request.');
      }
    } catch (error) {
      console.error('Failed to assign request:', error);
      toast.error('Unable to assign the request.');
    } finally {
      setAssigningLoading(false);
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    setCompletingLoading(true);
    try {
      const response = await apiClient.completeMaintenanceRequest(completing.id, {
        actual_cost: completeForm.actual_cost === '' ? null : parseFloat(completeForm.actual_cost),
        notes: completeForm.notes || '',
      });
      if (response.success) {
        toast.success('Request completed.');
        setCompleting(null);
        setCompleteForm({ actual_cost: '', notes: '' });
        fetchRequests();
      } else {
        toast.error(response.message || 'Unable to complete the request.');
      }
    } catch (error) {
      console.error('Failed to complete request:', error);
      toast.error('Unable to complete the request.');
    } finally {
      setCompletingLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await apiClient.deleteMaintenanceRequest(id);
      toast.success('Request deleted.');
      fetchRequests();
    } catch (error) {
      console.error('Failed to delete request:', error);
      toast.error('Unable to delete the request.');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10">
          <PageHeader eyebrow="Operations" title="Maintenance" description="Track repair requests, assignments, and completion." />
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
          eyebrow="Operations"
          title={`Maintenance (${requests.length})`}
          description={isTenant ? 'Report issues and track their progress from request to completion.' : 'Track repair requests, assignments, and completion.'}
          actions={
            <button type="button" onClick={() => setShowModal(true)} className="btn btn-primary">
              <Plus size={16} />
              New request
            </button>
          }
        />

        {requests.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={Wrench}
              title="No maintenance requests"
              description="Create a request when something needs attention in a property."
              actionLabel="Create your first request"
              onAction={() => setShowModal(true)}
            />
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {requests.map((request) => {
              const coverPhoto = request.photos?.[0];
              return (
                <article key={request.id} className="card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
                  <button type="button" onClick={() => router.push(`/maintenance/${request.id}`)} className="block w-full text-left" aria-label={`View ${request.title}`}>
                    {coverPhoto ? (
                      <div className="relative h-36 w-full">
                        <img src={imageUrl(coverPhoto.file_path)} alt="" className="h-full w-full object-cover" />
                        <span className="absolute left-3 top-3"><Badge status={request.status} /></span>
                      </div>
                    ) : (
                      <div className="property-card-banner flex h-36 items-center justify-center">
                        <Camera size={36} strokeWidth={1.25} className="text-white/30" />
                        <span className="absolute left-3 top-3"><Badge status={request.status} className="bg-white/90 text-slate-700" /></span>
                      </div>
                    )}
                  </button>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="truncate text-base font-semibold text-slate-950">{request.title}</h3>
                      <Badge status={request.priority} />
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-slate-500">{request.description}</p>

                    <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <MapPin size={12} className="shrink-0 text-slate-400" />
                        <span className="truncate">{request.property?.name} · {request.unit?.unit_number}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <CalendarClock size={12} className="shrink-0 text-slate-400" />
                        <span>Requested {formatDate(request.requested_date)}</span>
                      </div>
                      {request.assigned_to && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <UserCheck size={12} className="shrink-0 text-slate-400" />
                          <span>Assigned to {request.assigned_to}</span>
                        </div>
                      )}
                      {request.actual_cost != null && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <CheckCircle size={12} className="shrink-0 text-emerald-500" />
                          <span>Cost ETB {Number(request.actual_cost).toLocaleString()}</span>
                        </div>
                      )}
                    </dl>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" onClick={() => router.push(`/maintenance/${request.id}`)} className="btn btn-secondary flex-1 py-2 text-xs">
                        View details
                        <ArrowRight size={14} />
                      </button>
                      {request.status === 'pending' && isStaff && (
                        <button type="button" onClick={() => setAssigning(request)} className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 transition hover:bg-teal-100">
                          Assign
                        </button>
                      )}
                      {request.status === 'in_progress' && isStaff && (
                        <button type="button" onClick={() => setCompleting(request)} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100">
                          Complete
                        </button>
                      )}
                      {(isOwner || isAdmin) && (
                        <button type="button" onClick={() => setDeleteId(request.id)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100" aria-label="Delete request">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Create request modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="New maintenance request"
        description="Describe the issue and where it is located."
        size="xl"
        footer={
          <>
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" form="maintenance-form" disabled={saving} className="btn btn-primary">
              {saving ? 'Creating...' : 'Create request'}
            </button>
          </>
        }
      >
        <form id="maintenance-form" onSubmit={handleSubmit} className="space-y-5">
          {isStaff ? (
            <>
              <div className="grid gap-5 sm:grid-cols-3">
                <FormField label="Property" required>
                  <select
                    className="field-input"
                    required
                    value={formData.property_id}
                    onChange={(e) => {
                      setFormData({ ...formData, property_id: e.target.value, unit_id: '' });
                      fetchUnits(e.target.value);
                    }}
                  >
                    <option value="">Select a property</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>{property.name}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Unit" required>
                  <select
                    className="field-input"
                    required
                    value={formData.unit_id}
                    onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                    disabled={!formData.property_id}
                  >
                    <option value="">Select a unit</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>{unit.unit_number} — {unit.type}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Tenant" required hint="Select the tenant whose unit this issue is for.">
                  <select className="field-input" required value={formData.tenant_id} onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}>
                    <option value="">Select a tenant</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>{tenantName(tenant)}</option>
                    ))}
                  </select>
                </FormField>
              </div>
            </>
          ) : units.length === 0 ? (
            <p className="rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-500">
              No active lease is linked to this account yet, so there is no unit you can report an issue for.
              Ask your property manager to link your lease, then come back here.
            </p>
          ) : (
            <FormField label="Unit" required hint="Choose the unit where the issue is located.">
              <select className="field-input" required value={formData.unit_id} onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}>
                <option value="">Select your unit</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>{unit.unit_number} — {unit.property?.name}</option>
                ))}
              </select>
            </FormField>
          )}

          <FormField label="Title" required>
            <input className="field-input" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Water heater not heating" />
          </FormField>

          <FormField label="Description" required>
            <textarea className="field-input resize-none" rows={3} required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the issue, location and urgency" />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Priority" required>
              <select className="field-input" required value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </FormField>
            <FormField label="Category" required>
              <select className="field-input" required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="structural">Structural</option>
                <option value="hvac">HVAC</option>
                <option value="appliances">Appliances</option>
                <option value="other">Other</option>
              </select>
            </FormField>
          </div>

          {isStaff && (
            <FileUpload
              id="maintenance-photos"
              label="Photos"
              hint="Add up to 5 photos of the issue (JPG, PNG, or WEBP up to 5 MB)."
              accept={['jpg', 'jpeg', 'png', 'webp']}
              maxSizeMB={5}
              files={photos}
              onChange={setPhotos}
            />
          )}
        </form>
      </Modal>

      {/* Assign modal */}
      <Modal
        open={assigning !== null}
        onClose={() => setAssigning(null)}
        title="Assign request"
        description={assigning ? `Assign "${assigning.title}" to a technician or team member.` : ''}
        footer={
          <>
            <button type="button" onClick={() => setAssigning(null)} className="btn btn-secondary">Cancel</button>
            <button type="submit" form="assign-form" disabled={assigningLoading} className="btn btn-primary">
              {assigningLoading ? 'Assigning...' : 'Assign request'}
            </button>
          </>
        }
      >
        <form id="assign-form" onSubmit={handleAssign} className="space-y-5">
          <FormField label="Assigned person" required hint="Name or role of the person picking this up.">
            <input className="field-input" required value={assignForm.assigned_to} onChange={(e) => setAssignForm({ ...assignForm, assigned_to: e.target.value })} placeholder="e.g. Mekonnen Worku" />
          </FormField>
          <FormField label="Scheduled date">
            <input type="date" className="field-input" value={assignForm.scheduled_date} onChange={(e) => setAssignForm({ ...assignForm, scheduled_date: e.target.value })} />
          </FormField>
        </form>
      </Modal>

      {/* Complete modal */}
      <Modal
        open={completing !== null}
        onClose={() => setCompleting(null)}
        title="Complete request"
        description={completing ? `Mark "${completing.title}" as completed.` : ''}
        footer={
          <>
            <button type="button" onClick={() => setCompleting(null)} className="btn btn-secondary">Cancel</button>
            <button type="submit" form="complete-form" disabled={completingLoading} className="btn btn-primary">
              {completingLoading ? 'Completing...' : 'Complete request'}
            </button>
          </>
        }
      >
        <form id="complete-form" onSubmit={handleComplete} className="space-y-5">
          <FormField label="Actual cost (ETB)">
            <input type="number" min="0" step="0.01" className="field-input" value={completeForm.actual_cost} onChange={(e) => setCompleteForm({ ...completeForm, actual_cost: e.target.value })} placeholder="e.g. 3500" />
          </FormField>
          <FormField label="Completion notes">
            <textarea className="field-input resize-none" rows={3} value={completeForm.notes} onChange={(e) => setCompleteForm({ ...completeForm, notes: e.target.value })} placeholder="What was fixed and any follow-up needed" />
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete maintenance request?"
        message="This will remove the maintenance request and its history. This action cannot be undone."
        onCancel={() => setDeleteId(null)}
        onConfirm={() => handleDelete(deleteId)}
        loading={deleting}
      />
    </AppShell>
    </AuthGuard>
  );
}