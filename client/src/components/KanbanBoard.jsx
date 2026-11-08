import { useMemo, useState } from 'react';
import { CheckCircle2, Circle, Plus, Timer } from 'lucide-react';
import TaskCard from './TaskCard';
import { cn } from '../lib/utils';

const COLUMNS = [
  { id: 'Todo', title: 'To Do', icon: Circle, iconCls: 'text-zinc-400' },
  { id: 'In Progress', title: 'In Progress', icon: Timer, iconCls: 'text-blue-500' },
  { id: 'Done', title: 'Done', icon: CheckCircle2, iconCls: 'text-emerald-500' },
];

const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };

/**
 * Drag-and-drop Kanban built on the native HTML5 Drag and Drop API.
 * onMove(task, newStatus) is called when a card is dropped in another column.
 */
export default function KanbanBoard({ tasks, onMove, onOpen, onAdd, showProject = true }) {
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);

  const grouped = useMemo(() => {
    const g = { Todo: [], 'In Progress': [], Done: [] };
    tasks.forEach((t) => g[t.status]?.push(t));
    g.Todo.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
    g['In Progress'].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
    return g;
  }, [tasks]);

  const handleDrop = (e, status) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    setOverCol(null);
    setDragId(null);
    const task = tasks.find((t) => t._id === id);
    if (task && task.status !== status) onMove(task, status);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {COLUMNS.map((col) => {
        const items = grouped[col.id];
        const isOver = overCol === col.id;
        return (
          <div
            key={col.id}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (overCol !== col.id) setOverCol(col.id);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setOverCol(null);
            }}
            onDrop={(e) => handleDrop(e, col.id)}
            className={cn(
              'flex min-h-[460px] flex-col rounded-xl border p-2 transition-colors',
              isOver
                ? 'border-brand-400 bg-brand-50/70 dark:border-brand-500/50 dark:bg-brand-500/5'
                : 'border-zinc-200/70 bg-zinc-100/60 dark:border-zinc-800/70 dark:bg-zinc-900/40'
            )}
          >
            <div className="mb-2 flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center gap-2">
                <col.icon className={cn('h-4 w-4', col.iconCls)} />
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{col.title}</h3>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-zinc-500 shadow-card dark:bg-zinc-800 dark:text-zinc-400">
                  {items.length}
                </span>
              </div>
              {onAdd && (
                <button onClick={() => onAdd(col.id)} className="icon-btn h-7 w-7" title={`Add task to ${col.title}`}>
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-2">
              {items.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  showProject={showProject}
                  draggable
                  dragging={dragId === task._id}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', task._id);
                    e.dataTransfer.effectAllowed = 'move';
                    setDragId(task._id);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverCol(null);
                  }}
                  onClick={() => onOpen?.(task)}
                />
              ))}
              {items.length === 0 && (
                <div className={cn('flex flex-1 items-center justify-center rounded-lg border-2 border-dashed py-10 text-xs text-zinc-400', isOver ? 'border-brand-300' : 'border-zinc-200 dark:border-zinc-800')}>
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
