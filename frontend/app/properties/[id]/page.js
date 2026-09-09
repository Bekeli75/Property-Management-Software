'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter, useParams } from 'next/navigation';
import apiClient from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';
import PropertyImageFields, { imageUrl } from '@/components/PropertyImageFields';
import AppShell from '@/components/AppShell';
import AuthGuard from '@/components/AuthGuard';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import FormField from '@/components/ui/FormField';
import { SkeletonCard } from '@/components/ui/Skeleton';
import {
  Building2,
  MapPin,
  Ruler,
  CalendarDays,
  ArrowLeft,
  ArrowRight,
  LayoutGrid,
  Pencil,
  Trash2,
  Home,
  User as UserIcon,
  UserPlus,
  ShieldCheck,
} from 'lucide-react';

export default function PropertyDetailPage() {
  const { isAuthenticated, isOwner, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageFiles, setImageFiles] = useState({});
  const [editFormData, setEditFormData] = useState({});
  const [showManagersModal, setShowManagersModal] = useState(false);
  const [managerUsers, setManagerUsers] = useState([]);
  const [selectedManagerIds, setSelectedManagerIds] = useState([]);
  const [managersLoading, setManagersLoading] = useState(false);
  const [savingManagers, setSavingManagers] = useState(false);

  const canManage = isOwner || isAdmin;

  const fetchProperty = useCallback(async () => {
    try {
      const response = await apiClient.getProperty(params.id);
      if (response.success) {
        setProperty(response.data);
        setEditFormData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch property:', error);
      router.push('/properties');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    if (authLoading) return undefined;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    void Promise.resolve().then(fetchProperty);
  }, [authLoading, isAuthenticated, router, fetchProperty]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = new FormData();
      Object.entries(editFormData).forEach(([key, value]) => {
        if (['image_1', 'image_2', 'image_3'].includes(key) || value === null || value === undefined) return;
        payload.append(key, value);
      });
      Object.entries(imageFiles).forEach(([key, image]) => {
        if (image?.file) payload.append(key, image.file);
        if (image?.remove) payload.append(`remove_${key}`, '1');
      });
      const response = await apiClient.updateProperty(params.id, payload);
      if (response.success) {
        toast.success('Property updated successfully.');
        setShowEditModal(false);
        setImageFiles({});
        fetchProperty();
      } else {
        toast.error(response.message || 'Unable to update the property.');
      }
    } catch (error) {
      console.error('Failed to update property:', error);
      toast.error('Unable to update the property.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiClient.deleteProperty(params.id);
      toast.success('Property deleted.');
      router.push('/properties');
    } catch (error) {
      console.error('Failed to delete property:', error);
      toast.error('Unable to delete the property.');
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const openManagersModal = async () => {
    setShowManagersModal(true);
    setSelectedManagerIds(property.managers?.map((m) => m.id) || []);
    setManagersLoading(true);
    try {
      const response = await apiClient.getUsers('manager');
      if (response.success) {
        setManagerUsers(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch managers:', error);
    } finally {
      setManagersLoading(false);
    }
  };

  const handleSaveManagers = async (e) => {
    e.preventDefault();
    setSavingManagers(true);
    try {
      const response = await apiClient.assignManagers(params.id, selectedManagerIds);
      if (response.success) {
        toast.success('Manager access updated.');
        setShowManagersModal(false);
        setProperty(response.data);
      } else {
        toast.error(response.message || 'Unable to update managers.');
      }
    } catch (error) {
      console.error('Failed to update managers:', error);
      toast.error('Unable to update managers.');
    } finally {
      setSavingManagers(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2"><SkeletonCard className="h-96" /></div>
            <SkeletonCard className="h-64" />
          </div>
        </main>
      </AppShell>
    );
  }

  if (!property) {
    return (
      <AppShell>
        <main className="mx-auto max-w-[1500px] px-5 py-10 text-center">
          <p className="text-sm text-slate-500">Property not found.</p>
        </main>
      </AppShell>
    );
  }

  const cover = imageUrl(property.image_1);
  const occupied = property.units?.filter((u) => u.status === 'occupied').length || 0;
  const available = property.units?.filter((u) => u.status === 'available').length || 0;
  const maintenanceCount = property.units?.filter((u) => u.status === 'maintenance').length || 0;

  return (
    <AuthGuard roles={['administrator', 'owner', 'manager']}>
      <AppShell>
      <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10">
        <button type="button" onClick={() => router.push('/properties')} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-teal-700">
          <ArrowLeft size={16} />
          Back to properties
        </button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Hero */}
            <section className="card overflow-hidden">
              {cover ? (
                <img src={cover} alt={`${property.name} cover`} className="h-64 w-full object-cover" />
              ) : (
                <div className="property-card-banner flex h-64 items-center justify-center">
                  <Building2 size={48} strokeWidth={1.25} className="text-white/30" />
                </div>
              )}
              <div className="p-6 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{property.name}</h1>
                      <Badge status={property.status || 'active'} />
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                      <MapPin size={14} className="text-slate-400" />
                      {[property.address, property.city, property.state, property.postal_code].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setShowEditModal(true)} className="btn btn-secondary px-3 py-2 text-xs">
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button type="button" onClick={() => setShowDeleteDialog(true)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {property.description && (
                  <p className="mt-5 text-sm leading-6 text-slate-600">{property.description}</p>
                )}

                <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-4">
                  <div>
                    <dt className="flex items-center gap-1.5 text-xs text-slate-400"><Ruler size={13} /> Area</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900">{property.total_area ? `${property.total_area} sq ft` : '—'}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1.5 text-xs text-slate-400"><CalendarDays size={13} /> Year built</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900">{property.year_built || '—'}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1.5 text-xs text-slate-400"><Building2 size={13} /> Type</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900">{property.property_type || '—'}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1.5 text-xs text-slate-400"><LayoutGrid size={13} /> Units</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900">{property.units?.length || 0}</dd>
                  </div>
                </dl>
              </div>
            </section>

            {/* Units */}
            <section className="card p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="page-eyebrow">Unit inventory</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-950">Units</h2>
                </div>
                <button type="button" onClick={() => router.push(`/properties/${property.id}/units`)} className="btn btn-secondary px-3 py-2 text-xs">
                  Manage units
                  <ArrowRight size={14} />
                </button>
              </div>

              {property.units?.length ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {property.units.map((unit) => (
                    <div key={unit.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-teal-300">
                      <div>
                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <Home size={14} className="text-teal-600" />
                          {unit.unit_number}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{unit.type} · {unit.bedrooms} bed · {unit.bathrooms} bath</p>
                      </div>
                      <Badge status={unit.status || 'available'} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No units added yet.</p>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <section className="card p-6">
              <p className="page-eyebrow">Snapshot</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Quick stats</h2>
              <dl className="mt-5 space-y-3">
                <Stat row="Total units" value={property.units?.length || 0} />
                <Stat row="Occupied" value={occupied} tone="emerald" />
                <Stat row="Available" value={available} tone="blue" />
                <Stat row="In maintenance" value={maintenanceCount} tone="amber" />
              </dl>
            </section>

            <section className="card p-6">
              <p className="page-eyebrow">Accountability</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Ownership</h2>
              {property.owner ? (
                <div className="mt-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                    <UserIcon size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{property.owner.name}</p>
                    <p className="text-xs text-slate-500">{property.owner.email}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">No owner assigned.</p>
              )}

              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <ShieldCheck size={13} />
                    Assigned managers
                  </p>
                  {canManage && (
                    <button type="button" onClick={openManagersModal} className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 transition hover:text-teal-900">
                      <UserPlus size={13} />
                      Assign
                    </button>
                  )}
                </div>
                {property.managers?.length ? (
                  <ul className="mt-3 space-y-2">
                    {property.managers.map((manager) => (
                      <li key={manager.id} className="text-sm text-slate-700">
                        <span className="font-semibold">{manager.name}</span>
                        <span className="ml-2 text-xs text-slate-400">{manager.email}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">No managers assigned yet.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Edit modal */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit property"
        description="Update the property registration details."
        size="lg"
        footer={
          <>
            <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" form="property-edit-form" disabled={saving} className="btn btn-primary">
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </>
        }
      >
        <form id="property-edit-form" onSubmit={handleUpdate} className="space-y-5">
          <FormField label="Property name" required>
            <input className="field-input" required value={editFormData.name || ''} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} placeholder="e.g. Sunrise Residences" />
          </FormField>
          <FormField label="Address" required>
            <input className="field-input" required value={editFormData.address || ''} onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })} placeholder="e.g. Bole Road, Addis Ababa" />
          </FormField>
          <div className="grid gap-5 sm:grid-cols-3">
            <FormField label="City" required>
              <input className="field-input" required value={editFormData.city || ''} onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })} placeholder="Addis Ababa" />
            </FormField>
            <FormField label="State / Region" required>
              <input className="field-input" required value={editFormData.state || ''} onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })} placeholder="e.g. Bole" />
            </FormField>
            <FormField label="Postal code" required>
              <input className="field-input" required value={editFormData.postal_code || ''} onChange={(e) => setEditFormData({ ...editFormData, postal_code: e.target.value })} placeholder="1000" />
            </FormField>
          </div>
          <FormField label="Description">
            <textarea className="field-input resize-none" rows={3} value={editFormData.description || ''} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} placeholder="Describe the building, amenities, and location." />
          </FormField>
          <div className="grid gap-5 sm:grid-cols-3">
            <FormField label="Status">
              <select className="field-input" value={editFormData.status || 'active'} onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </FormField>
            <FormField label="Total area (sq ft)">
              <input type="number" className="field-input" value={editFormData.total_area || ''} onChange={(e) => setEditFormData({ ...editFormData, total_area: e.target.value })} placeholder="e.g. 2500" />
            </FormField>
            <FormField label="Year built">
              <input type="number" className="field-input" value={editFormData.year_built || ''} onChange={(e) => setEditFormData({ ...editFormData, year_built: e.target.value })} placeholder="e.g. 2015" />
            </FormField>
          </div>
          <div className="sm:col-span-3">
            <FormField label="Property type">
              <input className="field-input" value={editFormData.property_type || ''} onChange={(e) => setEditFormData({ ...editFormData, property_type: e.target.value })} placeholder="e.g. Apartment complex" />
            </FormField>
          </div>
          <PropertyImageFields files={imageFiles} setFiles={setImageFiles} existing={editFormData} />
        </form>
      </Modal>

      <Modal
        open={showManagersModal}
        onClose={() => setShowManagersModal(false)}
        title="Assign managers"
        description="Choose which manager accounts can open and run this property."
        size="lg"
        footer={
          <>
            <button type="button" onClick={() => setShowManagersModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" form="managers-form" disabled={savingManagers} className="btn btn-primary">
              {savingManagers ? 'Saving...' : 'Save access'}
            </button>
          </>
        }
      >
        <form id="managers-form" onSubmit={handleSaveManagers} className="space-y-4">
          {managersLoading ? (
            <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Loading manager accounts…</p>
          ) : managerUsers.length === 0 ? (
            <p className="rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-500">
              No manager accounts exist yet. Manager accounts are created by the administrator under
              <span className="font-semibold"> Admin &rarr; User access</span>.
            </p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {managerUsers.map((manager) => {
                const checked = selectedManagerIds.includes(manager.id);
                return (
                  <label
                    key={manager.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${checked ? 'border-teal-300 bg-teal-50/60' : 'border-slate-200 bg-white hover:border-teal-200'}`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 accent-teal-600"
                      checked={checked}
                      onChange={() =>
                        setSelectedManagerIds((prev) =>
                          prev.includes(manager.id)
                            ? prev.filter((id) => id !== manager.id)
                            : [...prev, manager.id]
                        )
                      }
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{manager.name}</p>
                      <p className="text-xs text-slate-400">{manager.email}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete property?"
        message="This will remove the property and its units from your workspace. This action cannot be undone."
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </AppShell>
    </AuthGuard>
  );
}

function Stat({ row, value, tone }) {
  const colors = {
    default: 'text-slate-900',
    emerald: 'text-emerald-600',
    blue: 'text-sky-600',
    amber: 'text-amber-600',
  };
  return (
    <div className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-slate-500">{row}</span>
      <span className={`text-sm font-semibold ${colors[tone] || colors.default}`}>{value}</span>
    </div>
  );
}