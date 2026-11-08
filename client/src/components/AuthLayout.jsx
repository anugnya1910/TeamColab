import { CheckCircle2, Circle, Timer } from 'lucide-react';
import { Logo } from './Layout';

const PREVIEW = [
  { col: 'To Do', icon: Circle, iconCls: 'text-zinc-500', cards: [{ t: 'Write API docs', p: 'Medium', c: '#f59e0b' }, { t: 'Plan user testing', p: 'Low', c: '#94a3b8' }] },
  { col: 'In Progress', icon: Timer, iconCls: 'text-blue-400', cards: [{ t: 'Payment gateway', p: 'High', c: '#ef4444' }, { t: 'Onboarding wireframes', p: 'Medium', c: '#f59e0b' }] },
  { col: 'Done', icon: CheckCircle2, iconCls: 'text-emerald-400', cards: [{ t: 'JWT authentication', p: 'High', c: '#ef4444' }] },
];

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950">
      {/* Brand panel */}
      <div className="relative hidden w-[52%] flex-col justify-between overflow-hidden bg-zinc-950 p-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '44px 44px' }}
        />
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-600/25 blur-3xl" />

        <Logo light className="relative" />

        <div className="relative">
          <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight text-white">
            Plan, track and ship work — together.
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-zinc-400">
            TeamSync brings projects, tasks, deadlines and conversations into one focused workspace for student and developer teams.
          </p>

          {/* Mini product preview */}
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur">
            {PREVIEW.map((col) => (
              <div key={col.col} className="rounded-xl bg-white/[0.04] p-2">
                <div className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-medium text-zinc-300">
                  <col.icon className={`h-3 w-3 ${col.iconCls}`} /> {col.col}
                </div>
                <div className="space-y-2">
                  {col.cards.map((c) => (
                    <div key={c.t} className="rounded-lg border border-white/10 bg-zinc-900/80 p-2.5">
                      <p className="text-[11px] font-medium leading-snug text-zinc-100">{c.t}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="rounded px-1 py-0.5 text-[9px] font-medium" style={{ color: c.c, backgroundColor: `${c.c}1f` }}>{c.p}</span>
                        <span className="h-4 w-4 rounded-full bg-brand-500/80" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex gap-10 text-sm">
          {[['Kanban', 'drag & drop boards'], ['Analytics', 'real-time insights'], ['Teams', 'comments & activity']].map(([a, b]) => (
            <div key={a}>
              <p className="font-semibold text-white">{a}</p>
              <p className="text-zinc-500">{b}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Logo className="mb-10 lg:hidden" />
          {children}
        </div>
      </div>
    </div>
  );
}
