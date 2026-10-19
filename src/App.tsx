import { Activity, CalendarClock, FlaskConical, LayoutDashboard, Moon, Receipt, Stethoscope, Sun, Users } from 'lucide-react';
import { useState } from 'react';
import Appointments from './pages/Appointments';
import Billing from './pages/Billing';
import Dashboard from './pages/Dashboard';
import Lab from './pages/Lab';
import Patients from './pages/Patients';
import Records from './pages/Records';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, page: Dashboard },
  { id: 'patients', label: 'Patients', icon: Users, page: Patients },
  { id: 'appointments', label: 'Appointments', icon: CalendarClock, page: Appointments },
  { id: 'records', label: 'Records', icon: Stethoscope, page: Records },
  { id: 'billing', label: 'Billing', icon: Receipt, page: Billing },
  { id: 'lab', label: 'Concurrency lab', icon: FlaskConical, page: Lab },
] as const;

export default function App() {
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('dashboard');
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const Page = tabs.find((t) => t.id === tab)!.page;

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('medisync-theme', next ? 'dark' : 'light'); } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-4 py-3 lg:py-5">
          <div className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <Activity className="text-cyan-600" size={22} />MediSync<span className="text-cyan-600">Lite</span>
          </div>
          <button onClick={toggle} aria-label="Toggle dark mode" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-0">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${tab === id
                ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
              <Icon size={17} />{label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 hidden lg:block">
          <button onClick={toggle} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            {dark ? <Sun size={16} /> : <Moon size={16} />}{dark ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl"><Page /></div>
      </main>
    </div>
  );
}
