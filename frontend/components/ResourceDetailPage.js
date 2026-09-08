'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import AppShell from '@/components/AppShell';
import AuthGuard from '@/components/AuthGuard';

const resourceConfig = {
  unit: {
    label: 'Unit',
    collectionPath: '/properties',
    load: (id) => apiClient.getUnit(id),
    groups: (item) => [
      {
        title: 'Unit details',
        fields: [
          ['Property', item.property?.name],
          ['Unit number', item.unit_number],
          ['Type', item.type],
          ['Floor', item.floor],
          ['Status', item.status],
        ],
      },
      {
        title: 'Rental profile',
        fields: [
          ['Bedrooms', item.bedrooms],
          ['Bathrooms', item.bathrooms],
          ['Area', item.area ? `${item.area} sq ft` : null],
          ['Base rent', formatCurrency(item.base_rent)],
        ],
      },
    ],
  },
};

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return null;
  return `ETB ${Number(value).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function displayValue(value) {
  if (value === null || value === undefined || value === '') return 'Not provided';
  return String(value).replaceAll('_', ' ');
}

export default function ResourceDetailPage({ resourceType, roles }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const config = resourceConfig[resourceType];

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !config || !params.id) return undefined;

    let active = true;
    config.load(params.id)
      .then((response) => {
        if (!active) return;
        if (response.success) {
          setItem(response.data);
        } else {
          setError(response.message || 'Unable to load this record.');
        }
      })
      .catch(() => {
        if (active) setError('Unable to load this record. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [config, isAuthenticated, params.id]);

  if (!config) return null;

  if (authLoading || loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="text-sm text-slate-500">Loading {config.label.toLowerCase()}...</p></main>;
  }

  if (error || !item) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-red-700">{error || `${config.label} not found.`}</p>
          <button onClick={() => router.push(config.collectionPath)} className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Back to {config.label.toLowerCase()}s</button>
        </div>
      </main>
    );
  }

  const title = item.name || item.title || item.reference_number || item.unit_number || `${config.label} #${item.id}`;
  const description = item.description || item.notes || 'Review the record details and related activity.';

  return (
    <AuthGuard roles={roles}>
      <AppShell>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <button onClick={() => router.push(config.collectionPath)} className="mb-5 text-sm font-semibold text-teal-700 hover:text-teal-900">Back to {config.label.toLowerCase()}s</button>
        <section className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">{config.label}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{description}</p>
        </section>
        <section className="mt-6 grid gap-6 md:grid-cols-2">
          {config.groups(item).map((group) => (
            <div key={group.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">{group.title}</h2>
              <dl className="mt-5 divide-y divide-slate-100">
                {group.fields.map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-5 py-3 first:pt-0 last:pb-0">
                    <dt className="text-sm text-slate-500">{label}</dt>
                    <dd className="text-right text-sm font-semibold capitalize text-slate-900">{displayValue(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </section>
      </main>
      </AppShell>
    </AuthGuard>
  );
}
