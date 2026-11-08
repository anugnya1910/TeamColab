import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal';

const ConfirmContext = createContext(null);

// Usage: const confirm = useConfirm(); if (await confirm({ title, message, danger: true })) { ... }
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setState({ title: 'Are you sure?', message: '', confirmText: 'Confirm', danger: false, ...opts });
      }),
    []
  );

  const close = (result) => {
    resolver.current?.(result);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal open={!!state} onClose={() => close(false)} size="sm" hideHeader>
        {state && (
          <div className="p-6">
            <div className="flex gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${state.danger ? 'bg-red-50 text-red-600 dark:bg-red-500/10' : 'bg-brand-50 text-brand-600 dark:bg-brand-500/10'}`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{state.title}</h3>
                {state.message && <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{state.message}</p>}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => close(false)}>Cancel</button>
              <button className={state.danger ? 'btn-danger' : 'btn-primary'} onClick={() => close(true)} autoFocus>
                {state.confirmText}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
