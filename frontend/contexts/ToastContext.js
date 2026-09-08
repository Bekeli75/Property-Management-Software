'use client';

import { createContext, useContext, useCallback, useState } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, message, duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, type, message }]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
    return id;
  }, [removeToast]);

  const toast = {
    success: (message, duration) => push('success', message, duration ?? 3000),
    error: (message, duration) => push('error', message, duration ?? 5000),
    info: (message, duration) => push('info', message, duration ?? 4000),
    dismiss: removeToast,
  };

  const iconMap = {
    success: <CheckCircle2 size={18} className="shrink-0" />,
    error: <XCircle size={18} className="shrink-0" />,
    info: <Info size={18} className="shrink-0" />,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => removeToast(t.id)}
            className={`toast toast-${t.type} flex items-center gap-2 text-left`}
          >
            {iconMap[t.type]}
            <span className="flex-1">{t.message}</span>
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
