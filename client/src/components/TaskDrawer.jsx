import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Flag, FolderKanban, Pencil, Send, Trash2, User, X } from 'lucide-react';
import { Avatar, Spinner, Skeleton } from './ui';
import { PriorityBadge } from './Badges';
import TaskFormModal from './TaskFormModal';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { emitDataChanged } from '../hooks/useApi';
import { STATUSES, cn, dueLabel, formatFullDate, isOverdue, timeAgo } from '../lib/utils';

const STATUS_STYLE = {
  Todo: 'data-[active=true]:bg-zinc-900 data-[active=true]:text-white dark:data-[active=true]:bg-zinc-100 dark:data-[active=true]:text-zinc-900',
  'In Progress': 'data-[active=true]:bg-blue-600 data-[active=true]:text-white',
  Done: 'data-[active=true]:bg-emerald-600 data-[active=true]:text-white',
};

function Meta({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex w-28 shrink-0 items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="min-w-0 flex-1 text-sm text-zinc-800 dark:text-zinc-200">{children}</div>
    </div>
  );
}

export default function TaskDrawer({ taskId, onClose }) {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    if (!taskId) return;
    try {
      const [t, c] = await Promise.all([api.get(`/tasks/${taskId}`), api.get(`/tasks/${taskId}/comments`)]);
      setTask(t.data);
      setComments(c.data);
    } catch (e) {
      toast.error(errMsg(e, 'Could not load the task'));
      onClose();
    }
  }, [taskId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setTask(null);
    setComments([]);
    setText('');
    load();
  }, [load]);

  useEffect(() => {
    if (!taskId) return undefined;
    const onKey = (e) => e.key === 'Escape' && !editOpen && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [taskId, editOpen, onClose]);

  if (!taskId) return null;

  const changeStatus = async (status) => {
    if (!task || task.status === status) return;
    const prev = task;
    setTask({ ...task, status });
    try {
      const res = await api.patch(`/tasks/${task._id}/status`, { status });
      setTask(res.data);
      toast.success(`Moved to ${status}`);
      emitDataChanged();
    } catch (e) {
      setTask(prev);
      toast.error(errMsg(e));
    }
  };

  const remove = async () => {
    const ok = await confirm({
      title: 'Delete this task?',
      message: `"${task.title}" and its comments will be permanently deleted.`,
      confirmText: 'Delete task',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      toast.success('Task deleted');
      emitDataChanged();
      onClose();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const postComment = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    try {
      const res = await api.post(`/tasks/${task._id}/comments`, { text: text.trim() });
      setComments((c) => [...c, res.data]);
      setText('');
      emitDataChanged();
    } catch (err) {
      toast.error(errMsg(err, 'Could not post comment'));
    } finally {
      setPosting(false);
    }
  };

  const deleteComment = async (c) => {
    if (!(await confirm({ title: 'Delete comment?', confirmText: 'Delete', danger: true }))) return;
    try {
      await api.delete(`/tasks/${task._id}/comments/${c._id}`);
      setComments((list) => list.filter((x) => x._id !== c._id));
      emitDataChanged();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 animate-fade-in bg-zinc-950/30" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-xl animate-slide-in flex-col border-l border-zinc-200 bg-white shadow-pop dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            {task?.project && (
              <Link to={`/projects/${task.project._id}`} onClick={onClose} className="flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: task.project.color }} />
                {task.project.name}
              </Link>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button className="icon-btn h-8 w-8" onClick={() => setEditOpen(true)} disabled={!task} title="Edit task"><Pencil className="h-4 w-4" /></button>
            <button className="icon-btn h-8 w-8 hover:text-red-600" onClick={remove} disabled={!task} title="Delete task"><Trash2 className="h-4 w-4" /></button>
            <button className="icon-btn h-8 w-8" onClick={onClose} title="Close"><X className="h-4 w-4" /></button>
          </div>
        </div>

        {!task ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <h2 className="text-xl font-semibold leading-snug text-zinc-900 dark:text-zinc-50">{task.title}</h2>

              {/* Status switcher */}
              <div className="mt-4 inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-800/60">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    data-active={task.status === s}
                    onClick={() => changeStatus(s)}
                    className={cn('rounded-md px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100', STATUS_STYLE[s])}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="mt-5 divide-y divide-zinc-100 border-y border-zinc-100 dark:divide-zinc-800 dark:border-zinc-800">
                <Meta icon={User} label="Assignee">
                  <div className="flex items-center gap-2">
                    <Avatar user={task.assignee} size="xs" />
                    {task.assignee ? (
                      <span>{task.assignee.name} <span className="text-zinc-400">· {task.assignee.role}</span></span>
                    ) : (
                      <span className="text-zinc-400">Unassigned</span>
                    )}
                  </div>
                </Meta>
                <Meta icon={Flag} label="Priority"><PriorityBadge priority={task.priority} /></Meta>
                <Meta icon={Calendar} label="Due date">
                  {task.dueDate ? (
                    <span className={cn(isOverdue(task) && 'font-medium text-red-600 dark:text-red-400')}>
                      {formatFullDate(task.dueDate)} <span className="text-zinc-400">· {dueLabel(task.dueDate, task.status)}</span>
                    </span>
                  ) : (
                    <span className="text-zinc-400">No due date</span>
                  )}
                </Meta>
                <Meta icon={FolderKanban} label="Project">{task.project?.name}</Meta>
                <Meta icon={Clock} label="Created">
                  {formatFullDate(task.createdAt)} <span className="text-zinc-400">by {task.createdBy?.name}</span>
                </Meta>
              </div>

              <div className="mt-5">
                <h3 className="section-title mb-2">Description</h3>
                {task.description ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{task.description}</p>
                ) : (
                  <p className="text-sm text-zinc-400">No description provided.</p>
                )}
              </div>

              <div className="mt-7">
                <h3 className="section-title mb-3">Comments <span className="font-normal text-zinc-400">({comments.length})</span></h3>
                {comments.length === 0 && <p className="text-sm text-zinc-400">No comments yet — start the conversation.</p>}
                <ul className="space-y-4">
                  {comments.map((c) => (
                    <li key={c._id} className="group flex gap-3">
                      <Avatar user={c.author} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{c.author?.name}</span>
                          <span className="text-xs text-zinc-400">{timeAgo(c.createdAt)}</span>
                          {c.author?._id === user?._id && (
                            <button onClick={() => deleteComment(c)} className="ml-auto text-xs text-zinc-400 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100">
                              Delete
                            </button>
                          )}
                        </div>
                        <p className="mt-1 rounded-lg rounded-tl-none bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-300">{c.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <form onSubmit={postComment} className="flex items-end gap-2 border-t border-zinc-100 p-4 dark:border-zinc-800">
              <Avatar user={user} size="sm" />
              <textarea
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) postComment(e);
                }}
                placeholder="Write a comment…  (Enter to send)"
                className="input min-h-[38px] flex-1 resize-none"
                maxLength={1000}
              />
              <button type="submit" className="btn-primary h-[38px] px-3" disabled={posting || !text.trim()}>
                {posting ? <Spinner /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </>
        )}
      </aside>
      <TaskFormModal open={editOpen} onClose={() => setEditOpen(false)} task={task} onSaved={(t) => setTask(t)} />
    </div>,
    document.body
  );
}
