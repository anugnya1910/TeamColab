import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, Clock, FolderKanban, ListTodo, Plus, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { Avatar, AvatarStack, EmptyState, ErrorState, ProgressBar, Skeleton } from '../components/ui';
import { PriorityBadge, ProjectStatusBadge } from '../components/Badges';
import ActivityFeed from '../components/ActivityFeed';
import TaskDrawer from '../components/TaskDrawer';
import TaskFormModal from '../components/TaskFormModal';
import { ChartTooltip, Legend, axisProps, useChartTheme } from '../components/Charts';
import { STATUS_COLORS, cn, dueLabel, firstName, formatDate, greeting, isOverdue } from '../lib/utils';

function StatCard({ icon: Icon, label, value, sub, tone = 'zinc' }) {
  const tones = {
    zinc: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', tones[tone])}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>}
    </div>
  );
}

function CardHeader({ title, action, subtitle }) {
  return (
    <div className="flex items-center justify-between px-5 pt-5">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-72" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      <div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-80 lg:col-span-2" /><Skeleton className="h-80" /></div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi('/dashboard');
  const chart = useChartTheme();
  const [openTask, setOpenTask] = useState(null);
  const [newTask, setNewTask] = useState(false);

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { stats, productivity, upcomingDeadlines, recentActivity, projects } = data;
  const statusData = [
    { name: 'Todo', value: stats.todo },
    { name: 'In Progress', value: stats.inProgress },
    { name: 'Done', value: stats.completed },
  ];
  const weekCompleted = productivity.reduce((a, d) => a + d.completed, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {greeting()}, {firstName(user?.name)}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            You have <span className="font-medium text-zinc-900 dark:text-zinc-100">{stats.myOpen} open tasks</span> assigned to you
            {stats.overdue > 0 && <> and <span className="font-medium text-red-600 dark:text-red-400">{stats.overdue} overdue</span> across your projects</>}.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/board" className="btn-secondary">Open board</Link>
          <button className="btn-primary" onClick={() => setNewTask(true)}><Plus className="h-4 w-4" /> New task</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={FolderKanban} label="Total projects" value={stats.totalProjects} sub="Active workspaces" tone="brand" />
        <StatCard icon={ListTodo} label="Total tasks" value={stats.totalTasks} sub={`${stats.inProgress} in progress`} />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} sub={`${stats.completionRate}% completion rate`} tone="emerald" />
        <StatCard icon={Clock} label="Pending" value={stats.pending} sub={`${stats.todo} not started yet`} tone="amber" />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats.overdue} sub={stats.overdue ? 'Needs attention' : 'All on track'} tone="red" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <CardHeader
            title="Productivity"
            subtitle="Tasks created vs completed over the last 7 days"
            action={
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5" /> {weekCompleted} done this week
              </span>
            }
          />
          <div className="h-64 px-2 pb-2 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productivity} margin={{ top: 5, right: 16, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chart.success} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={chart.success} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chart.brand} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={chart.brand} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={chart.grid} />
                <XAxis dataKey="label" {...axisProps(chart)} />
                <YAxis allowDecimals={false} {...axisProps(chart)} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: chart.grid }} />
                <Area type="monotone" dataKey="created" name="Created" stroke={chart.brand} strokeWidth={2} fill="url(#gCreated)" />
                <Area type="monotone" dataKey="completed" name="Completed" stroke={chart.success} strokeWidth={2} fill="url(#gCompleted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="px-5 pb-4"><Legend items={[{ label: 'Created', color: chart.brand }, { label: 'Completed', color: chart.success }]} /></div>
        </div>

        <div className="card">
          <CardHeader title="Task status" subtitle="Distribution across all projects" />
          <div className="relative h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={82} paddingAngle={3} stroke="none">
                  {statusData.map((s) => <Cell key={s.name} fill={STATUS_COLORS[s.name]} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{stats.completionRate}%</p>
              <p className="text-xs text-zinc-500">complete</p>
            </div>
          </div>
          <div className="space-y-2 px-5 pb-5">
            {statusData.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.name] }} /> {s.name}
                </span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lists */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card">
          <CardHeader title="Upcoming deadlines" action={<Link to="/tasks?sort=dueDate" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">View all</Link>} />
          <div className="p-2">
            {upcomingDeadlines.length === 0 ? (
              <EmptyState compact icon={CalendarClock} title="No upcoming deadlines" description="You're all clear for now." />
            ) : (
              upcomingDeadlines.map((t) => (
                <button key={t._id} onClick={() => setOpenTask(t._id)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <span className="h-8 w-1 shrink-0 rounded-full" style={{ backgroundColor: t.project?.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{t.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <PriorityBadge priority={t.priority} />
                      <span className="truncate text-xs text-zinc-500">{t.project?.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-xs font-semibold', isOverdue(t) ? 'text-red-600' : 'text-zinc-700 dark:text-zinc-300')}>{dueLabel(t.dueDate, t.status)}</p>
                    <Avatar user={t.assignee} size="xs" className="ml-auto mt-1" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <CardHeader title="Recent activity" action={<Link to="/team" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">Team feed</Link>} />
          <div className="p-5">
            {recentActivity.length === 0 ? <EmptyState compact title="No activity yet" /> : <ActivityFeed items={recentActivity} />}
          </div>
        </div>

        <div className="card">
          <CardHeader title="Project progress" action={<Link to="/projects" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">All projects</Link>} />
          <div className="space-y-1 p-2">
            {projects.length === 0 ? (
              <EmptyState compact icon={FolderKanban} title="No projects yet" action={<Link to="/projects?new=1" className="btn-primary btn-sm">Create project</Link>} />
            ) : (
              projects.slice(0, 5).map((p) => (
                <Link key={p._id} to={`/projects/${p._id}`} className="group block rounded-lg px-3 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: p.color }} />
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{p.name}</p>
                    </div>
                    <ProjectStatusBadge status={p.status} />
                  </div>
                  <div className="mt-2.5 flex items-center gap-3">
                    <ProgressBar value={p.progress} color={p.color} />
                    <span className="w-9 text-right text-xs font-semibold text-zinc-700 dark:text-zinc-300">{p.progress}%</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                    <AvatarStack users={p.members} max={4} size="xs" />
                    <span className="flex items-center gap-1">Due {formatDate(p.deadline)} <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" /></span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      <TaskDrawer taskId={openTask} onClose={() => setOpenTask(null)} />
      <TaskFormModal open={newTask} onClose={() => setNewTask(false)} />
    </div>
  );
}
