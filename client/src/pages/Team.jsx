import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, Mail, Search, UserPlus, Users } from 'lucide-react';
import { useApi, emitDataChanged } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api, { errMsg } from '../api/axios';
import { Avatar, EmptyState, ErrorState, Field, PageHeader, PageLoader, ProgressBar, Skeleton, Spinner } from '../components/ui';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import ActivityFeed from '../components/ActivityFeed';
import Modal from '../components/Modal';
import TaskDrawer from '../components/TaskDrawer';
import { cn, dueLabel, formatFullDate, isOverdue, timeAgo } from '../lib/utils';

function InviteMemberModal({ open, onClose }) {
  const toast = useToast();
  const { data: projects } = useApi(open ? '/projects' : null);
  const [form, setForm] = useState({ project: '', email: '', name: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && projects?.length && !form.project) setForm((f) => ({ ...f, project: projects[0]._id }));
  }, [open, projects, form.project]);

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!form.project) er.project = 'Select a project';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) er.email = 'Enter a valid email address';
    setErrors(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    try {
      await api.post(`/projects/${form.project}/members`, { email: form.email.trim(), name: form.name.trim() || undefined });
      toast.success('Team member added');
      emitDataChanged();
      setForm((f) => ({ ...f, email: '', name: '' }));
      onClose();
    } catch (err) {
      setErrors({ email: errMsg(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite team member"
      description="Add a teammate to one of your projects."
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" form="team-invite" className="btn-primary" disabled={saving}>{saving && <Spinner />} Send invite</button>
        </>
      }
    >
      <form id="team-invite" onSubmit={submit} className="space-y-4 p-6" noValidate>
        <Field label="Project" error={errors.project}>
          <select className="input" value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}>
            {projects?.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Email address" error={errors.email}>
          <input autoFocus className={cn('input', errors.email && 'input-error')} placeholder="teammate@example.com" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({}); }} />
        </Field>
        <Field label="Full name (for new users)" hint="If the email isn't registered, an account is created with password Welcome@123">
          <input className="input" placeholder="e.g. Arjun Patel" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
      </form>
    </Modal>
  );
}

function MemberModal({ memberId, onClose, onOpenTask }) {
  const { data, loading } = useApi(memberId ? `/users/${memberId}` : null);
  return (
    <Modal open={!!memberId} onClose={onClose} size="lg" title="Member details">
      {loading || !data ? (
        <PageLoader />
      ) : (
        <div className="p-6">
          <div className="flex items-center gap-4">
            <Avatar user={data.user} size="lg" />
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{data.user.name}</h3>
              <p className="text-sm text-zinc-500">{data.user.role}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400"><Mail className="h-3 w-3" />{data.user.email}</p>
            </div>
          </div>
          {data.user.bio && <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">{data.user.bio}</p>}

          <div className="mt-5 grid grid-cols-4 gap-3">
            {[['Assigned', data.stats.total], ['Open', data.stats.open], ['In progress', data.stats.inProgress], ['Completed', data.stats.done]].map(([l, v]) => (
              <div key={l} className="rounded-lg border border-zinc-200 p-3 text-center dark:border-zinc-800">
                <p className="text-xl font-semibold">{v}</p>
                <p className="text-[11px] text-zinc-500">{l}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {data.projects.map((p) => (
              <span key={p._id} className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: p.color }} />{p.name}
              </span>
            ))}
          </div>

          <h4 className="section-title mb-2 mt-6">Assigned tasks</h4>
          {data.tasks.length === 0 ? (
            <p className="text-sm text-zinc-400">No tasks assigned.</p>
          ) : (
            <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {data.tasks.map((t) => (
                <li key={t._id}>
                  <button onClick={() => onOpenTask(t._id)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: t.project?.color }} />
                    <span className={cn('flex-1 truncate text-sm', t.status === 'Done' && 'text-zinc-400 line-through')}>{t.title}</span>
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} className="hidden sm:inline-flex" />
                    <span className={cn('hidden w-20 text-right text-xs sm:block', isOverdue(t) ? 'text-red-600' : 'text-zinc-500')}>{dueLabel(t.dueDate, t.status)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-zinc-400">Member since {formatFullDate(data.user.createdAt)} · Last active {timeAgo(data.user.lastActive)}</p>
        </div>
      )}
    </Modal>
  );
}

export default function Team() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const { data: team, loading, error, reload } = useApi('/users/team');
  const { data: activity } = useApi('/activity?limit=15');
  const [search, setSearch] = useState('');
  const [invite, setInvite] = useState(false);
  const [openTask, setOpenTask] = useState(null);
  const memberId = params.get('member');

  const setMember = (id) => {
    const next = new URLSearchParams(params);
    if (id) next.set('member', id);
    else next.delete('member');
    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (team || []).filter((m) => !q || m.name.toLowerCase().includes(q) || m.role?.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }, [team, search]);

  return (
    <div>
      <PageHeader
        title="Team"
        description="Everyone you collaborate with, their workload and what they're up to."
        actions={<button className="btn-primary" onClick={() => setInvite(true)}><UserPlus className="h-4 w-4" /> Invite member</button>}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="relative mb-4 max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input className="input pl-9" placeholder="Search people…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48" />)}</div>
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : filtered.length === 0 ? (
            <div className="card"><EmptyState icon={Users} title="No team members found" description="Invite teammates to your projects to collaborate." /></div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((m) => {
                const rate = m.stats.total ? Math.round((m.stats.done / m.stats.total) * 100) : 0;
                return (
                  <button key={m._id} onClick={() => setMember(m._id)} className="card p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <Avatar user={m} size="lg" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                          {m.name} {m._id === user?._id && <span className="text-xs font-normal text-zinc-400">(you)</span>}
                        </p>
                        <p className="truncate text-sm text-zinc-500">{m.role}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-zinc-50 py-2 dark:bg-zinc-800/50"><p className="text-sm font-semibold">{m.stats.open}</p><p className="text-[10px] text-zinc-500">Open</p></div>
                      <div className="rounded-lg bg-zinc-50 py-2 dark:bg-zinc-800/50"><p className="text-sm font-semibold">{m.stats.inProgress}</p><p className="text-[10px] text-zinc-500">Active</p></div>
                      <div className="rounded-lg bg-zinc-50 py-2 dark:bg-zinc-800/50"><p className="text-sm font-semibold">{m.stats.done}</p><p className="text-[10px] text-zinc-500">Done</p></div>
                    </div>
                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-xs text-zinc-500"><span>Completion</span><span className="font-medium text-zinc-700 dark:text-zinc-300">{rate}%</span></div>
                      <ProgressBar value={rate} color={m.avatarColor} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {m.projects.map((p) => (
                        <span key={p._id} className="inline-flex max-w-full items-center gap-1 truncate rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-sm" style={{ backgroundColor: p.color }} />{p.name}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="card h-fit">
          <div className="flex items-center gap-2 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
            <Activity className="h-4 w-4 text-zinc-400" />
            <h2 className="section-title">Team activity</h2>
          </div>
          <div className="max-h-[640px] overflow-y-auto p-5">
            {!activity ? <PageLoader /> : activity.length === 0 ? <EmptyState compact title="No activity yet" /> : <ActivityFeed items={activity} />}
          </div>
        </div>
      </div>

      <InviteMemberModal open={invite} onClose={() => setInvite(false)} />
      <MemberModal memberId={memberId} onClose={() => setMember(null)} onOpenTask={(id) => { setMember(null); setOpenTask(id); }} />
      <TaskDrawer taskId={openTask} onClose={() => setOpenTask(null)} />
    </div>
  );
}
