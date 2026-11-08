import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3, Bell, CheckCircle2, ChevronDown, Columns3, FolderKanban, LayoutDashboard, ListTodo,
  LogOut, Menu, MessageSquare, Moon, Plus, Search, Sun, User, UserPlus, Users, X, AlertTriangle, ArrowRightLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useApi, useClickOutside } from '../hooks/useApi';
import api from '../api/axios';
import { Avatar } from './ui';
import TaskFormModal from './TaskFormModal';
import { cn, timeAgo } from '../lib/utils';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/board', label: 'Kanban Board', icon: Columns3 },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export function Logo({ className, light }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 shadow-sm">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round">
          <path d="M6 7h12M12 7v11" />
        </svg>
      </div>
      <span className={cn('text-[15px] font-semibold tracking-tight', light ? 'text-white' : 'text-zinc-900 dark:text-zinc-50')}>TeamSync</span>
    </div>
  );
}

/* ---------------- Sidebar ---------------- */
function Sidebar({ mobileOpen, onClose, onNewTask }) {
  const { user, logout } = useAuth();
  const { data: projects } = useApi('/projects');
  const navigate = useNavigate();

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Link to="/dashboard"><Logo /></Link>
        <button className="icon-btn h-8 w-8 lg:hidden" onClick={onClose}><X className="h-4 w-4" /></button>
      </div>

      <div className="px-3">
        <button onClick={onNewTask} className="btn-primary w-full">
          <Plus className="h-4 w-4" /> New task
        </button>
      </div>

      <nav className="mt-5 space-y-0.5 px-3">
        <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Workspace</p>
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white text-zinc-900 shadow-card ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700'
                  : 'text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 min-h-0 flex-1 overflow-y-auto px-3">
        <div className="mb-1.5 flex items-center justify-between px-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Projects</p>
          <button onClick={() => navigate('/projects?new=1')} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200" title="New project">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        {projects?.map((p) => (
          <NavLink
            key={p._id}
            to={`/projects/${p._id}`}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors',
                isActive ? 'bg-zinc-200/60 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100' : 'text-zinc-600 hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:bg-zinc-800/60'
              )
            }
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: p.color }} />
            <span className="truncate">{p.name}</span>
            <span className="ml-auto text-[11px] text-zinc-400">{p.progress}%</span>
          </NavLink>
        ))}
        {projects?.length === 0 && <p className="px-2.5 text-xs text-zinc-400">No projects yet</p>}
      </div>

      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
          <Link to="/profile" className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar user={user} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{user?.name}</p>
              <p className="truncate text-xs text-zinc-500">{user?.role}</p>
            </div>
          </Link>
          <button onClick={logout} className="icon-btn h-8 w-8" title="Log out"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 lg:block">{content}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-zinc-950/40" onClick={onClose} />
          <aside className="relative h-full w-72 animate-slide-up border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">{content}</aside>
        </div>
      )}
    </>
  );
}

/* ---------------- Global search ---------------- */
function GlobalSearch() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  useClickOutside(ref, () => setOpen(false));

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults(null);
      return undefined;
    }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get('/search', { params: { q: q.trim() } });
        setResults(data);
      } catch {
        /* ignore */
      }
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  const go = (path) => {
    setOpen(false);
    setQ('');
    inputRef.current?.blur();
    navigate(path);
  };

  const total = results ? results.projects.length + results.tasks.length + results.members.length : 0;

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && q.trim()) go(`/tasks?search=${encodeURIComponent(q.trim())}`);
          if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
        }}
        placeholder="Search projects, tasks, people…"
        className="input h-9 bg-zinc-50 pl-9 pr-14 dark:bg-zinc-900"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 sm:block">
        Ctrl K
      </kbd>

      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-11 z-50 max-h-[70vh] animate-scale-in overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-pop dark:border-zinc-700 dark:bg-zinc-900">
          {!results && <p className="px-3 py-4 text-center text-sm text-zinc-400">Searching…</p>}
          {results && total === 0 && <p className="px-3 py-4 text-center text-sm text-zinc-400">No results for “{q}”</p>}
          {results?.projects.length > 0 && (
            <Group title="Projects">
              {results.projects.map((p) => (
                <ResultItem key={p._id} onClick={() => go(`/projects/${p._id}`)}>
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: p.color }} />
                  <span className="truncate">{p.name}</span>
                  <span className="ml-auto text-xs text-zinc-400">{p.status}</span>
                </ResultItem>
              ))}
            </Group>
          )}
          {results?.tasks.length > 0 && (
            <Group title="Tasks">
              {results.tasks.map((t) => (
                <ResultItem key={t._id} onClick={() => go(`/tasks?task=${t._id}`)}>
                  <ListTodo className="h-4 w-4 text-zinc-400" />
                  <span className="truncate">{t.title}</span>
                  <span className="ml-auto truncate text-xs text-zinc-400">{t.project?.name}</span>
                </ResultItem>
              ))}
            </Group>
          )}
          {results?.members.length > 0 && (
            <Group title="People">
              {results.members.map((m) => (
                <ResultItem key={m._id} onClick={() => go(`/team?member=${m._id}`)}>
                  <Avatar user={m} size="xs" />
                  <span className="truncate">{m.name}</span>
                  <span className="ml-auto text-xs text-zinc-400">{m.role}</span>
                </ResultItem>
              ))}
            </Group>
          )}
        </div>
      )}
    </div>
  );
}

const Group = ({ title, children }) => (
  <div className="py-1">
    <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{title}</p>
    {children}
  </div>
);

const ResultItem = ({ children, onClick }) => (
  <button onClick={onClick} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800">
    {children}
  </button>
);

/* ---------------- Notifications ---------------- */
const NOTIF_ICONS = {
  task_assigned: { icon: UserPlus, cls: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' },
  comment: { icon: MessageSquare, cls: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400' },
  status_change: { icon: ArrowRightLeft, cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
  project_invite: { icon: FolderKanban, cls: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400' },
  deadline: { icon: AlertTriangle, cls: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
  info: { icon: Bell, cls: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
};

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();
  const { data, setData, reload } = useApi('/notifications');
  useClickOutside(ref, () => setOpen(false));

  useEffect(() => {
    const t = setInterval(() => reload(true), 30000);
    return () => clearInterval(t);
  }, [reload]);

  const items = data?.items || [];
  const unread = data?.unreadCount || 0;

  const openItem = async (n) => {
    setOpen(false);
    if (!n.read) {
      setData((d) => ({ items: d.items.map((x) => (x._id === n._id ? { ...x, read: true } : x)), unreadCount: Math.max(0, d.unreadCount - 1) }));
      api.patch(`/notifications/${n._id}/read`).catch(() => {});
    }
    if (n.link) navigate(n.link);
  };

  const markAll = async () => {
    setData((d) => ({ items: d.items.map((x) => ({ ...x, read: true })), unreadCount: 0 }));
    try {
      await api.patch('/notifications/read-all');
      toast.success('All notifications marked as read');
    } catch {
      reload(true);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="icon-btn relative" aria-label="Notifications">
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white dark:ring-zinc-950">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-[22rem] max-w-[calc(100vw-2rem)] animate-scale-in overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-pop dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Notifications</h3>
              {unread > 0 && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">{unread} new</span>}
            </div>
            {unread > 0 && (
              <button onClick={markAll} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[26rem] overflow-y-auto">
            {items.length === 0 && (
              <div className="flex flex-col items-center py-10 text-center">
                <Bell className="mb-2 h-6 w-6 text-zinc-300" />
                <p className="text-sm text-zinc-500">You're all caught up</p>
              </div>
            )}
            {items.map((n) => {
              const { icon: Icon, cls } = NOTIF_ICONS[n.type] || NOTIF_ICONS.info;
              return (
                <button
                  key={n._id}
                  onClick={() => openItem(n)}
                  className={cn('flex w-full items-start gap-3 border-b border-zinc-50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-zinc-50 dark:border-zinc-800/60 dark:hover:bg-zinc-800/50', !n.read && 'bg-brand-50/40 dark:bg-brand-500/[0.04]')}
                >
                  <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', cls)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm leading-snug', n.read ? 'text-zinc-600 dark:text-zinc-400' : 'font-medium text-zinc-900 dark:text-zinc-100')}>{n.message}</p>
                    <p className="mt-1 text-xs text-zinc-400">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- User menu ---------------- */
function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  useClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800">
        <Avatar user={user} size="sm" />
        <ChevronDown className="hidden h-3.5 w-3.5 text-zinc-400 sm:block" />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-56 animate-scale-in rounded-xl border border-zinc-200 bg-white p-1.5 shadow-pop dark:border-zinc-700 dark:bg-zinc-900">
          <div className="px-2.5 py-2">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-zinc-500">{user?.email}</p>
          </div>
          <div className="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />
          <button onClick={() => { setOpen(false); navigate('/profile'); }} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800">
            <User className="h-4 w-4" /> Profile & settings
          </button>
          <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Layout ---------------- */
export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [taskModal, setTaskModal] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} onNewTask={() => setTaskModal(true)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-zinc-200 bg-white/80 px-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 sm:px-6">
          <button className="icon-btn lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-1">
            <button onClick={toggleTheme} className="icon-btn" title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
              {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>
            <NotificationBell />
            <div className="mx-1 h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div key={location.pathname} className="mx-auto max-w-[1400px] animate-fade-in p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
      <TaskFormModal open={taskModal} onClose={() => setTaskModal(false)} />
    </div>
  );
}
