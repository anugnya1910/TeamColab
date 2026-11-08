import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

const WIDTHS = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-3xl' };

export default function Modal({ open, onClose, title, description, children, footer, size = 'md', hideHeader }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 animate-fade-in bg-zinc-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative flex max-h-[92vh] w-full animate-scale-in flex-col rounded-t-2xl border border-zinc-200 bg-white shadow-pop dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-2xl',
          WIDTHS[size]
        )}
      >
        {!hideHeader && (
          <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
              {description && <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
            </div>
            <button onClick={onClose} className="icon-btn -mr-2 -mt-1 h-8 w-8" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-zinc-100 bg-zinc-50/60 px-6 py-3.5 dark:border-zinc-800 dark:bg-zinc-900/60 sm:rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
