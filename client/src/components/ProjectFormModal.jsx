import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import Modal from './Modal';
import { Avatar, Field, Spinner } from './ui';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { emitDataChanged, useApi } from '../hooks/useApi';
import { PROJECT_COLORS, PROJECT_STATUSES, cn, fromInputDate, toInputDate } from '../lib/utils';

export default function ProjectFormModal({ open, onClose, project, onSaved }) {
  const isEdit = !!project;
  const { user } = useAuth();
  const toast = useToast();
  const { data: users } = useApi(open && !isEdit ? '/users' : null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      project
        ? { name: project.name, description: project.description || '', status: project.status, deadline: toInputDate(project.deadline), color: project.color, members: [] }
        : { name: '', description: '', status: 'Planning', deadline: '', color: PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)], members: [] }
    );
  }, [open, project]);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const toggleMember = (id) =>
    setForm((f) => ({ ...f, members: f.members.includes(id) ? f.members.filter((m) => m !== id) : [...f.members, id] }));

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = 'Project name is required';
    else if (form.name.trim().length > 100) e.name = 'Name must be under 100 characters';
    if ((form.description || '').length > 1000) e.description = 'Description is too long';
    if (!isEdit && form.deadline && new Date(form.deadline) < new Date(toInputDate(new Date()))) e.deadline = 'Deadline cannot be in the past';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
      color: form.color,
      deadline: fromInputDate(form.deadline),
    };
    try {
      const res = isEdit
        ? await api.put(`/projects/${project._id}`, payload)
        : await api.post('/projects', { ...payload, members: form.members });
      toast.success(isEdit ? 'Project updated' : 'Project created');
      emitDataChanged();
      onSaved?.(res.data);
      onClose();
    } catch (err) {
      toast.error(errMsg(err, 'Could not save the project'));
    } finally {
      setSaving(false);
    }
  };

  const others = (users || []).filter((u) => u._id !== user?._id);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit project' : 'New project'}
      description={isEdit ? 'Update project details.' : 'Set up a workspace for your team.'}
      size="lg"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" form="project-form" className="btn-primary" disabled={saving}>
            {saving && <Spinner />} {isEdit ? 'Save changes' : 'Create project'}
          </button>
        </>
      }
    >
      <form id="project-form" onSubmit={submit} className="grid gap-4 p-6 sm:grid-cols-2" noValidate>
        <Field label="Project name" error={errors.name} className="sm:col-span-2">
          <input autoFocus className={cn('input', errors.name && 'input-error')} placeholder="e.g. Website Redesign" value={form.name || ''} onChange={set('name')} />
        </Field>
        <Field label="Description" error={errors.description} className="sm:col-span-2">
          <textarea rows={3} className={cn('input resize-none', errors.description && 'input-error')} placeholder="What is this project about?" value={form.description || ''} onChange={set('description')} />
        </Field>
        <Field label="Status">
          <select className="input" value={form.status || 'Planning'} onChange={set('status')}>
            {PROJECT_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Deadline" error={errors.deadline}>
          <input type="date" className={cn('input', errors.deadline && 'input-error')} value={form.deadline || ''} onChange={set('deadline')} />
        </Field>
        <Field label="Color" className="sm:col-span-2">
          <div className="flex flex-wrap gap-2">
            {PROJECT_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setForm((f) => ({ ...f, color: c }))}
                className={cn('flex h-8 w-8 items-center justify-center rounded-lg transition-transform hover:scale-105', form.color === c && 'ring-2 ring-offset-2 ring-zinc-900 dark:ring-zinc-100 dark:ring-offset-zinc-900')}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              >
                {form.color === c && <Check className="h-4 w-4 text-white" />}
              </button>
            ))}
          </div>
        </Field>
        {!isEdit && (
          <Field label={`Team members${form.members?.length ? ` (${form.members.length} selected)` : ''}`} className="sm:col-span-2" hint="You are added automatically as the owner. More people can be invited later.">
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-zinc-200 p-1.5 dark:border-zinc-700">
              {!users && <p className="p-2 text-xs text-zinc-400">Loading users…</p>}
              {users && others.length === 0 && <p className="p-2 text-xs text-zinc-400">No other users yet.</p>}
              {others.map((u) => {
                const selected = form.members?.includes(u._id);
                return (
                  <button
                    type="button"
                    key={u._id}
                    onClick={() => toggleMember(u._id)}
                    className={cn('flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors', selected ? 'bg-brand-50 dark:bg-brand-500/10' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800')}
                  >
                    <Avatar user={u} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{u.name}</p>
                      <p className="truncate text-xs text-zinc-500">{u.role}</p>
                    </div>
                    <span className={cn('flex h-4 w-4 items-center justify-center rounded border', selected ? 'border-brand-600 bg-brand-600 text-white' : 'border-zinc-300 dark:border-zinc-600')}>
                      {selected && <Check className="h-3 w-3" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>
        )}
      </form>
    </Modal>
  );
}
