import { Calendar, MessageSquare } from 'lucide-react';
import { PriorityBadge } from './Badges';
import { Avatar } from './ui';
import { cn, dueLabel, isOverdue } from '../lib/utils';

export default function TaskCard({ task, showProject = true, dragging, className, ...props }) {
  const overdue = isOverdue(task);
  const done = task.status === 'Done';

  return (
    <div
      {...props}
      className={cn(
        'group cursor-grab select-none rounded-lg border border-zinc-200 bg-white p-3 shadow-card transition-all hover:border-zinc-300 hover:shadow-md active:cursor-grabbing dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700',
        dragging && 'rotate-1 opacity-40',
        className
      )}
    >
      {showProject && task.project && (
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
          <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: task.project.color }} />
          <span className="truncate">{task.project.name}</span>
        </div>
      )}
      <p className={cn('text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-100', done && 'text-zinc-400 line-through decoration-zinc-300 dark:text-zinc-500 dark:decoration-zinc-600')}>
        {task.title}
      </p>
      {task.description && !done && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{task.description}</p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <PriorityBadge priority={task.priority} />
          {task.dueDate && (
            <span className={cn('inline-flex items-center gap-1 truncate text-[11px] font-medium', overdue ? 'text-red-600 dark:text-red-400' : 'text-zinc-500 dark:text-zinc-400')}>
              <Calendar className="h-3 w-3 shrink-0" />
              {dueLabel(task.dueDate, task.status)}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {task.commentCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
              <MessageSquare className="h-3 w-3" />
              {task.commentCount}
            </span>
          )}
          <Avatar user={task.assignee} size="xs" />
        </div>
      </div>
    </div>
  );
}
