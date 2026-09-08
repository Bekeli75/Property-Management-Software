'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Redirects users away from pages they should not see.
 *
 * - Unauthenticated visitors are sent to /login.
 * - Logged-in users whose role is not in `roles` are sent to /dashboard.
 *   When `roles` is omitted, the page is open to every authenticated user.
 *
 * Renders the provided `loading` fallback while auth is resolving so there
 * is no flash of protected content.
 */
export default function AuthGuard({ children, roles, loading }) {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const allowed = roles && roles.length > 0 ? roles.includes(user?.role) : true;

  useEffect(() => {
    if (authLoading) return undefined;

    if (!isAuthenticated) {
      router.replace('/login');
      return undefined;
    }

    if (!allowed) {
      router.replace('/dashboard');
    }

    return undefined;
  }, [authLoading, isAuthenticated, allowed, router]);

  if (authLoading || !isAuthenticated) {
    return loading || defaultLoading;
  }

  if (!allowed) return loading || defaultLoading;

  return children;
}

const defaultLoading = (
  <div className="flex min-h-screen items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-teal-600" />
      <p className="text-sm font-medium text-slate-500">Checking your access…</p>
    </div>
  </div>
);