import { AlertTriangle, CalendarPlus, Check, X } from 'lucide-react';
import { useState } from 'react';
import { Badge, btn, Card, Field, input, PageHeader, Table, td } from '../components/ui';
import {
  bookAppointment, cancelAppointment, completeAppointment, doctorName, findConflicts, patientName,
  removeWait, repairConflicts, SLOTS, useStore,
} from '../lib/store';

const tone = { Booked: 'blue', Completed: 'green', Cancelled: 'gray' } as const;

export default function Appointments() {
  const s = useStore();
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState(1);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const pid = patientId || s.patients[0]?.id || '';
  const conflicts = findConflicts(s);

  const book = async (slot: string) => {
    if (!pid) { setMsg({ ok: false, text: 'Register a patient first.' }); return; }
    setBusy(true);
    const r = await bookAppointment(pid, doctorId, slot, true);
    setMsg({ ok: r.ok, text: r.message });
    setBusy(false);
  };

  const sorted = [...s.appointments].sort((a, b) => b.id - a.id);

  return (
    <>
      <PageHeader title="Appointments" sub="Book slots safely; taken slots go to a waitlist and auto-promote on cancellation" />

      {conflicts.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
          <span className="flex items-center gap-2"><AlertTriangle size={16} />{conflicts.length} double-booked slot(s) detected (from the unsafe simulation).</span>
          <button className={btn.danger} onClick={repairConflicts}>Repair</button>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Book a slot" icon={<CalendarPlus size={16} className="text-cyan-600" />} className="xl:col-span-2">
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <Field label="Patient">
              <select className={input} value={pid} onChange={(e) => setPatientId(e.target.value)}>
                {s.patients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
              </select>
            </Field>
            <Field label="Doctor">
              <select className={input} value={doctorId} onChange={(e) => setDoctorId(Number(e.target.value))}>
                {s.doctors.map((d) => <option key={d.id} value={d.id}>{d.name} · {d.specialization}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {SLOTS.map((slot) => {
              const a = s.appointments.find((x) => x.doctorId === doctorId && x.slot === slot && x.status === 'Booked');
              const wait = s.waitlist.filter((w) => w.doctorId === doctorId && w.slot === slot).length;
              return (
                <button key={slot} disabled={busy} onClick={() => book(slot)}
                  title={a ? `Booked by ${patientName(s, a.patientId)}. Click to join the waitlist` : 'Free. Click to book'}
                  className={`rounded-lg border p-2 text-left text-xs transition disabled:opacity-60 ${a
                    ? 'border-amber-300 bg-amber-50 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40'
                    : 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40'}`}>
                  <div className="font-mono text-sm font-semibold">{slot}</div>
                  <div className="truncate text-slate-600 dark:text-slate-300">{a ? patientName(s, a.patientId) : 'Free'}</div>
                  {wait > 0 && <div className="text-amber-700 dark:text-amber-300">{wait} waiting</div>}
                </button>
              );
            })}
          </div>
          {msg && <p role="status" className={`mt-3 text-sm ${msg.ok ? 'text-emerald-600' : 'text-amber-600'}`}>{msg.text}</p>}
        </Card>

        <Card title={`Waitlist (${s.waitlist.length})`}>
          <Table head={['Patient', 'Doctor', 'Slot', '']} empty="Waitlist is empty.">
            {s.waitlist.map((w) => (
              <tr key={w.id}>
                <td className={td}>{patientName(s, w.patientId)}</td>
                <td className={td}>{doctorName(s, w.doctorId)}</td>
                <td className={`${td} font-mono`}>{w.slot}</td>
                <td className={td}><button className={btn.ghost} aria-label="Remove from waitlist" onClick={() => removeWait(w.id)}><X size={14} /></button></td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card title="All appointments" className="xl:col-span-3">
          <Table head={['#', 'Patient', 'Doctor', 'Slot', 'Status', '']} empty="No appointments yet.">
            {sorted.map((a) => (
              <tr key={a.id}>
                <td className={`${td} font-mono text-xs text-slate-500`}>{a.id}</td>
                <td className={`${td} font-medium`}>{patientName(s, a.patientId)}</td>
                <td className={td}>{doctorName(s, a.doctorId)}</td>
                <td className={`${td} font-mono`}>{a.slot}</td>
                <td className={td}><Badge tone={tone[a.status]}>{a.status}</Badge></td>
                <td className={`${td} space-x-2`}>
                  {a.status === 'Booked' && (
                    <>
                      <button className={btn.ghost} onClick={() => completeAppointment(a.id)}><Check size={14} />Complete</button>
                      <button className={btn.danger} onClick={() => cancelAppointment(a.id)}><X size={14} />Cancel</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </>
  );
}
