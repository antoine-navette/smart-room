import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/utils';
import { Icon } from './Icon';

type ToastType = 'success' | 'error' | 'info';

type ToastOptions = {
  type: ToastType;
  message: string;
  title?: string;
  durationMs?: number;
};

type ToastItem = ToastOptions & {
  id: number;
  durationMs: number;
};

type ToastContextValue = {
  pushToast: (toast: ToastOptions) => void;
  dismissToast: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function getToastClasses(type: ToastType) {
  if (type === 'success') {
    return 'bg-tertiary-fixed text-on-tertiary-fixed';
  }

  if (type === 'error') {
    return 'bg-error-container text-on-error-container';
  }

  return 'bg-secondary-fixed text-on-secondary-fixed';
}

function getToastIcon(type: ToastType) {
  if (type === 'success') {
    return 'check_circle';
  }

  if (type === 'error') {
    return 'error';
  }

  return 'info';
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onDismiss(toast.id);
    }, toast.durationMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast.durationMs, toast.id, onDismiss]);

  const progressStyle = {
    ['--toast-duration' as const]: `${toast.durationMs}ms`,
  } as CSSProperties;

  return (
    <article
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className={cn(
        'toast-enter pointer-events-auto relative w-full overflow-hidden border-[3px] border-on-surface neo-shadow',
        getToastClasses(toast.type),
      )}
    >
      <div className="flex items-start gap-3 p-4 pr-14">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center border-[3px] border-on-surface bg-surface-container-lowest text-on-surface">
          <Icon name={getToastIcon(toast.type)} />
        </div>

        <div className="min-w-0">
          {toast.title ? (
            <p className="font-label-bold font-bold uppercase">{toast.title}</p>
          ) : null}

          <p className="font-body-md font-medium">{toast.message}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center border-[3px] border-on-surface bg-surface-container-lowest text-on-surface neo-shadow-sm"
        aria-label="Fermer la notification"
      >
        <Icon name="close" />
      </button>

      <div className="absolute bottom-0 left-0 h-1 w-full bg-black/10">
        <div className="toast-progress h-full w-full bg-black/25" style={progressStyle} />
      </div>
    </article>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((toast: ToastOptions) => {
    const nextToast: ToastItem = {
      id: Date.now() + Math.random(),
      durationMs: toast.durationMs ?? 4200,
      ...toast,
    };

    setToasts((current) => [nextToast, ...current].slice(0, 4));
  }, []);

  return (
    <ToastContext.Provider value={{ pushToast, dismissToast }}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 top-4 z-[120] flex justify-center px-4">
        <div className="flex w-full max-w-xl flex-col gap-3">
          {toasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} onDismiss={dismissToast} />
          ))}
        </div>
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