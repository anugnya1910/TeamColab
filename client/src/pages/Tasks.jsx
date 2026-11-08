import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, ListTodo, Plus, Search, X } from 'lucide-react';
import { useApi, useDebounce } from '../hooks/useApi';
import { useTaskActions } from '../hooks/useTaskActions';
import { EmptyState, ErrorState, PageHeader, Skeleton } from '../components/ui';
import TaskTable from '../components/TaskTable';
import TaskDrawer from '../components/TaskDrawer';
import TaskFormModal from '../components/TaskFormModal';
import { PRIORITIES, STATUSES, cn } from '../lib/utils';

const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };

export default function Tasks() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [filters, setFilters] = useState({ project: '', status: '', priority: '', assignee: '', overdue: false });
  const [sort, setSort] = useState(params.get('sort') || 'newest');
  const [newTask, setNewTask] = useState(false);
  const debounced = useDebounce(search, 300);
  const openTask = params.get('task');

  const query = useMemo(() => {
    const q = new URLSearchParams();
    if (debounced.trim()) q.set('search', debounced.trim());
    if (filters.project) q.set('project', filters.project);
    if (filters.status) q.set('status', filters.status);
    if (filters.priority) q.set('priority', filters.priority);
    if (filters.assignee) q.set('assignee', filters.assignee);
    if (filters.overdue) q.set('overdue', 'true');
    q.set('sort', sort === 'priority' ? 'newest' : sort);
    return q.toString();
  }, [debounced, filters, sort]);

  const { data: tasks, setData, loading, error, reload } = useApi(`/tasks?${query}`);
  const { data: projects } = useApi('/projects');
  const { toggleDone } = useTaskActions(setData);

  const sorted = useMemo(() => {
    if (!tasks) return [];
    if (sort === 'priority') return [...tasks].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
    if (sort === 'dueDate') return [...tasks].sort((a, b) => (a.dueDate ? new Date(a.dueDate) : Infinity) - (b.dueDate ? new Date(b.dueDate) : Infinity));
    return tasks;
  }, [tasks, sort]);

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const activeFilters = Object.values(filters).filter(Boolean).length + (debounced ? 1 : 0);
  const clear = () => {
    setFilters({ project: '', status: '', priority: '', assignee: '', overdue: false });
    setSearch('');
  };

  const setOpenTask = (id) => {
    const next = new URLSearchParams(params);
    if (id) next.set('task', id);
    else next.delete('task');
    setParams(next, { replace: true });
  };

  const counts = useMemo(() => {
    const c = { Todo: 0, 'In Progress': 0, Done: 0 };
    (tasks || []).forEach((t) => c[t.status]++);
    return c;
  }, [tasks]);

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Search, filter and manage every task across your projects."
        actions={<button className="btn-primary" onClick={() => setNewTask(true)}><Plus className="h-4 w-4" /> New task</button>}
      />

      {/* Filters */}
      <div className="card mb-4 p-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input className="input pl-9" placeholder="Search by title or description…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex">
            <select className="input lg:w-44" value={filters.project} onChange={set('project')}>
              <option value="">All projects</option>
              {projects?.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
            <select className="input lg:w-36" value={filters.status} onChange={set('status')}>
              <option value="">Any status</option>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select className="input lg:w-36" value={filters.priority} onChange={set('priority')}>
              <option value="">Any priority</option>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select className="input lg:w-40" value={filters.assignee} onChange={set('assignee')}>
              <option value="">Anyone</option>
              <option value="me">Assigned to me</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilters((f) => ({ ...f, overdue: !f.overdue }))}
              className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors', filters.overdue ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800')}
            >
              <AlertTriangle className="h-3 w-3" /> Overdue only
            </button>
            {tasks && (
              <span className="text-xs text-zinc-500">
                {tasks.length} tasks · {counts.Todo} todo · {counts['In Progress']} in progress · {counts.Done} done
              </span>
            )}
            {activeFilters > 0 && (
              <button onClick={clear} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                <X className="h-3 w-3" /> Clear filters
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            Sort by
            <select className="input h-8 w-auto py-1 text-xs" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="dueDate">Due date</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : sorted.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ListTodo}
            title={activeFilters ? 'No tasks match your filters' : 'No tasks yet'}
            description={activeFilters ? 'Try removing some filters or changing your search.' : 'Create a task to start tracking work.'}
            action={activeFilters ? <button className="btn-secondary" onClick={clear}>Clear filters</button> : <button className="btn-primary" onClick={() => setNewTask(true)}><Plus className="h-4 w-4" /> New task</button>}
          />
        </div>
      ) : (
        <TaskTable tasks={sorted} onOpen={(t) => setOpenTask(t._id)} onToggleDone={toggleDone} />
      )}

      <TaskDrawer taskId={openTask} onClose={() => setOpenTask(null)} />
      <TaskFormModal open={newTask} onClose={() => setNewTask(false)} defaultProjectId={filters.project} />
    </div>
  );
}
