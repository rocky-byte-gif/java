import { useSyncExternalStore } from 'react';
import type { Appointment, BookResult, Bill, LogLevel, MedRecord, Patient, State } from '../types';

const KEY = 'medisync-lite-v1';

export const SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '15:30', '16:00'];
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const today = () => new Date().toISOString().slice(0, 10);
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function seed(): State {
  const s: State = {
    patients: [
      { id: 'MS-2026-0001', name: 'Aarav Sharma', age: 32, phone: '9876543210', bloodGroup: 'B+', allergies: 'None' },
      { id: 'MS-2026-0002', name: 'Sunita Deshmukh', age: 45, phone: '9822334455', bloodGroup: 'O+', allergies: 'Penicillin' },
      { id: 'MS-2026-0003', name: 'Vikram Joshi', age: 28, phone: '9123456789', bloodGroup: 'A+', allergies: 'Dust' },
      { id: 'MS-2026-0004', name: 'Neha Kulkarni', age: 36, phone: '9988776655', bloodGroup: 'AB+', allergies: 'None' },
      { id: 'MS-2026-0005', name: 'Rahul Patil', age: 52, phone: '9765432109', bloodGroup: 'O-', allergies: 'Sulfa drugs' },
      { id: 'MS-2026-0006', name: 'Ananya Iyer', age: 8, phone: '9812345670', bloodGroup: 'B-', allergies: 'Peanuts' },
    ],
    doctors: [
      { id: 1, name: 'Dr. Mehta', specialization: 'General' },
      { id: 2, name: 'Dr. Rao', specialization: 'Cardiology' },
      { id: 3, name: 'Dr. Khan', specialization: 'Pediatrics' },
    ],
    appointments: [
      { id: 1, patientId: 'MS-2026-0001', doctorId: 1, slot: '09:00', status: 'Booked' },
      { id: 2, patientId: 'MS-2026-0002', doctorId: 2, slot: '10:00', status: 'Booked' },
    ],
    waitlist: [],
    records: [
      { id: 1, patientId: 'MS-2026-0002', diagnosis: 'Mild hypertension', prescription: 'Amlodipine 5mg once daily', doctorName: 'Dr. Rao', date: today() },
    ],
    bills: [
      { id: 1, patientId: 'MS-2026-0002', consultation: 800, medicine: 250, testFee: 400, total: 1450, status: 'Pending' },
    ],
    log: [],
    seq: { appt: 2, wait: 0, record: 1, bill: 1, log: 0 },
  };
  s.log.push({ id: 1, time: new Date().toLocaleTimeString(), level: 'info', msg: 'MediSync Lite started with demo data' });
  s.seq.log = 1;
  return s;
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed && Array.isArray(parsed.patients) && parsed.seq) return parsed;
    }
  } catch { /* fall through to seed */ }
  return seed();
}

let state: State = load();
const listeners = new Set<() => void>();

function update(fn: (s: State) => void) {
  const next = structuredClone(state);
  fn(next);
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
  listeners.forEach((l) => l());
}

function addLog(s: State, level: LogLevel, msg: string) {
  s.log.unshift({ id: ++s.seq.log, time: new Date().toLocaleTimeString(), level, msg });
  if (s.log.length > 200) s.log.length = 200;
}

export function useStore(): State {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    () => state,
  );
}

export const getState = () => state;
export const patientName = (s: State, id: string) => s.patients.find((p) => p.id === id)?.name ?? id;
export const doctorName = (s: State, id: number) => s.doctors.find((d) => d.id === id)?.name ?? `#${id}`;
export const money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

/* ---------- Mutex: serialises critical sections (the "thread-safe" part) ---------- */
class Mutex {
  private tail: Promise<unknown> = Promise.resolve();
  run<T>(fn: () => Promise<T>): Promise<T> {
    const result = this.tail.then(fn);
    this.tail = result.catch(() => undefined);
    return result;
  }
}
const bookingLock = new Mutex();

/* ---------- Patients ---------- */
export function addPatient(p: Omit<Patient, 'id'>): Patient {
  let created!: Patient;
  update((s) => {
    const max = s.patients.reduce((m, x) => Math.max(m, parseInt(x.id.split('-')[2] ?? '0', 10) || 0), 0);
    created = { ...p, id: `MS-${new Date().getFullYear()}-${String(max + 1).padStart(4, '0')}` };
    s.patients.push(created);
    addLog(s, 'success', `Registered patient ${created.name} (${created.id})`);
  });
  return created;
}

export function deletePatient(id: string) {
  update((s) => {
    const name = patientName(s, id);
    s.patients = s.patients.filter((p) => p.id !== id);
    s.appointments = s.appointments.filter((a) => a.patientId !== id);
    s.waitlist = s.waitlist.filter((w) => w.patientId !== id);
    s.records = s.records.filter((r) => r.patientId !== id);
    s.bills = s.bills.filter((b) => b.patientId !== id);
    addLog(s, 'warn', `Deleted patient ${name} and all linked data`);
  });
}

/* ---------- Appointments ---------- */
async function attemptBooking(patientId: string, doctorId: number, slot: string): Promise<BookResult> {
  const snap = state; // read BEFORE the simulated work: this is the classic check-then-act window
  const patient = snap.patients.find((p) => p.id === patientId);
  if (!patient) return { ok: false, message: 'Unknown patient' };
  const doc = doctorName(snap, doctorId);
  const mine = snap.appointments.some((a) => a.patientId === patientId && a.doctorId === doctorId && a.slot === slot && a.status === 'Booked');
  if (mine) return { ok: false, message: `${patient.name} already holds ${doc} @ ${slot}`, patientName: patient.name };
  const taken = snap.appointments.some((a) => a.doctorId === doctorId && a.slot === slot && a.status === 'Booked');

  await sleep(15 + Math.random() * 35); // simulated DB latency

  if (taken) {
    let queued = false;
    update((s) => {
      const dup = s.waitlist.some((w) => w.patientId === patientId && w.doctorId === doctorId && w.slot === slot);
      if (!dup) {
        s.waitlist.push({ id: ++s.seq.wait, patientId, doctorId, slot, queuedAt: new Date().toLocaleTimeString() });
        queued = true;
      }
      addLog(s, 'warn', dup
        ? `${patient.name} is already waitlisted for ${doc} @ ${slot}`
        : `Slot ${doc} @ ${slot} taken, ${patient.name} added to waitlist`);
    });
    return {
      ok: false, waitlisted: true, patientName: patient.name,
      message: queued ? `Slot taken, ${patient.name} added to waitlist` : `${patient.name} is already on the waitlist`,
    };
  }

  update((s) => {
    s.appointments.push({ id: ++s.seq.appt, patientId, doctorId, slot, status: 'Booked' });
    addLog(s, 'success', `Booked ${patient.name} with ${doc} @ ${slot}`);
  });
  return { ok: true, message: `Booked ${patient.name} with ${doc} @ ${slot}`, patientName: patient.name };
}

/** safe=true wraps the check+write in a mutex; safe=false exposes the race condition. */
export function bookAppointment(patientId: string, doctorId: number, slot: string, safe = true): Promise<BookResult> {
  return safe ? bookingLock.run(() => attemptBooking(patientId, doctorId, slot)) : attemptBooking(patientId, doctorId, slot);
}

function promoteFromWaitlist(s: State, doctorId: number, slot: string) {
  const next = s.waitlist.filter((w) => w.doctorId === doctorId && w.slot === slot).sort((a, b) => a.id - b.id)[0];
  if (!next) return;
  s.waitlist = s.waitlist.filter((w) => w.id !== next.id);
  s.appointments.push({ id: ++s.seq.appt, patientId: next.patientId, doctorId, slot, status: 'Booked' });
  addLog(s, 'success', `Waitlist promotion: ${patientName(s, next.patientId)} now booked with ${doctorName(s, doctorId)} @ ${slot}`);
}

export function cancelAppointment(id: number) {
  update((s) => {
    const a = s.appointments.find((x) => x.id === id);
    if (!a || a.status !== 'Booked') return;
    a.status = 'Cancelled';
    addLog(s, 'info', `Cancelled ${patientName(s, a.patientId)} with ${doctorName(s, a.doctorId)} @ ${a.slot}`);
    promoteFromWaitlist(s, a.doctorId, a.slot);
  });
}

export function completeAppointment(id: number) {
  update((s) => {
    const a = s.appointments.find((x) => x.id === id);
    if (!a || a.status !== 'Booked') return;
    a.status = 'Completed';
    addLog(s, 'success', `Completed visit: ${patientName(s, a.patientId)} with ${doctorName(s, a.doctorId)}`);
  });
}

export function removeWait(id: number) {
  update((s) => {
    const w = s.waitlist.find((x) => x.id === id);
    s.waitlist = s.waitlist.filter((x) => x.id !== id);
    if (w) addLog(s, 'info', `Removed ${patientName(s, w.patientId)} from waitlist`);
  });
}

export function findConflicts(s: State): Appointment[][] {
  const groups = new Map<string, Appointment[]>();
  for (const a of s.appointments) {
    if (a.status !== 'Booked') continue;
    const k = `${a.doctorId}|${a.slot}`;
    groups.set(k, [...(groups.get(k) ?? []), a]);
  }
  return [...groups.values()].filter((g) => g.length > 1);
}

/** Keep the earliest booking per slot, push the others onto the waitlist. */
export function repairConflicts() {
  update((s) => {
    const groups = findConflicts(s);
    for (const g of groups) {
      const [, ...extras] = [...g].sort((a, b) => a.id - b.id);
      for (const e of extras) {
        e.status = 'Cancelled';
        s.waitlist.push({ id: ++s.seq.wait, patientId: e.patientId, doctorId: e.doctorId, slot: e.slot, queuedAt: new Date().toLocaleTimeString() });
      }
    }
    addLog(s, 'success', `Repaired ${groups.length} double-booked slot(s); extras moved to waitlist`);
  });
}

/* ---------- Records & billing ---------- */
export function addRecord(r: Omit<MedRecord, 'id' | 'date'>) {
  update((s) => {
    s.records.unshift({ ...r, id: ++s.seq.record, date: today() });
    addLog(s, 'success', `Added medical record for ${patientName(s, r.patientId)}`);
  });
}

export function addBill(b: Omit<Bill, 'id' | 'total' | 'status'>) {
  update((s) => {
    const total = b.consultation + b.medicine + b.testFee;
    s.bills.unshift({ ...b, id: ++s.seq.bill, total, status: 'Pending' });
    addLog(s, 'success', `Generated bill #${s.seq.bill} (${money(total)}) for ${patientName(s, b.patientId)}`);
  });
}

export function setBillStatus(id: number, status: Bill['status']) {
  update((s) => {
    const b = s.bills.find((x) => x.id === id);
    if (!b) return;
    b.status = status;
    addLog(s, status === 'Paid' ? 'success' : 'info', `Bill #${id} marked ${status}`);
  });
}

/* ---------- Data management ---------- */
export function log(level: LogLevel, msg: string) { update((s) => addLog(s, level, msg)); }

export function resetData() {
  state = seed();
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

const q = (v: string | number) => (typeof v === 'number' ? String(v) : `'${v.replace(/\\/g, '\\\\').replace(/'/g, "''")}'`);

export function exportSql(s: State): string {
  const out: string[] = ['-- MediSync Lite export', 'CREATE DATABASE IF NOT EXISTS medisync;', 'USE medisync;', '', ...['waitlist', 'bill', 'record', 'appointment', 'patient', 'doctor'].map((t) => `DELETE FROM ${t};`), ''];
  const row = (t: string, vals: (string | number)[]) => out.push(`INSERT INTO ${t} VALUES (${vals.map(q).join(', ')});`);
  s.doctors.forEach((d) => row('doctor', [d.id, d.name, d.specialization]));
  s.patients.forEach((p) => row('patient', [p.id, p.name, p.age, p.phone, p.bloodGroup, p.allergies]));
  s.appointments.forEach((a) => row('appointment', [a.id, a.patientId, a.doctorId, a.slot, a.status]));
  s.records.forEach((r) => row('record', [r.id, r.patientId, r.diagnosis, r.prescription, r.doctorName, r.date]));
  s.bills.forEach((b) => row('bill', [b.id, b.patientId, b.consultation, b.medicine, b.testFee, b.total, b.status]));
  s.waitlist.forEach((w) => row('waitlist', [w.id, w.patientId, w.doctorId, w.slot, w.queuedAt]));
  return out.join('\n') + '\n';
}

export function download(name: string, text: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
