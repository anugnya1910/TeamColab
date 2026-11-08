import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Activity, ArrowLeft, Calendar, Columns3, Crown, List, Pencil, Plus, Trash2, UserPlus, Users, X } from 'lucide-react';
import { useApi, emitDataChanged } from '../hooks/useApi';
import { useTaskActions } from '../hooks/useTaskActions';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import api, { errMsg } from '../api/axios';
import { Avatar, AvatarStack, EmptyState, ErrorState, Field, PageLoader, ProgressBar, Spinner, Tabs } from '../components/ui';
import { ProjectStatusBadge } from '../components/Badges';
import KanbanBoard from '../components/KanbanBoard';
import TaskTable from '../components/TaskTable';
import ActivityFeed from '../components/ActivityFeed';
import TaskDrawer from '../components/TaskDrawer';
import TaskFormModal from '../components/TaskFormModal';
import ProjectFormModal from '../components/ProjectFormModal';
import Modal from '../components/Modal';
import { cn, daysUntil, formatFullDate } from '../lib/utils';

function InviteModal({ open, onClose, projectId }) {
  const toast = useToast();
  const [form, setForm] = useState({ email: '', name: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Enter a valid email address');
    setSaving(true);
    setError('');
    try {
      await api.post(`/projects/${projectId}/members`, { email: form.email.trim(), name: form.name.trim() || undefined });
      toast.success('Member added to the project');
      emitDataChanged();
      setForm({ email: '', name: '' });
      onClose();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite a team member"
      description="Add an existing user by email, or include a name to invite someone new."
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" form="invite-form" className="btn-primary" disabled={saving}>{saving && <Spinner />} Add member</button>
        </>
      }
    >
      <form id="invite-form" onSubmit={submit} className="space-y-4 p-6" noValidate>
        <Field label="Email address" error={error}>
          <input autoFocus className={cn('input', error && 'input-error')} placeholder="teammate@example.com" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setError(''); }} />
        </Field>
        <Field label="Full name (only for new users)" hint="New users get the temporary password Welcome@123">
          <input className="input" placeholder="e.g. Arjun Patel" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <p className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400">
          Tip: try <span className="font-medium text-zinc-700 dark:text-zinc-300">ananya@teamsync.com</span> or <span className="font-medium text-zinc-700 dark:text-zinc-300">karthik@teamsync.com</span>.
        </p>
      </form>
    </Modal>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const { data: project, loading, error, reload } = useApi(`/projects/${id}`);
  const { data: tasks, setData: setTasks } = useApi(`/tasks?project=${id}`);
  const { data: activity } = useApi(`/activity?project=${id}&limit=30`);
  const { moveTask, toggleDone } = useTaskActions(setTasks);
  const [tab, setTab] = useState('board');
  const [openTask, setOpenTask] = useState(null);
  const [taskModal, setTaskModal] = useState({ open: false, status: 'Todo' });
  const [editProject, setEditProject] = useState(false);
  const [invite, setInvite] = useState(false);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const isOwner = project.owner?._id === user?._id;
  const days = project.deadline ? daysUntil(project.deadline) : null;

  const removeProject = async () => {
    const ok = await confirm({ title: `Delete "${project.name}"?`, message: 'All tasks, comments and activity in this project will be permanently deleted.', confirmText: 'Delete project', danger: true });
    if (!ok) return;
    try {
      await api.delete(`/projects/${project._id}`);
      toast.success('Project deleted');
      emitDataChanged();
      navigate('/projects');
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const removeMember = async (m) => {
    const ok = await confirm({ title: `Remove ${m.name}?`, message: 'Their tasks in this project will become unassigned.', confirmText: 'Remove', danger: true });
    if (!ok) return;
    try {
      await api.delete(`/projects/${project._id}/members/${m._id}`);
      toast.success(`${m.name} removed from project`);
      emitDataChanged();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const list = tasks || [];
  const memberStats = (mid) => {
    const mine = list.filter((t) => t.assignee?._id === mid);
    return { total: mine.length, done: mine.filter((t) => t.status === 'Done').length };
  };

  return (
    <div>
      <Link to="/projects" className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        <ArrowLeft className="h-4 w-4" /> Projects
      </Link>

      {/* Header */}
      <div className="card mb-6 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-semibold text-white" style={{ backgroundColor: project.color }}>
              {project.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{project.name}</h1>
                <ProjectStatusBadge status={project.status} />
              </div>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{project.description || 'No description'}</p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button className="btn-secondary" onClick={() => setEditProject(true)}><Pencil className="h-4 w-4" /> Edit</button>
            {isOwner && <button className="btn-secondary text-red-600 hover:text-red-700 dark:text-red-400" onClick={removeProject}><Trash2 className="h-4 w-4" /></button>}
            <button className="btn-primary" onClick={() => setTaskModal({ open: true, status: 'Todo' })}><Plus className="h-4 w-4" /> Add task</button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 border-t border-zinc-100 pt-5 dark:border-zinc-800 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-zinc-500">Progress</p>
            <div className="mt-2 flex items-center gap-3">
              <ProgressBar value={project.progress} color={project.color} className="h-2" />
              <span className="text-sm font-semibold">{project.progress}%</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">{project.completedCount} of {project.taskCount} tasks done</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Deadline</p>
            <p className="mt-2 flex items-center gap-1.5 text-sm font-medium"><Calendar className="h-4 w-4 text-zinc-400" />{formatFullDate(project.deadline)}</p>
            {days !== null && project.status !== 'Completed' && (
              <p className={cn('mt-1 text-xs', days < 0 ? 'text-red-600' : 'text-zinc-500')}>{days < 0 ? `${-days} days overdue` : `${days} days remaining`}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-zinc-500">Owner</p>
            <div className="mt-2 flex items-center gap-2"><Avatar user={project.owner} size="xs" /><span className="text-sm font-medium">{project.owner?.name}</span></div>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Team</p>
            <div className="mt-2 flex items-center gap-3">
              <AvatarStack users={project.members} max={5} size="sm" />
              <button onClick={() => setInvite(true)} className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-zinc-300 text-zinc-400 hover:border-brand-500 hover:text-brand-600 dark:border-zinc-600" title="Invite member">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'board', label: 'Board', icon: Columns3 },
          { id: 'list', label: 'List', icon: List, count: list.length },
          { id: 'members', label: 'Members', icon: Users, count: project.members.length },
          { id: 'activity', label: 'Activity', icon: Activity },
        ]}
      />

      <div className="mt-5">
        {tab === 'board' && (
          !tasks ? <PageLoader /> : (
            <KanbanBoard tasks={list} showProject={false} onMove={moveTask} onOpen={(t) => setOpenTask(t._id)} onAdd={(status) => setTaskModal({ open: true, status })} />
          )
        )}

        {tab === 'list' && (
          list.length === 0 ? (
            <div className="card"><EmptyState icon={List} title="No tasks in this project" description="Add the first task to get things moving." action={<button className="btn-primary" onClick={() => setTaskModal({ open: true, status: 'Todo' })}><Plus className="h-4 w-4" /> Add task</button>} /></div>
          ) : (
            <TaskTable tasks={list} showProject={false} onOpen={(t) => setOpenTask(t._id)} onToggleDone={toggleDone} />
          )
        )}

        {tab === 'members' && (
          <div className="card">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <div>
                <h2 className="section-title">Project members</h2>
                <p className="text-xs text-zinc-500">{project.members.length} people collaborating</p>
              </div>
              <button className="btn-primary btn-sm" onClick={() => setInvite(true)}><UserPlus className="h-3.5 w-3.5" /> Invite</button>
            </div>
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {project.members.map((m) => {
                const s = memberStats(m._id);
                const owner = m._id === project.owner?._id;
                return (
                  <li key={m._id} className="flex items-center gap-4 px-5 py-3.5">
                    <Avatar user={m} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {m.name} {owner && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                        {m._id === user?._id && <span className="text-xs font-normal text-zinc-400">(you)</span>}
                      </p>
                      <p className="truncate text-xs text-zinc-500">{m.role} · {m.email}</p>
                    </div>
                    <div className="hidden w-40 sm:block">
                      <div className="mb-1 flex justify-between text-xs text-zinc-500"><span>{s.done}/{s.total} tasks</span><span>{s.total ? Math.round((s.done / s.total) * 100) : 0}%</span></div>
                      <ProgressBar value={s.total ? (s.done / s.total) * 100 : 0} />
                    </div>
                    {isOwner && !owner ? (
                      <button onClick={() => removeMember(m)} className="icon-btn h-8 w-8 hover:text-red-600" title="Remove member"><X className="h-4 w-4" /></button>
                    ) : <span className="w-8" />}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {tab === 'activity' && (
          <div className="card p-6">
            {!activity ? <PageLoader /> : activity.length === 0 ? <EmptyState compact icon={Activity} title="No activity yet" /> : <ActivityFeed items={activity} showProject={false} />}
          </div>
        )}
      </div>

      <TaskDrawer taskId={openTask} onClose={() => setOpenTask(null)} />
      <TaskFormModal open={taskModal.open} defaultProjectId={project._id} defaultStatus={taskModal.status} onClose={() => setTaskModal({ open: false, status: 'Todo' })} />
      <ProjectFormModal open={editProject} project={project} onClose={() => setEditProject(false)} />
      <InviteModal open={invite} onClose={() => setInvite(false)} projectId={project._id} />
    </div>
  );
}
