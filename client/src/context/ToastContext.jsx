import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const STYLES = {
  success: { icon: CheckCircle2, color: 'text-emerald-500' },
  error: { icon: AlertCircle, color: 'text-red-500' },
  info: { icon: Info, color: 'text-brand-500' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback((type, message) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-3), { id, type, message }]);
    setTimeout(() => remove(id), 3500);
  }, [remove]);

  const value = useMemo(() => ({
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const { icon: Icon, color } = STYLES[t.type];
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex animate-slide-up items-start gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-pop dark:border-zinc-700 dark:bg-zinc-900"
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
              <p className="flex-1 text-sm text-zinc-700 dark:text-zinc-200">{t.message}</p>
              <button onClick={() => remove(t.id)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
