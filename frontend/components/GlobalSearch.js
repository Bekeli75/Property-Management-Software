'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const staffGroups = [
  ['properties', 'Properties'],
  ['units', 'Units'],
  ['tenants', 'Tenants'],
  ['leases', 'Leases'],
];

const tenantGroups = [
  ['leases', 'My records'],
];

export default function GlobalSearch() {
  const { user } = useAuth();
  const router = useRouter();
  const containerRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const groups = user?.role === 'tenant' ? tenantGroups : staffGroups;
  const placeholder = user?.role === 'tenant'
    ? 'Search your lease records...'
    : 'Search properties, units, tenants...';

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      return undefined;
    }

    let active = true;
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const response = await apiClient.search(trimmedQuery);
        if (active) {
          setResults(response.success ? response.data : null);
          if (!response.success) setError(response.message || 'Search is unavailable.');
        }
      } catch {
        if (active) setError('Search is unavailable right now.');
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setResults(null);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const hasResults = results && groups.some(([key]) => results[key]?.length);

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <label htmlFor="global-search" className="sr-only">Search your workspace</label>
      <input
        id="global-search"
        value={query}
        onChange={(event) => {
          const nextQuery = event.target.value;
          setQuery(nextQuery);
          if (nextQuery.trim().length < 2) {
            setResults(null);
            setLoading(false);
            setError('');
          }
        }}
        onFocus={() => { if (query.trim().length >= 2) setResults(results); }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setQuery('');
            setResults(null);
          }
        }}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
      />
      {query.trim().length >= 2 && (loading || error || results) && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {loading && <p className="px-4 py-3 text-sm text-slate-500">Searching...</p>}
          {!loading && error && <p className="px-4 py-3 text-sm text-red-700">{error}</p>}
          {!loading && !error && !hasResults && <p className="px-4 py-3 text-sm text-slate-500">No matching records.</p>}
          {!loading && !error && hasResults && groups.map(([key, label]) => results[key]?.length ? (
            <section key={key} className="border-b border-slate-100 p-2 last:border-0">
              <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
              {results[key].map((item) => (
                <button
                  key={`${key}-${item.id}`}
                  onClick={() => {
                    router.push(item.path);
                    setQuery('');
                    setResults(null);
                  }}
                  className="block w-full rounded-lg px-2 py-2 text-left hover:bg-slate-50"
                >
                  <span className="block truncate text-sm font-semibold text-slate-900">{item.label}</span>
                  <span className="block truncate text-xs capitalize text-slate-500">{item.detail || 'Open record'}</span>
                </button>
              ))}
            </section>
          ) : null)}
        </div>
      )}
    </div>
  );
}
