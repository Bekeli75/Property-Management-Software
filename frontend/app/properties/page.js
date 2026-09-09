'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import apiClient from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';
import PropertyImageFields, { imageUrl } from '@/components/PropertyImageFields';
import AppShell from '@/components/AppShell';
import AuthGuard from '@/components/AuthGuard';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import FormField from '@/components/ui/FormField';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Building2, Plus, Trash2, MapPin, Layers3, Ruler, CalendarDays, ArrowRight } from 'lucide-react';

const emptyForm = {
  name: '',
  address: '',
  city: '',
  state: '',
  postal_code: '',
  description: '',
  total_area: '',
  year_built: '',
  property_type: '',
};

export default function PropertiesPage() {
  const { isAuthenticated, isOwner, isManager, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [imageFiles, setImageFiles] = useState({});
  const [formData, setFormData] = useState(emptyForm);

  const canManage = isOwner || isAdmin;

  const fetchProperties = useCallback(async () => {
    try {
      const response = await apiClient.getProperties();
      if (response.success) setProperties(response.data);
    } catch (error) {
      console.error('Failed to fetch properties:', error);
      toast.error('Unable to load your properties.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (authLoading) return undefined;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isOwner && !isManager && !isAdmin) {
      router.push('/dashboard');
      return;
    }
    const load = async () => { await fetchProperties(); };
    load();
  }, [authLoading, isAuthenticated, isOwner, isManager, isAdmin, router, fetchProperties]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => { if (value !== '') payload.append(key, value); });
      Object.entries(imageFiles).forEach(([key, image]) => {
        if (image?.file) payload.append(key, image.file);
      });
      const response = await apiClient.createProperty(payload);
      if (response.success) {
        toast.success('Property created successfully.');
        setShowModal(false);
        setFormData(emptyForm);
        setImageFiles({});
        fetchProperties();
      } else {
        toast.error(response.message || 'Unable to create the property.');
      }
    } catch (error) {
      console.error('Failed to create property:', error);
      toast.error('Unable to create the property.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await apiClient.deleteProperty(id);
      toast.success('Property deleted.');
      fetchProperties();
    } catch (error) {
      console.error('Failed to delete property:', error);
      toast.error('Unable to delete the property.');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10">
          <PageHeader eyebrow="Management" title="Properties" description="Keep property details, occupancy, and day-to-day work organized." />
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
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
          eyebrow="Management"
          title={`Properties (${properties.length})`}
          description="Keep property details, occupancy, and day-to-day work organized."
          actions={
            canManage && (
              <button type="button" onClick={() => setShowModal(true)} className="btn btn-primary">
                <Plus size={16} />
                Add property
              </button>
            )
          }
        />

        {properties.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={Building2}
              title="No properties yet"
              description="Add your first property to start tracking units, leases, and maintenance."
              actionLabel={canManage ? 'Add your first property' : undefined}
              onAction={canManage ? () => setShowModal(true) : undefined}
            />
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => {
              const cover = imageUrl(property.image_1);
              return (
                <article key={property.id} className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
                  <button
                    type="button"
                    onClick={() => router.push(`/properties/${property.id}`)}
                    className="relative block h-40 w-full overflow-hidden text-left"
                    aria-label={`View ${property.name}`}
                  >
                    {cover ? (
                      <img src={cover} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="property-card-banner h-full w-full">
                        <div className="flex h-full flex-col justify-between p-4">
                          <span className="w-fit rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-700">
                            {property.status || 'active'}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80">
                            <Building2 size={14} />
                            {property.property_type || 'Property'}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="absolute left-3 top-3">
                      <Badge variant="teal" className="bg-white/90 text-teal-800 shadow-sm">{(property.status || 'active').replace('_', ' ')}</Badge>
                    </div>
                  </button>

                  <div className="p-5">
                    <h3 className="truncate text-base font-semibold text-slate-950 group-hover:text-teal-700">{property.name}</h3>
                    <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-500">
                      <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" />
                      <span className="line-clamp-2">{[property.address, property.city, property.state].filter(Boolean).join(', ') || 'Location not added'}</span>
                    </p>

                    <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs">
                      <div>
                        <dt className="flex items-center gap-1 text-slate-400"><Layers3 size={12} /> Units</dt>
                        <dd className="mt-0.5 text-sm font-semibold text-slate-900">{property.units?.length || 0}</dd>
                      </div>
                      <div>
                        <dt className="flex items-center gap-1 text-slate-400"><Ruler size={12} /> Area</dt>
                        <dd className="mt-0.5 text-sm font-semibold text-slate-900">{property.total_area ? `${property.total_area} sq ft` : '—'}</dd>
                      </div>
                      {property.year_built && (
                        <div>
                          <dt className="flex items-center gap-1 text-slate-400"><CalendarDays size={12} /> Built</dt>
                          <dd className="mt-0.5 text-sm font-semibold text-slate-900">{property.year_built}</dd>
                        </div>
                      )}
                    </dl>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/properties/${property.id}`)}
                        className="btn btn-secondary flex-1 py-2 text-xs"
                      >
                        View details
                        <ArrowRight size={14} />
                      </button>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => setDeleteId(property.id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                          aria-label={`Delete ${property.name}`}
                        >
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

      {/* Add property modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add new property"
        description="Registration details for the property."
        size="lg"
        footer={
          <>
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" form="property-form" disabled={saving} className="btn btn-primary">
              {saving ? 'Creating...' : 'Create property'}
            </button>
          </>
        }
      >
        <form id="property-form" onSubmit={handleSubmit} className="space-y-5">
          <FormField label="Property name" required>
            <input
              className="field-input"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Sunrise Residences"
            />
          </FormField>

          <FormField label="Address" required>
            <input
              className="field-input"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Bole Road, Addis Ababa"
            />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-3">
            <FormField label="City" required>
              <input className="field-input" required value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Addis Ababa" />
            </FormField>
            <FormField label="State / Region" required>
              <input className="field-input" required value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} placeholder="e.g. Bole" />
            </FormField>
            <FormField label="Postal code" required>
              <input className="field-input" required value={formData.postal_code} onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })} placeholder="1000" />
            </FormField>
          </div>

          <FormField label="Description" hint="A short overview that helps tenants and your team understand the property.">
            <textarea
              className="field-input resize-none"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the building, amenities, and location."
            />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-3">
            <FormField label="Total area (sq ft)">
              <input type="number" className="field-input" value={formData.total_area} onChange={(e) => setFormData({ ...formData, total_area: e.target.value })} placeholder="e.g. 2500" />
            </FormField>
            <FormField label="Year built">
              <input type="number" className="field-input" value={formData.year_built} onChange={(e) => setFormData({ ...formData, year_built: e.target.value })} placeholder="e.g. 2015" />
            </FormField>
            <FormField label="Property type">
              <input className="field-input" value={formData.property_type} onChange={(e) => setFormData({ ...formData, property_type: e.target.value })} placeholder="e.g. Apartment complex" />
            </FormField>
          </div>

          <PropertyImageFields files={imageFiles} setFiles={setImageFiles} />
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete property?"
        message="This will remove the property from your workspace. This action cannot be undone."
        onCancel={() => setDeleteId(null)}
        onConfirm={() => handleDelete(deleteId)}
        loading={deleting}
      />
    </AppShell>
    </AuthGuard>
  );
}