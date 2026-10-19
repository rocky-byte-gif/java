import type { ReactNode } from 'react';

export const input =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

export const btn = {
  primary: 'inline-flex items-center justify-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50',
  ghost: 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800',
  danger: 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950',
};

export function Card({ title, icon, action, children, className = '' }: { title?: string; icon?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{icon}{title}</h2>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Field({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-rose-600 dark:text-rose-400">{error}</span>}
    </label>
  );
}

const tones: Record<string, string> = {
  green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  blue: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  red: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  gray: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};
export function Badge({ tone = 'gray', children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function Table({ head, children, empty }: { head: string[]; children: ReactNode; empty?: string }) {
  const hasRows = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
            {head.map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 font-semibold">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{children}</tbody>
      </table>
      {!hasRows && <p className="py-8 text-center text-sm text-slate-400">{empty ?? 'Nothing here yet.'}</p>}
    </div>
  );
}

export const td = 'whitespace-nowrap px-3 py-2.5';

export function PageHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">{sub}</p>
    </div>
  );
}
