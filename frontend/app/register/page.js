'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    const result = await register(formData);

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.message || 'Registration failed');
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
          <p className="mt-6 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">Tenant registration</p>
          <h1 className="mt-2 text-center text-2xl font-semibold tracking-tight text-slate-950">Create your account</h1>
          <p className="mt-2 text-center text-sm text-slate-500">Register to access your lease, pay rent, and request maintenance.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>
            )}

            <div>
              <label htmlFor="name" className="field-label">Full name</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="field-input mt-1.5 w-full"
                placeholder="e.g. Sara Ahmed"
              />
            </div>

            <div>
              <label htmlFor="email" className="field-label">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="field-input mt-1.5 w-full"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="field-label">Phone number <span className="font-normal text-slate-400">(optional)</span></label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={formData.phone}
                onChange={handleChange}
                className="field-input mt-1.5 w-full"
                placeholder="+251 911 234 567"
              />
            </div>

            <div>
              <label htmlFor="password" className="field-label">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="field-input mt-1.5 w-full"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label htmlFor="password_confirmation" className="field-label">Confirm password</label>
              <input
                id="password_confirmation"
                name="password_confirmation"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password_confirmation}
                onChange={handleChange}
                className="field-input mt-1.5 w-full"
                placeholder="Repeat your password"
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-teal-700 hover:text-teal-900">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}