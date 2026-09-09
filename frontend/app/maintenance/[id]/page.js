'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import AppShell from '@/components/AppShell';
import AuthGuard from '@/components/AuthGuard';
import Badge from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { imageUrl } from '@/components/PropertyImageFields';
import {
  ArrowLeft,
  Wrench,
  MapPin,
  CalendarDays,
  CalendarClock,
  UserCheck,
  Banknote,
  CheckCircle,
} from 'lucide-react';

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '—';
  return `ETB ${Number(value).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MaintenanceDetailPage() {
  const { isAuthenticated, loading: authLoading, isTenant, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photoOpen, setPhotoOpen] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let active = true;

    const load = async () => {
      try {
        const response = await apiClient.getMaintenanceRequest(params.id);
        if (!active) return;
        if (!response.success) {
          setError(response.message || 'Unable to load this request.');
        } else if (isTenant && response.data?.tenant_id !== user?.tenant?.id) {
          setError('Unable to load this request.');
        } else {
          setRequest(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch request:', err);
        if (active) setError('Unable to load this request.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [isAuthenticated, isTenant, user?.tenant?.id, params.id]);

  if (authLoading || loading) {
    return (
      <AppShell>
        <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10">
          <SkeletonCard className="h-72" />
        </main>
      </AppShell>
    );
  }

  if (error || !request) {
    return (
      <AppShell>
        <main className="mx-auto max-w-[1500px] px-5 py-10">
          <div className="card p-8 text-center">
            <p className="text-sm font-semibold text-red-700">{error || 'Request not found.'}</p>
            <button type="button" onClick={() => router.push('/maintenance')} className="btn btn-secondary mt-5">Back to maintenance</button>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AuthGuard>
      <AppShell>
      <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10">
        <button type="button" onClick={() => router.push('/maintenance')} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-teal-700">
          <ArrowLeft size={16} />
          Back to maintenance
        </button>

        {/* Hero */}
        <section className="dashboard-hero rounded-2xl p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium text-teal-300">
                <Wrench size={15} />
                Maintenance request
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{request.title}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-300">
                <span className="flex items-center gap-1.5"><MapPin size={14} /> {request.property?.name} · {request.unit?.unit_number}</span>
                <span className="flex items-center gap-1.5"><CalendarDays size={14} /> Requested {formatDate(request.requested_date)}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Badge status={request.priority} />
              <Badge status={request.status} className="bg-white/90 text-slate-800" />
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Main */}
          <div className="space-y-6 lg:col-span-2">
            <section className="card p-6 sm:p-7">
              <p className="page-eyebrow">Issue</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Description</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{request.description}</p>
              <dl className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                {!isTenant && <Field icon={UserCheck} label="Assigned to" value={request.assigned_to || 'Not yet assigned'} />}
                {!isTenant && <Field icon={Banknote} label="Actual cost" value={formatCurrency(request.actual_cost)} />}
                <Field icon={CalendarClock} label="Scheduled" value={formatDate(request.scheduled_date)} />
                <Field icon={CheckCircle} label="Completed" value={formatDate(request.completed_date)} />
              </dl>
              {request.notes && (
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{request.notes}</p>
                </div>
              )}
            </section>

            {request.photos?.length ? (
              <section className="card p-6 sm:p-7">
                <p className="page-eyebrow">Evidence</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">Photos</h2>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {request.photos.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setPhotoOpen(imageUrl(photo.file_path))}
                      className="group relative block h-32 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                    >
                      <img src={imageUrl(photo.file_path)} alt={photo.original_name || 'Maintenance photo'} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <section className="card p-6">
              <p className="page-eyebrow">Requester</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Reported by</h2>
              {request.tenant ? (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-slate-900">{request.tenant.user?.name || 'Tenant'}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{request.tenant.user?.email || ''}</p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">Reported by the property team.</p>
              )}
            </section>

            <section className="card p-6">
              <p className="page-eyebrow">Context</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Details</h2>
              <dl className="mt-4 space-y-3">
                <DetailRow label="Category" value={String(request.category || 'other')} />
                <DetailRow label="Priority" value={String(request.priority || 'medium')} />
                <DetailRow label="Status" value={String(request.status || 'pending')} />
              </dl>
            </section>
          </div>
        </div>

        {/* Lightbox */}
        {photoOpen && (
          <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-6 backdrop-blur-sm" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setPhotoOpen(null); }}>
            <img src={photoOpen} alt="Maintenance photo" className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl" />
            <button type="button" onClick={() => setPhotoOpen(null)} className="absolute right-5 top-5 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20" aria-label="Close photo">✕</button>
          </div>
        )}
      </main>
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
      <dd className="mt-1 text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-semibold capitalize text-slate-900">{value}</dd>
    </div>
  );
}