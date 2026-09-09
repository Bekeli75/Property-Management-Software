'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.message || 'Login failed');
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-dvh items-stretch justify-center bg-slate-50 px-4 py-8 sm:items-center sm:py-10">
      <div className="flex w-full max-w-md flex-col justify-center">
        <div className="card p-6 sm:p-10">
          <div className="flex justify-center">
            <Logo size="md" markOnly />
          </div>
          <p className="mt-6 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">Welcome back</p>
          <h1 className="mt-2 text-center text-2xl font-semibold tracking-tight text-slate-950">Sign in</h1>
          <p className="mt-2 text-center text-sm text-slate-500">Access your properties, tenants, and payments.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>
            )}

            <div>
              <label htmlFor="email" className="field-label">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="field-input mt-1.5 w-full"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="field-label">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="field-input mt-1.5 w-full"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-teal-700 hover:text-teal-900">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}