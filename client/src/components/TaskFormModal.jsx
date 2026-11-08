import { useEffect, useState } from 'react';
import Modal from './Modal';
import { Field, Spinner } from './ui';
import api, { errMsg } from '../api/axios';
import { useToast } from '../context/ToastContext';
import { emitDataChanged, useApi } from '../hooks/useApi';
import { PRIORITIES, STATUSES, cn, fromInputDate, toInputDate } from '../lib/utils';

export default function TaskFormModal({ open, onClose, task, defaultProjectId, defaultStatus = 'Todo', onSaved }) {
  const isEdit = !!task;
  const toast = useToast();
  const { data: projects } = useApi(open ? '/projects' : null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      task
        ? {
            title: task.title,
            description: task.description || '',
            project: task.project?._id || task.project,
            assignee: task.assignee?._id || '',
            priority: task.priority,
            status: task.status,
            dueDate: toInputDate(task.dueDate),
          }
        : { title: '', description: '', project: defaultProjectId || '', assignee: '', priority: 'Medium', status: defaultStatus, dueDate: '' }
    );
  }, [open, task, defaultProjectId, defaultStatus]);

  // Default to the first project when creating
  useEffect(() => {
    if (open && !isEdit && projects?.length) {
      setForm((f) => (f.project ? f : { ...f, project: projects[0]._id }));
    }
  }, [projects, open, isEdit]);

  const project = projects?.find((p) => p._id === form.project);
  const members = project?.members || [];

  const set = (k) => (e) => {
    const value = e.target.value;
    setForm((f) => {
      const next = { ...f, [k]: value };
      if (k === 'project') {
        const p = projects?.find((x) => x._id === value);
        if (!p?.members.some((m) => m._id === f.assignee)) next.assignee = '';
      }
      return next;
    });
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.title?.trim()) e.title = 'Task title is required';
    else if (form.title.trim().length > 150) e.title = 'Title must be under 150 characters';
    if (!form.project) e.project = 'Please select a project';
    if ((form.description || '').length > 2000) e.description = 'Description is too long';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      status: form.status,
      assignee: form.assignee || null,
      dueDate: fromInputDate(form.dueDate),
    };
    try {
      const res = isEdit
        ? await api.put(`/tasks/${task._id}`, payload)
        : await api.post('/tasks', { ...payload, project: form.project });
      toast.success(isEdit ? 'Task updated' : 'Task created');
      emitDataChanged();
      onSaved?.(res.data);
      onClose();
    } catch (err) {
      toast.error(errMsg(err, 'Could not save the task'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit task' : 'New task'}
      description={isEdit ? 'Update the details of this task.' : 'Add a task and assign it to a teammate.'}
      size="lg"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" form="task-form" className="btn-primary" disabled={saving}>
            {saving && <Spinner />} {isEdit ? 'Save changes' : 'Create task'}
          </button>
        </>
      }
    >
      <form id="task-form" onSubmit={submit} className="grid gap-4 p-6 sm:grid-cols-2" noValidate>
        <Field label="Title" error={errors.title} className="sm:col-span-2">
          <input autoFocus className={cn('input', errors.title && 'input-error')} placeholder="e.g. Design the checkout page" value={form.title || ''} onChange={set('title')} />
        </Field>
        <Field label="Description" error={errors.description} className="sm:col-span-2">
          <textarea rows={3} className={cn('input resize-none', errors.description && 'input-error')} placeholder="Add more context…" value={form.description || ''} onChange={set('description')} />
        </Field>
        <Field label="Project" error={errors.project}>
          <select className={cn('input', errors.project && 'input-error')} value={form.project || ''} onChange={set('project')} disabled={isEdit}>
            {!projects && <option>Loading…</option>}
            {projects?.length === 0 && <option value="">Create a project first</option>}
            {projects?.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Assignee">
          <select className="input" value={form.assignee || ''} onChange={set('assignee')}>
            <option value="">Unassigned</option>
            {members.map((m) => <option key={m._id} value={m._id}>{m.name} — {m.role}</option>)}
          </select>
        </Field>
        <Field label="Priority">
          <div className="grid grid-cols-3 gap-1.5">
            {PRIORITIES.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setForm((f) => ({ ...f, priority: p }))}
                className={cn(
                  'rounded-lg border px-2 py-2 text-xs font-medium transition-colors',
                  form.priority === p
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                    : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Status">
          <select className="input" value={form.status || 'Todo'} onChange={set('status')}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Due date" className="sm:col-span-2">
          <input type="date" className="input" value={form.dueDate || ''} onChange={set('dueDate')} />
        </Field>
      </form>
    </Modal>
  );
}
