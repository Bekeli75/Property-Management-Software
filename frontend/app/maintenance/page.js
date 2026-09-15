'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import apiClient from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';
import FileUpload from '@/components/FileUpload';
import AppShell from '@/components/AppShell';
import AuthGuard from '@/components/AuthGuard';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import { imageUrl } from '@/components/PropertyImageFields';
import MaintenanceKanban from '@/components/MaintenanceKanban';
import { Plus, Camera, LayoutGrid, KanbanSquare } from 'lucide-react';

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
  if (!value) return '\u2014';
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
  const [staff, setStaff] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [formData, setFormData] = useState(emptyForm);
  const [assigning, setAssigning] = useState(null);
  const [assignForm, setAssignForm] = useState({ assigned_to: '', scheduled_date: '' });
  const [assigningLoading, setAssigningLoading] = useState(false);
  const [completing, setCompleting] = useState(null);
  const [completeForm, setCompleteForm] = useState({ actual_cost: '', notes: '' });
  const [completingLoading, setCompletingLoading] = useState(false);
  const [photos, setPhotos] = useState([]);

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

  const fetchStaff = useCallback(async () => {
    try {
      const response = await apiClient.getUsers('manager');
      if (response.success) setStaff(response.data);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    }
  }, []);

  const fetchTenantUnits = useCallback(async () => {
    try {
      const response = await apiClient.getUnits();
      if (response.success) {
        const tenantId = user?.tenant?.id;
        setUnits((response.data || []).filter((u) => u.activeLease?.tenant_id === tenantId));
      }
    } catch (error) {
      console.error('Failed to fetch units:', error);
    }
  }, [user]);

  const fetchUnits = useCallback(async (propertyId) => {
    try {
      if (propertyId) {
        const response = await apiClient.getUnitsByProperty(propertyId);
        if (response.success) setUnits(response.data);
      } else {
        setUnits([]);
      }
    } catch (error) {
      console.error('Failed to fetch units:', error);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return undefined;
    if (!isAuthenticated) {
      router.push('/login');
      return undefined;
    }
    const load = async () => {
      await fetchRequests();
      if (isStaff) {
        await fetchProperties();
        await fetchTenants();
        await fetchStaff();
      } else if (isTenant) {
        await fetchTenantUnits();
      }
    };
    load();
    return undefined;
  }, [authLoading, isAuthenticated, isStaff, isTenant, router, fetchRequests, fetchProperties, fetchTenants, fetchStaff, fetchTenantUnits]);

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
        payload = { ...formData, property_id: formData.property_id || undefined };
        delete payload.tenant_id;
        payload = Object.fromEntries(Object.entries(payload).filter(([key, value]) => value !== '' && value !== null && value !== undefined));
      } else if (photos.length > 0) {
        payload = new FormData();
        Object.entries({ ...formData, tenant_id: formData.tenant_id || undefined }).forEach(([key, value]) => {
          if (value !== '' && value !== null && value !== undefined) payload.append(key, value);
        });
        photos.forEach((file) => payload.append('photos[]', file));
      } else {
        payload = Object.fromEntries(Object.entries(formData).filter(([key, value]) => value !== ''));
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
          <SkeletonDashboard />
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
                image="/images/empty-maintenance.svg"
                title="No maintenance requests"
                description="Create a request when something needs attention in a property."
                actionLabel="Create your first request"
                onAction={() => setShowModal(true)}
              />
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600 dark:text-slate-400">View</label>
                  <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      aria-label="Grid view"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                        viewMode === 'grid'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                    >
                      <LayoutGrid size={14} />
                      <span className="hidden sm:inline">Grid</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('kanban')}
                      aria-label="Kanban view"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                        viewMode === 'kanban'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                    >
                      <KanbanSquare size={14} />
                      <span className="hidden sm:inline">Kanban</span>
                    </button>
                  </div>
                </div>
              </div>

              {viewMode === 'grid' ? (
                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {requests.map((request) => (
                    <article key={request.id} className="card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
                      <button
                        type="button"
                        onClick={() => router.push(`/maintenance/${request.id}`)}
                        className="block w-full text-left"
                        aria-label={`View ${request.title}`}
                      >
                        {request.photos && request.photos.length > 0 ? (
                          <div className="relative h-36 w-full">
                            <img
                              src={request.photos[0] && request.photos[0].file_path ? imageUrl(request.photos[0].file_path) : ''}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute left-3 top-3">
                              <Badge status={request.status} />
                            </span>
                          </div>
                        ) : (
                          <div className="property-card-banner relative flex h-36 items-center justify-center">
                            <Camera size={36} strokeWidth={1.25} className="text-white/30" />
                            <span className="absolute left-3 top-3">
                              <Badge status={request.status} className="bg-white/90 text-slate-700" />
                            </span>
                          </div>
                        )}
                      </button>

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="truncate text-base font-semibold text-slate-950 dark:text-slate-100">{request.title}</h3>
                          <Badge status={request.priority} />
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-slate-500 dark:text-slate-400">{request.description}</p>

                        <dl className="mt-4 space-y-1.5 border-t border-slate-100 dark:border-slate-700 pt-4 text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <span aria-hidden="true">&bull;</span>
                            <span className="truncate">{request.property && request.property.name}{request.unit && request.unit.unit_number ? ' \u00B7 ' + request.unit.unit_number : ''}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span aria-hidden="true">&bull;</span>
                            <span>Requested {formatDate(request.requested_date)}</span>
                          </div>
                          {request.assigned_to && (
                            <div className="flex items-center gap-1.5">
                              <span aria-hidden="true">&bull;</span>
                              <span>Assigned to {request.assigned_to}</span>
                            </div>
                          )}
                          {request.actual_cost !== null && request.actual_cost !== undefined && (
                            <div className="flex items-center gap-1.5">
                              <span aria-hidden="true">&bull;</span>
                              <span>Cost ETB {Number(request.actual_cost).toLocaleString()}</span>
                            </div>
                          )}
                        </dl>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => router.push(`/maintenance/${request.id}`)}
                            className="btn btn-secondary flex-1 py-2 text-xs"
                          >
                            View details
                          </button>
                          {isStaff && request.status === 'pending' && (
                            <button type="button" onClick={() => setAssigning(request)} className="btn btn-secondary py-2 text-xs">
                              Assign
                            </button>
                          )}
                          {isStaff && request.status !== 'completed' && request.status !== 'cancelled' && (
                            <button type="button" onClick={() => setCompleting(request)} className="btn btn-secondary py-2 text-xs">
                              Complete
                            </button>
                          )}
                          {(isAdmin || isOwner) && (
                            <button type="button" onClick={() => setDeleteId(request.id)} className="btn btn-secondary py-2 text-xs text-red-600 dark:text-red-400">
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <MaintenanceKanban
                  initialRequests={requests}
                  onAssign={isStaff ? setAssigning : null}
                  onComplete={isStaff ? setCompleting : null}
                />
              )}
            </>
          )}
        </main>
      </AppShell>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New maintenance request">
        <form onSubmit={handleSubmit} className="space-y-4">
          {isStaff ? (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Property</label>
                <select
                  value={formData.property_id}
                  onChange={(e) => {
                    setFormData({ ...formData, property_id: e.target.value, unit_id: '', tenant_id: '' });
                    fetchUnits(e.target.value || null);
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  <option value="">Select a property</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>{property.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Unit</label>
                <select
                  value={formData.unit_id}
                  onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  <option value="">Select a unit</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>{unit.unit_number}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Tenant</label>
                <select
                  value={formData.tenant_id}
                  onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  <option value="">Select a tenant</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Unit</label>
              <select
                value={formData.unit_id}
                onChange={(e) => {
                  const unit = units.find((u) => String(u.id) === String(e.target.value));
                  setFormData({ ...formData, unit_id: e.target.value, property_id: unit ? unit.property_id : '' });
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">Select your unit</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>{unit.unit_number}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Leaking kitchen faucet"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <textarea
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the issue..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="appliance">Appliance</option>
                <option value="hvac">HVAC</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {isStaff && (
            <FileUpload label="Photos" files={photos} onChange={setPhotos} />
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Creating...' : 'Create request'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(assigning)} onClose={() => setAssigning(null)} title="Assign maintenance request">
        {assigning && (
          <form onSubmit={handleAssign} className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">{assigning.title}</p>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Assign to</label>
              <select
                value={assignForm.assigned_to}
                onChange={(e) => setAssignForm({ ...assignForm, assigned_to: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">Select staff</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.name}>{member.name} ({member.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Scheduled date</label>
              <input
                type="date"
                value={assignForm.scheduled_date}
                onChange={(e) => setAssignForm({ ...assignForm, scheduled_date: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setAssigning(null)} className="btn btn-ghost">
                Cancel
              </button>
              <button type="submit" disabled={assigningLoading} className="btn btn-primary">
                {assigningLoading ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={Boolean(completing)} onClose={() => setCompleting(null)} title="Complete maintenance request">
        {completing && (
          <form onSubmit={handleComplete} className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">{completing.title}</p>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Actual cost (ETB)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={completeForm.actual_cost}
                onChange={(e) => setCompleteForm({ ...completeForm, actual_cost: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
              <textarea
                rows={3}
                value={completeForm.notes}
                onChange={(e) => setCompleteForm({ ...completeForm, notes: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setCompleting(null)} className="btn btn-ghost">
                Cancel
              </button>
              <button type="submit" disabled={completingLoading} className="btn btn-primary">
                {completingLoading ? 'Saving...' : 'Mark complete'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete maintenance request?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </AuthGuard>
  );
}