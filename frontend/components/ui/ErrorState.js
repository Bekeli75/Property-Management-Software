'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorState({ message = 'Something went wrong.', onRetry, className = '' }) {
  return (
    <div className={`card flex flex-col items-center justify-center px-8 py-14 text-center ${className}`} role="alert">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <AlertTriangle size={28} strokeWidth={1.75} />
      </div>
      <h3 className="mt-5 text-base font-semibold text-slate-900">Unable to load data</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-secondary mt-6">
          <RefreshCw size={16} />
          Try again
        </button>
      )}
    </div>
  );
}
