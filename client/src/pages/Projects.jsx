import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, CheckCircle2, FolderKanban, MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useApi, emitDataChanged, useClickOutside } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import api, { errMsg } from '../api/axios';
import { AvatarStack, EmptyState, ErrorState, PageHeader, ProgressBar, Segmented, Skeleton } from '../components/ui';
import { ProjectStatusBadge } from '../components/Badges';
import ProjectFormModal from '../components/ProjectFormModal';
import { PROJECT_STATUSES, cn, daysUntil, formatDate } from '../lib/utils';

function ProjectMenu({ onEdit, onDelete, canDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));
  return (
    <div ref={ref} className="relative" onClick={(e) => e.preventDefault()}>
      <button onClick={() => setOpen((o) => !o)} className="icon-btn h-8 w-8" aria-label="Project actions">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 w-40 animate-scale-in rounded-lg border border-zinc-200 bg-white p-1 shadow-pop dark:border-zinc-700 dark:bg-zinc-900">
          <button onClick={() => { setOpen(false); onEdit(); }} className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          {canDelete && (
            <button onClick={() => { setOpen(false); onDelete(); }} className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, onEdit, onDelete, isOwner }) {
  const days = project.deadline ? daysUntil(project.deadline) : null;
  const late = days !== null && days < 0 && project.status !== 'Completed';
  return (
    <Link to={`/projects/${project._id}`} className="card group flex flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: project.color }}>
            {project.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-zinc-900 dark:text-zinc-50">{project.name}</h3>
            <p className="truncate text-xs text-zinc-500">by {project.owner?.name}</p>
          </div>
        </div>
        <ProjectMenu onEdit={onEdit} onDelete={onDelete} canDelete={isOwner} />
      </div>

      <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {project.description || 'No description'}
      </p>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-zinc-500">Progress</span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{project.progress}%</span>
        </div>
        <ProgressBar value={project.progress} color={project.color} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <AvatarStack users={project.members} max={4} size="xs" />
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />{project.completedCount}/{project.taskCount}</span>
          <span className={cn('flex items-center gap-1', late && 'font-medium text-red-600 dark:text-red-400')}>
            <Calendar className="h-3.5 w-3.5" />{formatDate(project.deadline)}
          </span>
        </div>
      </div>
      <div className="mt-3"><ProjectStatusBadge status={project.status} /></div>
    </Link>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { data: projects, loading, error, reload } = useApi('/projects');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [modal, setModal] = useState({ open: false, project: null });

  useEffect(() => {
    if (params.get('new')) {
      setModal({ open: true, project: null });
      params.delete('new');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const filtered = useMemo(() => {
    if (!projects) return [];
    const q = search.trim().toLowerCase();
    return projects.filter((p) => (status === 'All' || p.status === status) && (!q || p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)));
  }, [projects, search, status]);

  const remove = async (project) => {
    const ok = await confirm({
      title: `Delete "${project.name}"?`,
      message: `This permanently deletes the project and all ${project.taskCount} of its tasks, comments and activity.`,
      confirmText: 'Delete project',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/projects/${project._id}`);
      toast.success('Project deleted');
      emitDataChanged();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Every workspace your team is collaborating in."
        actions={<button className="btn-primary" onClick={() => setModal({ open: true, project: null })}><Plus className="h-4 w-4" /> New project</button>}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input className="input pl-9" placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="overflow-x-auto"><Segmented options={['All', ...PROJECT_STATUSES]} value={status} onChange={setStatus} /></div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64" />)}</div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FolderKanban}
            title={projects.length === 0 ? 'No projects yet' : 'No matching projects'}
            description={projects.length === 0 ? 'Create your first project to start organizing tasks with your team.' : 'Try a different search or status filter.'}
            action={projects.length === 0 && <button className="btn-primary" onClick={() => setModal({ open: true, project: null })}><Plus className="h-4 w-4" /> Create project</button>}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard
              key={p._id}
              project={p}
              isOwner={p.owner?._id === user?._id}
              onEdit={() => setModal({ open: true, project: p })}
              onDelete={() => remove(p)}
            />
          ))}
        </div>
      )}

      <ProjectFormModal
        open={modal.open}
        project={modal.project}
        onClose={() => setModal({ open: false, project: null })}
        onSaved={(p) => !modal.project && navigate(`/projects/${p._id}`)}
      />
    </div>
  );
}
