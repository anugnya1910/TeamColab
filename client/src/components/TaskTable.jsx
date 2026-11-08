import { CheckCircle2, Circle, MessageSquare } from 'lucide-react';
import { PriorityBadge, StatusBadge } from './Badges';
import { Avatar } from './ui';
import { cn, dueLabel, isOverdue } from '../lib/utils';

export default function TaskTable({ tasks, onOpen, onToggleDone, showProject = true }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/80 text-left text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
              <th className="px-4 py-2.5 font-medium">Task</th>
              <th className="hidden px-4 py-2.5 font-medium md:table-cell">Assignee</th>
              <th className="px-4 py-2.5 font-medium">Priority</th>
              <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Status</th>
              <th className="hidden px-4 py-2.5 font-medium lg:table-cell">Due date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {tasks.map((t) => {
              const overdue = isOverdue(t);
              const done = t.status === 'Done';
              return (
                <tr key={t._id} onClick={() => onOpen(t)} className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleDone?.(t);
                        }}
                        title={done ? 'Mark as not done' : 'Mark as done'}
                        className="shrink-0"
                      >
                        {done ? (
                          <CheckCircle2 className="h-[18px] w-[18px] text-emerald-500" />
                        ) : (
                          <Circle className="h-[18px] w-[18px] text-zinc-300 transition-colors hover:text-brand-500 dark:text-zinc-600" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <p className={cn('truncate font-medium text-zinc-900 dark:text-zinc-100', done && 'text-zinc-400 line-through dark:text-zinc-500')}>
                          {t.title}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                          {showProject && t.project && (
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: t.project.color }} />
                              {t.project.name}
                            </span>
                          )}
                          {t.commentCount > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {t.commentCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <div className="flex items-center gap-2">
                      <Avatar user={t.assignee} size="xs" />
                      <span className="truncate text-zinc-600 dark:text-zinc-300">{t.assignee?.name || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                  <td className="hidden px-4 py-3 sm:table-cell"><StatusBadge status={t.status} /></td>
                  <td className={cn('hidden whitespace-nowrap px-4 py-3 text-xs font-medium lg:table-cell', overdue ? 'text-red-600 dark:text-red-400' : 'text-zinc-500 dark:text-zinc-400')}>
                    {dueLabel(t.dueDate, t.status)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
