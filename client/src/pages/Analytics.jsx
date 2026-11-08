import { useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { AlertTriangle, CheckCircle2, Gauge, Timer } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { ErrorState, PageHeader, Segmented, Skeleton, ProgressBar } from '../components/ui';
import { ChartTooltip, Legend, axisProps, useChartTheme } from '../components/Charts';
import { PRIORITY_COLORS, STATUS_COLORS } from '../lib/utils';

function Kpi({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}1a`, color }}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {sub && <p className="text-xs text-zinc-400">{sub}</p>}
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children, footer, className = '' }) {
  return (
    <div className={`card ${className}`}>
      <div className="px-5 pt-5">
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
      </div>
      <div className="px-2 pb-2 pt-4">{children}</div>
      {footer && <div className="px-5 pb-5">{footer}</div>}
    </div>
  );
}

export default function Analytics() {
  const [days, setDays] = useState('30');
  const { data, loading, error, reload } = useApi(`/analytics?days=${days}`);
  const chart = useChartTheme();

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Track delivery, workload and progress across every project."
        actions={<Segmented options={[{ value: '7', label: '7 days' }, { value: '14', label: '14 days' }, { value: '30', label: '30 days' }]} value={days} onChange={setDays} />}
      />

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
          <Skeleton className="h-80" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi icon={Gauge} label="Overall completion" value={`${data.summary.completionRate}%`} sub={`${data.summary.totalTasks} total tasks`} color="#6366f1" />
            <Kpi icon={CheckCircle2} label={`Completed (${days}d)`} value={data.summary.completedInRange} sub={`${data.summary.createdInRange} created in same period`} color="#10b981" />
            <Kpi icon={Timer} label="Avg. time to complete" value={`${data.summary.avgCompletionDays}d`} sub="From creation to done" color="#3b82f6" />
            <Kpi icon={AlertTriangle} label="Overdue tasks" value={data.summary.overdue} sub={data.summary.overdue ? 'Past their due date' : 'Everything on schedule'} color="#ef4444" />
          </div>

          <ChartCard
            title="Tasks completed over time"
            subtitle={`Daily created vs completed tasks — last ${days} days`}
            footer={<Legend items={[{ label: 'Completed', color: chart.success }, { label: 'Created', color: chart.brand }]} />}
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeline} margin={{ top: 5, right: 16, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aDone" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chart.success} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={chart.success} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={chart.grid} />
                  <XAxis dataKey="label" {...axisProps(chart)} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis allowDecimals={false} {...axisProps(chart)} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: chart.grid }} />
                  <Area type="monotone" dataKey="created" name="Created" stroke={chart.brand} strokeWidth={2} strokeDasharray="4 3" fill="none" />
                  <Area type="monotone" dataKey="completed" name="Completed" stroke={chart.success} strokeWidth={2} fill="url(#aDone)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Task distribution by status"
              subtitle="Where all work currently stands"
              footer={<Legend items={data.statusDistribution.map((s) => ({ label: s.name, color: STATUS_COLORS[s.name], value: s.value }))} />}
            >
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.statusDistribution} dataKey="value" nameKey="name" innerRadius={62} outerRadius={95} paddingAngle={3} stroke="none">
                      {data.statusDistribution.map((s) => <Cell key={s.name} fill={STATUS_COLORS[s.name]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard
              title="Priority distribution"
              subtitle="Open vs completed tasks per priority"
              footer={<Legend items={[{ label: 'Open', color: '#6366f1' }, { label: 'Done', color: '#10b981' }]} />}
            >
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.priorityDistribution} margin={{ top: 5, right: 16, left: -16, bottom: 0 }} barGap={6}>
                    <CartesianGrid vertical={false} stroke={chart.grid} />
                    <XAxis dataKey="name" {...axisProps(chart)} />
                    <YAxis allowDecimals={false} {...axisProps(chart)} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: chart.cursor }} />
                    <Bar dataKey="open" name="Open" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    <Bar dataKey="done" name="Done" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Project completion" subtitle="Percentage of tasks done per project">
              <div className="space-y-5 px-3 pb-3">
                {data.projectCompletion.length === 0 && <p className="text-sm text-zinc-400">No projects yet.</p>}
                {data.projectCompletion.map((p) => (
                  <div key={p.id}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: p.color }} />{p.name}
                      </span>
                      <span className="text-zinc-500"><span className="font-semibold text-zinc-900 dark:text-zinc-100">{p.progress}%</span> · {p.completed}/{p.total}</span>
                    </div>
                    <ProgressBar value={p.progress} color={p.color} className="h-2.5" />
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard
              title="Team workload"
              subtitle="Tasks per member by status"
              footer={<Legend items={[{ label: 'Todo', color: STATUS_COLORS.Todo }, { label: 'In Progress', color: STATUS_COLORS['In Progress'] }, { label: 'Done', color: STATUS_COLORS.Done }]} />}
            >
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.workload} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid horizontal={false} stroke={chart.grid} />
                    <XAxis type="number" allowDecimals={false} {...axisProps(chart)} />
                    <YAxis type="category" dataKey="name" width={70} {...axisProps(chart)} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: chart.cursor }} />
                    <Bar dataKey="todo" name="Todo" stackId="a" fill={STATUS_COLORS.Todo} maxBarSize={18} />
                    <Bar dataKey="inProgress" name="In Progress" stackId="a" fill={STATUS_COLORS['In Progress']} maxBarSize={18} />
                    <Bar dataKey="done" name="Done" stackId="a" fill={STATUS_COLORS.Done} radius={[0, 4, 4, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
          <p className="text-center text-xs text-zinc-400">Priority colors: <span style={{ color: PRIORITY_COLORS.High }}>High</span> · <span style={{ color: PRIORITY_COLORS.Medium }}>Medium</span> · <span style={{ color: PRIORITY_COLORS.Low }}>Low</span></p>
        </div>
      )}
    </div>
  );
}
