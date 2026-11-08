import { useMemo, useState } from 'react';
import { Columns3, Plus, Search } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useTaskActions } from '../hooks/useTaskActions';
import { useAuth } from '../context/AuthContext';
import { EmptyState, ErrorState, PageHeader, Segmented, Skeleton } from '../components/ui';
import KanbanBoard from '../components/KanbanBoard';
import TaskDrawer from '../components/TaskDrawer';
import TaskFormModal from '../components/TaskFormModal';

export default function Board() {
  const { user } = useAuth();
  const [project, setProject] = useState('');
  const [scope, setScope] = useState('all');
  const [search, setSearch] = useState('');
  const [openTask, setOpenTask] = useState(null);
  const [taskModal, setTaskModal] = useState({ open: false, status: 'Todo' });

  const { data: tasks, setData, loading, error, reload } = useApi(`/tasks${project ? `?project=${project}` : ''}`);
  const { data: projects } = useApi('/projects');
  const { moveTask } = useTaskActions(setData);

  const visible = useMemo(() => {
    if (!tasks) return [];
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => (scope === 'all' || t.assignee?._id === user?._id) && (!q || t.title.toLowerCase().includes(q)));
  }, [tasks, scope, search, user]);

  return (
    <div>
      <PageHeader
        title="Kanban Board"
        description="Drag cards between columns — status changes are saved to the database instantly."
        actions={<button className="btn-primary" onClick={() => setTaskModal({ open: true, status: 'Todo' })}><Plus className="h-4 w-4" /> New task</button>}
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <select className="input sm:w-56" value={project} onChange={(e) => setProject(e.target.value)}>
          <option value="">All projects</option>
          {projects?.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input className="input pl-9" placeholder="Filter cards…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="sm:ml-auto">
          <Segmented options={[{ value: 'all', label: 'All tasks' }, { value: 'mine', label: 'My tasks' }]} value={scope} onChange={setScope} />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[460px]" />)}</div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : projects?.length === 0 ? (
        <div className="card"><EmptyState icon={Columns3} title="No projects yet" description="Create a project first, then add tasks to see them on the board." /></div>
      ) : (
        <KanbanBoard
          tasks={visible}
          showProject={!project}
          onMove={moveTask}
          onOpen={(t) => setOpenTask(t._id)}
          onAdd={(status) => setTaskModal({ open: true, status })}
        />
      )}

      <TaskDrawer taskId={openTask} onClose={() => setOpenTask(null)} />
      <TaskFormModal open={taskModal.open} defaultStatus={taskModal.status} defaultProjectId={project} onClose={() => setTaskModal({ open: false, status: 'Todo' })} />
    </div>
  );
}
