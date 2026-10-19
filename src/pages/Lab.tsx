import { FlaskConical, ShieldCheck, ShieldOff } from 'lucide-react';
import { useState } from 'react';
import { Badge, btn, Card, Field, input, PageHeader } from '../components/ui';
import { bookAppointment, doctorName, log, SLOTS, useStore } from '../lib/store';
import type { BookResult } from '../types';

const levelTone = { info: 'gray', success: 'green', warn: 'amber', error: 'red' } as const;

export default function Lab() {
  const s = useStore();
  const [doctorId, setDoctorId] = useState(1);
  const [slot, setSlot] = useState('11:00');
  const [count, setCount] = useState(5);
  const [safe, setSafe] = useState(true);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<(BookResult & { safe: boolean })[]>([]);
  const max = Math.max(2, s.patients.length);
  const n = Math.min(count, s.patients.length);

  const run = async () => {
    setRunning(true);
    setResults([]);
    const crowd = s.patients.slice(0, n);
    log('info', `Concurrency test: ${n} simultaneous requests for ${doctorName(s, doctorId)} @ ${slot} (${safe ? 'mutex ON' : 'mutex OFF'})`);
    const out = await Promise.all(crowd.map((p) => bookAppointment(p.id, doctorId, slot, safe)));
    setResults(out.map((r) => ({ ...r, safe })));
    setRunning(false);
  };

  const booked = results.filter((r) => r.ok).length;
  const waitlisted = results.filter((r) => r.waitlisted).length;
  const raced = results.length > 0 && booked > 1;

  return (
    <>
      <PageHeader title="Concurrency lab" sub="Fire simultaneous booking requests at one slot, with and without the lock" />
      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Simulation" icon={<FlaskConical size={16} className="text-cyan-600" />}>
          <div className="space-y-3">
            <Field label="Doctor">
              <select className={input} value={doctorId} onChange={(e) => setDoctorId(Number(e.target.value))}>
                {s.doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Slot">
              <select className={input} value={slot} onChange={(e) => setSlot(e.target.value)}>
                {SLOTS.map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field label={`Simultaneous requests: ${n}`}>
              <input type="range" min={2} max={max} value={n} onChange={(e) => setCount(Number(e.target.value))} className="w-full accent-cyan-600" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setSafe(true)} className={`${btn.ghost} ${safe ? '!border-emerald-500 !bg-emerald-50 dark:!bg-emerald-950' : ''}`}><ShieldCheck size={15} />Mutex ON</button>
              <button onClick={() => setSafe(false)} className={`${btn.ghost} ${!safe ? '!border-rose-500 !bg-rose-50 dark:!bg-rose-950' : ''}`}><ShieldOff size={15} />Mutex OFF</button>
            </div>
            <button className={`${btn.primary} w-full`} onClick={run} disabled={running || s.patients.length < 2}>{running ? 'Running…' : 'Run simulation'}</button>
            <p className="text-xs text-slate-500">Tip: free the slot first (cancel its booking) for a clean run. With the mutex off, several patients can win the same slot; fix it on the Appointments page.</p>
          </div>
        </Card>

        <Card title="Result" className="xl:col-span-2">
          {results.length === 0 ? <p className="py-10 text-center text-sm text-slate-400">Run a simulation to see the outcome.</p> : (
            <>
              <div className={`mb-3 rounded-lg px-3 py-2 text-sm font-medium ${raced ? 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200' : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'}`}>
                {raced ? `Race condition: ${booked} patients booked the same slot.` : `Consistent: ${booked} booked, ${waitlisted} waitlisted, ${results.length - booked - waitlisted} rejected.`}
              </div>
              <ul className="space-y-1.5 text-sm">
                {results.map((r, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Badge tone={r.ok ? 'green' : r.waitlisted ? 'amber' : 'gray'}>{r.ok ? 'booked' : r.waitlisted ? 'waitlist' : 'rejected'}</Badge>
                    <span>{r.message}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <Card title="Activity log" className="xl:col-span-3">
          <ul className="max-h-80 space-y-2 overflow-y-auto">
            {s.log.map((l) => (
              <li key={l.id} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 font-mono text-xs text-slate-400">{l.time}</span>
                <Badge tone={levelTone[l.level]}>{l.level}</Badge>
                <span className="min-w-0 flex-1 break-words">{l.msg}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
