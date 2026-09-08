'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && closeOnBackdrop) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    panelRef.current?.querySelector('input, textarea, select, button')?.focus();

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, closeOnBackdrop]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && closeOnBackdrop) onClose();
      }}
    >
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal-content flex max-h-[90vh] w-full ${sizes[size] || sizes.md} flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl`}
      >
        {(title || description) && (
          <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
            <div>
              {title && <h2 className="text-lg font-semibold text-slate-950">{title}</h2>}
              {description && <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>}
            </div>
            {closeOnBackdrop && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            )}
          </header>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">{footer}</footer>}
      </section>
    </div>
  );
}
