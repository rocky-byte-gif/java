import { Activity, CalendarCheck, Clock, Download, IndianRupee, RotateCcw, Users } from 'lucide-react';
import { Badge, btn, Card, PageHeader } from '../components/ui';
import { download, doctorName, exportSql, money, patientName, resetData, useStore, SLOTS } from '../lib/store';

const levelTone = { info: 'gray', success: 'green', warn: 'amber', error: 'red' } as const;

export default function Dashboard() {
  const s = useStore();
  const booked = s.appointments.filter((a) => a.status === 'Booked');
  const collected = s.bills.filter((b) => b.status === 'Paid').reduce((t, b) => t + b.total, 0);
  const pending = s.bills.filter((b) => b.status === 'Pending').reduce((t, b) => t + b.total, 0);

  const stats = [
    { label: 'Patients', value: s.patients.length, icon: <Users size={18} />, color: 'text-cyan-600' },
    { label: 'Booked slots', value: booked.length, icon: <CalendarCheck size={18} />, color: 'text-emerald-600' },
    { label: 'On waitlist', value: s.waitlist.length, icon: <Clock size={18} />, color: 'text-amber-600' },
    { label: 'Collected', value: money(collected), icon: <IndianRupee size={18} />, color: 'text-violet-600' },
  ];

  return (
    <>
      <PageHeader title="Dashboard" sub="Clinic overview for today" />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((x) => (
          <div key={x.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className={`mb-2 ${x.color}`}>{x.icon}</div>
            <div className="text-2xl font-bold">{x.value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{x.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Doctor load" icon={<Activity size={16} className="text-cyan-600" />}>
          <div className="space-y-4">
            {s.doctors.map((d) => {
              const n = booked.filter((a) => a.doctorId === d.id).length;
              return (
                <div key={d.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{d.name} <span className="text-slate-400">· {d.specialization}</span></span>
                    <span className="font-mono text-xs text-slate-500">{n}/{SLOTS.length}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${(n / SLOTS.length) * 100}%` }} />
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-slate-500">Pending payments: <b>{money(pending)}</b></p>
          </div>
        </Card>

        <Card title="Upcoming appointments">
          {booked.length === 0 ? <p className="py-6 text-center text-sm text-slate-400">No booked appointments.</p> : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {[...booked].sort((a, b) => a.slot.localeCompare(b.slot)).slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                  <span><span className="font-mono text-cyan-600">{a.slot}</span> · {patientName(s, a.patientId)}</span>
                  <span className="text-slate-500">{doctorName(s, a.doctorId)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recent activity" className="lg:col-span-2">
          <ul className="space-y-2">
            {s.log.slice(0, 8).map((l) => (
              <li key={l.id} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 font-mono text-xs text-slate-400">{l.time}</span>
                <Badge tone={levelTone[l.level]}>{l.level}</Badge>
                <span className="min-w-0 flex-1 break-words">{l.msg}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Data" className="lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            <button className={btn.ghost} onClick={() => download('medisync-export.sql', exportSql(s), 'application/sql')}><Download size={15} />Export SQL</button>
            <button className={btn.ghost} onClick={() => download('medisync-export.json', JSON.stringify(s, null, 2), 'application/json')}><Download size={15} />Export JSON</button>
            <button className={btn.danger} onClick={() => { if (confirm('Reset all data to the demo set?')) resetData(); }}><RotateCcw size={15} />Reset demo data</button>
          </div>
          <p className="mt-3 text-xs text-slate-500">Data is stored in this browser (localStorage). The SQL export matches the schema in <code className="font-mono">database.sql</code>.</p>
        </Card>
      </div>
    </>
  );
}
