'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter, useParams } from 'next/navigation';
import apiClient from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';
import AppShell from '@/components/AppShell';
import AuthGuard from '@/components/AuthGuard';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import FormField from '@/components/ui/FormField';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import {
  Plus,
  LayoutGrid,
  Ruler,
  BedDouble,
  Bath,
  Banknote,
  Trash2,
  ArrowRight,
} from 'lucide-react';

const emptyForm = {
  property_id: '',
  unit_number: '',
  floor: '',
  type: 'apartment',
  bedrooms: 1,
  bathrooms: 1,
  area: '',
  base_rent: '',
  amenities: '',
  description: '',
};

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

export default function PropertyUnitsPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const [units, setUnits] = useState([]);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({ ...emptyForm, property_id: params.id });

  const fetchUnits = useCallback(async () => {
    try {
      const [unitsResponse, propertyResponse] = await Promise.all([
        apiClient.getUnitsByProperty(params.id),
        apiClient.getProperty(params.id),
      ]);

      if (unitsResponse.success) setUnits(unitsResponse.data);
      if (propertyResponse.success) setProperty(propertyResponse.data);
    } catch (error) {
      console.error('Failed to fetch units:', error);
      toast.error('Unable to load units.');
    } finally {
      setLoading(false);
    }
  }, [params.id, toast]);

  useEffect(() => {
    void Promise.resolve().then(fetchUnits);
  }, [fetchUnits]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    const numericFields = ['property_id', 'bedrooms', 'bathrooms', 'area', 'base_rent'];
    const nextValue = numericFields.includes(name) && name !== 'property_id' ? (value === '' ? '' : Number(value)) : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await apiClient.createUnit(formData);
      if (response.success) {
        toast.success('Unit created.');
        setShowModal(false);
        setFormData({ ...emptyForm, property_id: params.id });
        fetchUnits();
      } else {
        toast.error(response.message || 'Unable to create the unit.');
      }
    } catch (error) {
      console.error('Failed to create unit:', error);
      toast.error('Unable to create the unit.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await apiClient.deleteUnit(id);
      toast.success('Unit deleted.');
      fetchUnits();
    } catch (error) {
      console.error('Failed to delete unit:', error);
      toast.error('Unable to delete the unit.');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10">
          <PageHeader
            eyebrow="Property"
            title={property?.name ? `${property.name} · Units` : 'Units'}
            description="Manage the units in this property."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </main>
      </AppShell>
    );
  }

  const statIcon = 'text-teal-600';

  return (
    <AuthGuard roles={['administrator', 'owner', 'manager']}>
      <AppShell>
        <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10">
          <PageHeader
            eyebrow="Property"
            title={property?.name ? `${property.name} · Units (${units.length})` : `Units (${units.length})`}
            description="Keep floor plans, rent amounts, and unit details organized."
            actions={
              <button type="button" onClick={() => setShowModal(true)} className="btn btn-primary">
                <Plus size={16} />
                Add unit
              </button>
            }
          />

          {units.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                icon={LayoutGrid}
                title="No units yet"
                description="Add your first unit to start linking tenants and generating rent."
                actionLabel="Add your first unit"
                onAction={() => setShowModal(true)}
              />
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {units.map((unit) => (
                <div key={unit.id} className="card flex flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                        <LayoutGrid size={20} strokeWidth={1.75} />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">Unit {unit.unit_number}</h3>
                        <p className="text-sm capitalize text-slate-500">{unit.type}</p>
                      </div>
                    </div>
                    <Badge variant={unit.status === 'maintenance' ? 'amber' : undefined} status={unit.status}>
                      {capitalize(unit.status)}
                    </Badge>
                  </div>

                  <dl className="mt-5 grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Ruler size={15} className={statIcon} />
                      <span className="font-medium">Floor:</span>
                      <span>{unit.floor || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <BedDouble size={15} className={statIcon} />
                      <span className="font-medium">Beds:</span>
                      <span>{unit.bedrooms}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Bath size={15} className={statIcon} />
                      <span className="font-medium">Baths:</span>
                      <span>{unit.bathrooms}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Banknote size={15} className={statIcon} />
                      <span className="font-medium">Rent:</span>
                      <span>ETB {Number(unit.base_rent || 0).toLocaleString()}</span>
                    </div>
                    {unit.area && (
                      <div className="col-span-2 flex items-center gap-2 text-slate-600">
                        <Ruler size={15} className={statIcon} />
                        <span className="font-medium">Area:</span>
                        <span>{unit.area} sq ft</span>
                      </div>
                    )}
                  </dl>

                  <div className="mt-5 flex flex-1 items-end gap-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/units/${unit.id}`)}
                      className="btn btn-secondary flex-1"
                    >
                      View details
                      <ArrowRight size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(unit.id)}
                      className="btn btn-ghost text-red-600 hover:bg-red-50"
                      aria-label="Delete unit"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title="Add new unit"
          description={`Create a unit within ${property?.name || 'this property'}.`}
          size="lg"
          footer={
            <>
              <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" form="unit-form" disabled={saving} className="btn btn-primary">
                {saving ? 'Adding…' : 'Add unit'}
              </button>
            </>
          }
        >
          <form id="unit-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Unit number" required>
                <input
                  name="unit_number"
                  className="field-input"
                  required
                  value={formData.unit_number}
                  onChange={handleChange}
                  placeholder="e.g. 101, A1"
                />
              </FormField>
              <FormField label="Floor">
                <input
                  name="floor"
                  className="field-input"
                  value={formData.floor}
                  onChange={handleChange}
                  placeholder="e.g. 1st, Ground"
                />
              </FormField>
            </div>

            <FormField label="Unit type" required>
              <select name="type" className="field-input" required value={formData.type} onChange={handleChange}>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="commercial">Commercial</option>
                <option value="office">Office</option>
                <option value="studio">Studio</option>
                <option value="other">Other</option>
              </select>
            </FormField>

            <div className="grid gap-5 sm:grid-cols-3">
              <FormField label="Bedrooms" required>
                <input name="bedrooms" type="number" min="0" className="field-input" required value={formData.bedrooms} onChange={handleChange} />
              </FormField>
              <FormField label="Bathrooms" required>
                <input name="bathrooms" type="number" min="0" className="field-input" required value={formData.bathrooms} onChange={handleChange} />
              </FormField>
              <FormField label="Area (sq ft)">
                <input name="area" type="number" min="0" className="field-input" value={formData.area} onChange={handleChange} placeholder="e.g. 75" />
              </FormField>
            </div>

            <FormField label="Base rent (ETB)" required>
              <input name="base_rent" type="number" min="0" step="0.01" className="field-input" required value={formData.base_rent} onChange={handleChange} placeholder="e.g. 12000" />
            </FormField>

            <FormField label="Amenities">
              <textarea name="amenities" rows={2} className="field-input resize-none" value={formData.amenities} onChange={handleChange} placeholder="e.g. Parking, balcony, water heater" />
            </FormField>

            <FormField label="Description">
              <textarea name="description" rows={2} className="field-input resize-none" value={formData.description} onChange={handleChange} placeholder="Additional details about this unit" />
            </FormField>
          </form>
        </Modal>

        <ConfirmDialog
          open={deleteId !== null}
          title="Delete unit?"
          message="This will remove the unit from the property. This action cannot be undone."
          onCancel={() => setDeleteId(null)}
          onConfirm={() => handleDelete(deleteId)}
          loading={deleting}
        />
      </AppShell>
    </AuthGuard>
  );
}