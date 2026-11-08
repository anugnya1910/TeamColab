import { Flag } from 'lucide-react';
import { cn } from '../lib/utils';

const base = 'inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset';

const PRIORITY = {
  High: 'bg-red-50 text-red-700 ring-red-600/15 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20',
  Medium: 'bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
  Low: 'bg-zinc-100 text-zinc-600 ring-zinc-500/15 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700',
};

const STATUS = {
  Todo: { cls: 'bg-zinc-100 text-zinc-700 ring-zinc-500/15 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700', dot: 'bg-zinc-400' },
  'In Progress': { cls: 'bg-blue-50 text-blue-700 ring-blue-600/15 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20', dot: 'bg-blue-500' },
  Done: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20', dot: 'bg-emerald-500' },
};

const PROJECT = {
  Planning: { cls: 'bg-violet-50 text-violet-700 ring-violet-600/15 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20', dot: 'bg-violet-500' },
  Active: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20', dot: 'bg-emerald-500' },
  'On Hold': { cls: 'bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20', dot: 'bg-amber-500' },
  Completed: { cls: 'bg-zinc-100 text-zinc-700 ring-zinc-500/15 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700', dot: 'bg-zinc-500' },
};

export function PriorityBadge({ priority, className }) {
  return (
    <span className={cn(base, PRIORITY[priority], className)}>
      <Flag className="h-3 w-3" />
      {priority}
    </span>
  );
}

export function StatusBadge({ status, className }) {
  const s = STATUS[status] || STATUS.Todo;
  return (
    <span className={cn(base, s.cls, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
      {status}
    </span>
  );
}

export function ProjectStatusBadge({ status, className }) {
  const s = PROJECT[status] || PROJECT.Planning;
  return (
    <span className={cn(base, s.cls, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
      {status}
    </span>
  );
}
