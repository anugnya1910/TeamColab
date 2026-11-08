import { Loader2 } from 'lucide-react';
import { cn, initials } from '../lib/utils';

/* ---------------- Loading ---------------- */
export function Spinner({ className }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} />;
}

export function PageLoader({ fullscreen }) {
  return (
    <div className={cn('flex items-center justify-center', fullscreen ? 'h-screen' : 'h-[60vh]')}>
      <div className="flex flex-col items-center gap-3 text-zinc-400">
        <Spinner className="h-6 w-6 text-brand-500" />
        <span className="text-sm">Loading…</span>
      </div>
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-lg bg-zinc-200/70 dark:bg-zinc-800', className)} />;
}

/* ---------------- Empty / error ---------------- */
export function EmptyState({ icon: Icon, title, description, action, compact }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-8' : 'py-16')}>
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-400 shadow-card dark:border-zinc-800 dark:bg-zinc-900">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="card flex flex-col items-center gap-3 p-10 text-center">
      <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
      {onRetry && <button className="btn-secondary btn-sm" onClick={() => onRetry()}>Try again</button>}
    </div>
  );
}

/* ---------------- Page header ---------------- */
export function PageHeader({ title, description, actions, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {children}
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ---------------- Avatars ---------------- */
const AVATAR_SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-20 w-20 text-2xl',
};

export function Avatar({ user, size = 'sm', ring, className }) {
  if (!user) {
    return (
      <div
        title="Unassigned"
        className={cn('inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-zinc-300 text-zinc-400 dark:border-zinc-600', AVATAR_SIZES[size], className)}
      >
        ?
      </div>
    );
  }
  return (
    <div
      title={user.name}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white',
        ring && 'ring-2 ring-white dark:ring-zinc-900',
        AVATAR_SIZES[size],
        className
      )}
      style={{ backgroundColor: user.avatarColor || '#6366f1' }}
    >
      {initials(user.name)}
    </div>
  );
}

export function AvatarStack({ users = [], max = 4, size = 'sm' }) {
  const shown = users.slice(0, max);
  const extra = users.length - max;
  return (
    <div className="flex -space-x-2">
      {shown.map((u) => <Avatar key={u._id} user={u} size={size} ring />)}
      {extra > 0 && (
        <div className={cn('inline-flex items-center justify-center rounded-full bg-zinc-100 font-medium text-zinc-600 ring-2 ring-white dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-900', AVATAR_SIZES[size])}>
          +{extra}
        </div>
      )}
    </div>
  );
}

/* ---------------- Progress ---------------- */
export function ProgressBar({ value = 0, color, className }) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800', className)}>
      <div
        className="h-full rounded-full bg-brand-500 transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, ...(color ? { backgroundColor: color } : {}) }}
      />
    </div>
  );
}

/* ---------------- Form field ---------------- */
export function Field({ label, error, children, hint, className }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      {children}
      {error ? <p className="field-error">{error}</p> : hint ? <p className="mt-1 text-xs text-zinc-400">{hint}</p> : null}
    </div>
  );
}

/* ---------------- Tabs ---------------- */
export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            '-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
            value === t.id
              ? 'border-brand-600 text-zinc-900 dark:border-brand-400 dark:text-zinc-100'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          )}
        >
          {t.icon && <t.icon className="h-4 w-4" />}
          {t.label}
          {t.count !== undefined && (
            <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Segmented control ---------------- */
export function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 shadow-card dark:border-zinc-800 dark:bg-zinc-900">
      {options.map((o) => {
        const val = typeof o === 'string' ? o : o.value;
        const label = typeof o === 'string' ? o : o.label;
        return (
          <button
            key={val}
            onClick={() => onChange(val)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              value === val
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
