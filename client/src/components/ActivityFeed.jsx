import { CheckCircle2, FolderPlus, MessageSquare, Pencil, PlusCircle, Trash2, UserPlus, ArrowRightLeft, UserMinus } from 'lucide-react';
import { Avatar } from './ui';
import { timeAgo } from '../lib/utils';

const ICONS = {
  project_created: FolderPlus,
  project_updated: Pencil,
  task_created: PlusCircle,
  task_updated: Pencil,
  task_deleted: Trash2,
  status_changed: ArrowRightLeft,
  comment_added: MessageSquare,
  member_added: UserPlus,
  member_removed: UserMinus,
};

export default function ActivityFeed({ items = [], showProject = true }) {
  return (
    <ol className="relative space-y-4">
      {items.map((a, i) => {
        const Icon = a.message?.endsWith('to Done') ? CheckCircle2 : ICONS[a.action] || Pencil;
        return (
          <li key={a._id} className="relative flex gap-3">
            {i !== items.length - 1 && <span className="absolute left-[13px] top-8 h-[calc(100%-8px)] w-px bg-zinc-200 dark:bg-zinc-800" />}
            <div className="relative">
              <Avatar user={a.user} size="sm" />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700">
                <Icon className="h-2.5 w-2.5 text-zinc-500" />
              </span>
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm leading-snug text-zinc-600 dark:text-zinc-400">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{a.user?.name || 'Someone'}</span> {a.message}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                <span>{timeAgo(a.createdAt)}</span>
                {showProject && a.project && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-sm" style={{ backgroundColor: a.project.color }} />
                      {a.project.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
