'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, AlertCircle, CheckCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

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
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    password: false,
    password_confirmation: false,
  });
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const validateName = (value) => {
    if (!value.trim()) return 'Full name is required';
    if (value.trim().length < 2) return 'Name must be at least 2 characters';
    return null;
  };

  const validateEmail = (value) => {
    if (!value) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
    return null;
  };

  const validatePhone = (value) => {
    if (value && !/^[\+]?[\d\s\-\(\)]{7,}$/.test(value)) return 'Please enter a valid phone number';
    return null;
  };

  const validatePassword = (value) => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
    return null;
  };

  const validateConfirmPassword = (value, password) => {
    if (!value) return 'Please confirm your password';
    if (value !== password) return 'Passwords do not match';
    return null;
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({
      name: true,
      email: true,
      phone: true,
      password: true,
      password_confirmation: true,
    });

    const errors = {
      name: validateName(formData.name),
      email: validateEmail(formData.email),
      phone: validatePhone(formData.phone),
      password: validatePassword(formData.password),
      password_confirmation: validateConfirmPassword(formData.password_confirmation, formData.password),
    };

    const firstError = Object.values(errors).find(e => e !== null);
    if (firstError) {
      setError(firstError);
      return;
    }

    setError('');
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
    <div className="flex min-h-dvh items-stretch justify-center px-4 py-8 sm:items-center sm:py-10">
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
          <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">Tenant registration</p>
          <h1 className="mt-2 text-center text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Create your account</h1>
          <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">Register to access your lease, pay rent, and request maintenance.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm font-medium text-red-700 dark:text-red-300" role="alert">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
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
                onBlur={() => handleBlur('name')}
                className={`field-input mt-1.5 w-full ${touched.name && validateName(formData.name) ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                placeholder="e.g. Sara Ahmed"
                aria-invalid={touched.name && validateName(formData.name) ? 'true' : 'false'}
                aria-describedby={touched.name && validateName(formData.name) ? 'name-error' : undefined}
              />
              {touched.name && validateName(formData.name) && (
                <p id="name-error" className="mt-1.5 flex items-center gap-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{validateName(formData.name)}</span>
                </p>
              )}
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
                onBlur={() => handleBlur('email')}
                className={`field-input mt-1.5 w-full ${touched.email && validateEmail(formData.email) ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                placeholder="you@example.com"
                aria-invalid={touched.email && validateEmail(formData.email) ? 'true' : 'false'}
                aria-describedby={touched.email && validateEmail(formData.email) ? 'email-error' : undefined}
              />
              {touched.email && validateEmail(formData.email) && (
                <p id="email-error" className="mt-1.5 flex items-center gap-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{validateEmail(formData.email)}</span>
                </p>
              )}
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
                onBlur={() => handleBlur('phone')}
                className={`field-input mt-1.5 w-full ${touched.phone && validatePhone(formData.phone) ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                placeholder="+251 911 234 567"
                aria-invalid={touched.phone && validatePhone(formData.phone) ? 'true' : 'false'}
                aria-describedby={touched.phone && validatePhone(formData.phone) ? 'phone-error' : undefined}
              />
              {touched.phone && validatePhone(formData.phone) && (
                <p id="phone-error" className="mt-1.5 flex items-center gap-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{validatePhone(formData.phone)}</span>
                </p>
              )}
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
                onBlur={() => handleBlur('password')}
                className={`field-input mt-1.5 w-full ${touched.password && validatePassword(formData.password) ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                placeholder="At least 8 characters"
                aria-invalid={touched.password && validatePassword(formData.password) ? 'true' : 'false'}
                aria-describedby={touched.password && validatePassword(formData.password) ? 'password-error' : 'password-hint'}
              />
              <p id="password-hint" className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>At least 8 characters</span>
                <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>1 uppercase letter</span>
                <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>1 lowercase letter</span>
                <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>1 number</span>
              </p>
              {touched.password && validatePassword(formData.password) && (
                <p id="password-error" className="mt-1.5 flex items-center gap-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{validatePassword(formData.password)}</span>
                </p>
              )}
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
                onBlur={() => handleBlur('password_confirmation')}
                className={`field-input mt-1.5 w-full ${touched.password_confirmation && validateConfirmPassword(formData.password_confirmation, formData.password) ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                placeholder="Repeat your password"
                aria-invalid={touched.password_confirmation && validateConfirmPassword(formData.password_confirmation, formData.password) ? 'true' : 'false'}
                aria-describedby={touched.password_confirmation && validateConfirmPassword(formData.password_confirmation, formData.password) ? 'confirm-error' : undefined}
              />
              {touched.password_confirmation && validateConfirmPassword(formData.password_confirmation, formData.password) && (
                <p id="confirm-error" className="mt-1.5 flex items-center gap-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{validateConfirmPassword(formData.password_confirmation, formData.password)}</span>
                </p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-300">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}