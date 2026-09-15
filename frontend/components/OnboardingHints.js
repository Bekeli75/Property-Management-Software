'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Lightbulb } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'propentra_onboarding_done';

const tips = [
  {
    title: 'Welcome to Propentra',
    body: 'Everything you manage lives here: properties, tenants, leases, payments, maintenance, and reports.',
  },
  {
    title: 'Quick navigation',
    body: 'Use the sidebar to move between sections and the search box up top to jump straight to a property, tenant, or lease.',
  },
  {
    title: 'Notifications & messages',
    body: 'Check the bell for payment and maintenance alerts, and keep in touch with your tenants from the discussion page.',
  },
  {
    title: 'Stay on top of finances',
    body: 'The dashboard tracks rent collected, occupancy, and overdue balances so nothing slips through.',
  },
];

function shouldShowFirstRun() {
  if (typeof window === 'undefined') return false;
  try {
    return !localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    return false;
  }
}

export default function OnboardingHints() {
  const { isAuthenticated } = useAuth();
  const [show, setShow] = useState(shouldShowFirstRun());
  const [index, setIndex] = useState(0);

  const dismiss = useCallback(() => {
    setShow(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
    }
  }, []);

  const nextTip = useCallback(() => {
    if (index >= tips.length - 1) {
      dismiss();
    } else {
      setIndex((current) => current + 1);
    }
  }, [index, dismiss]);

  useEffect(() => {
    if (!show || !isAuthenticated) return undefined;
    const timer = setTimeout(nextTip, 7000);
    return () => clearTimeout(timer);
  }, [show, isAuthenticated, index, nextTip]);

  if (!show || !isAuthenticated) return null;

  const tip = tips[index];

  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-[70] w-[calc(100vw-2rem)] max-w-sm">
      <div className="card-premium p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-300">
            <Lightbulb size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
              Tip {index + 1} of {tips.length}
            </p>
            <h3 className="mt-1 text-base font-semibold text-slate-950 dark:text-white">{tip.title}</h3>
            <p className="mt-1.5 text-sm leading-5 text-slate-500 dark:text-slate-400">{tip.body}</p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            aria-label="Close tips"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1.5">
            {tips.map((_, dotIndex) => (
              <span
                key={dotIndex}
                className={`h-1.5 rounded-full transition-all ${
                  dotIndex === index ? 'w-5 bg-teal-500' : 'w-1.5 bg-slate-300 dark:bg-slate-600'
                }`}
              />
            ))}
          </div>
          <button type="button" onClick={nextTip} className="text-sm font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-300">
            {index === tips.length - 1 ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}