import { useTheme } from '../context/ThemeContext';

export function useChartTheme() {
  const { isDark } = useTheme();
  return {
    grid: isDark ? '#27272a' : '#f0f0f2',
    axis: isDark ? '#71717a' : '#a1a1aa',
    cursor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    brand: '#6366f1',
    success: '#10b981',
  };
}

export const axisProps = (theme) => ({
  tick: { fontSize: 11, fill: theme.axis },
  axisLine: false,
  tickLine: false,
});

export function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-pop dark:border-zinc-700 dark:bg-zinc-900">
      <p className="mb-1 font-medium text-zinc-900 dark:text-zinc-100">{label ?? payload[0].name}</p>
      {payload.map((p) => (
        <div key={p.dataKey || p.name} className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color || p.payload?.fill }} />
          <span>{p.name}</span>
          <span className="ml-auto pl-3 font-semibold text-zinc-900 dark:text-zinc-100">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function Legend({ items }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: i.color }} />
          {i.label}
          {i.value !== undefined && <span className="font-semibold text-zinc-700 dark:text-zinc-200">{i.value}</span>}
        </div>
      ))}
    </div>
  );
}
