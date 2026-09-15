'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const validateEmail = (value) => {
    if (!value) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
    return null;
  };

  const validatePassword = (value) => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    return null;
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ email: true, password: true });

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setError(emailError || passwordError);
      return;
    }

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
    <main id="main" className="flex flex-1 items-stretch justify-center px-4 py-8 outline-none sm:items-center sm:py-10">
      <div className="flex w-full max-w-md flex-col justify-center">
        <div className="card-premium p-6 sm:p-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex justify-center">
              <Logo size="md" markOnly />
            </div>
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              className="btn btn-ghost p-2"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">Welcome back</p>
          <h1 className="mt-2 text-center text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Sign in</h1>
          <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">Access your properties, tenants, and payments.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm font-medium text-red-700 dark:text-red-300" role="alert">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
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
                onBlur={() => handleBlur('email')}
                className={`field-input mt-1.5 w-full ${touched.email && validateEmail(email) ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                placeholder="you@example.com"
                aria-invalid={touched.email && validateEmail(email) ? 'true' : 'false'}
                aria-describedby={touched.email && validateEmail(email) ? 'email-error' : undefined}
              />
              {touched.email && validateEmail(email) && (
                <p id="email-error" className="mt-1.5 flex items-center gap-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{validateEmail(email)}</span>
                </p>
              )}
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
                onBlur={() => handleBlur('password')}
                className={`field-input mt-1.5 w-full ${touched.password && validatePassword(password) ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                placeholder="••••••••"
                aria-invalid={touched.password && validatePassword(password) ? 'true' : 'false'}
                aria-describedby={touched.password && validatePassword(password) ? 'password-error' : undefined}
              />
              {touched.password && validatePassword(password) && (
                <p id="password-error" className="mt-1.5 flex items-center gap-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{validatePassword(password)}</span>
                </p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-300">Register here</Link>
          </p>
        </div>
      </div>
    </main>
  );
}