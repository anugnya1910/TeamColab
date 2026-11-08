export const cn = (...classes) => classes.filter(Boolean).join(' ');

export const STATUSES = ['Todo', 'In Progress', 'Done'];
export const PRIORITIES = ['Low', 'Medium', 'High'];
export const PROJECT_STATUSES = ['Planning', 'Active', 'On Hold', 'Completed'];
export const PROJECT_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];
export const AVATAR_COLORS = PROJECT_COLORS;

export const STATUS_COLORS = { Todo: '#a1a1aa', 'In Progress': '#3b82f6', Done: '#10b981' };
export const PRIORITY_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#94a3b8' };

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?';

export const firstName = (name = '') => name.split(' ')[0];

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const daysUntil = (date) => Math.round((startOfDay(date) - startOfDay(new Date())) / 864e5);

export const formatDate = (d, opts = { month: 'short', day: 'numeric' }) =>
  d ? new Date(d).toLocaleDateString('en-US', opts) : '—';

export const formatFullDate = (d) => formatDate(d, { month: 'short', day: 'numeric', year: 'numeric' });

export const isOverdue = (task) => !!task?.dueDate && task.status !== 'Done' && new Date(task.dueDate) < new Date();

export const dueLabel = (date, status) => {
  if (!date) return 'No due date';
  if (status === 'Done') return formatDate(date);
  const diff = daysUntil(date);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < 0) return `${-diff}d overdue`;
  if (diff < 7) return `In ${diff} days`;
  return formatDate(date);
};

export const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return formatDate(date);
};

// yyyy-mm-dd for <input type="date">, using local time
export const toInputDate = (d) => {
  if (!d) return '';
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

// Store due dates as the end of the working day in local time
export const fromInputDate = (s) => (s ? new Date(`${s}T18:00:00`).toISOString() : null);

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};
