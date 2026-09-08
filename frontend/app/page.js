'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="flex justify-center">
          <Logo size="lg" markOnly className="animate-pulse" />
        </div>
        <div className="mx-auto mt-6 h-10 w-10 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
        <p className="mt-4 text-sm font-medium text-slate-500">Preparing your workspace…</p>
      </div>
    </div>
  );
}