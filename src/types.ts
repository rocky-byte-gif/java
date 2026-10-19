export interface Patient { id: string; name: string; age: number; phone: string; bloodGroup: string; allergies: string }
export interface Doctor { id: number; name: string; specialization: string }
export type ApptStatus = 'Booked' | 'Completed' | 'Cancelled';
export interface Appointment { id: number; patientId: string; doctorId: number; slot: string; status: ApptStatus }
export interface WaitEntry { id: number; patientId: string; doctorId: number; slot: string; queuedAt: string }
export interface MedRecord { id: number; patientId: string; diagnosis: string; prescription: string; doctorName: string; date: string }
export interface Bill { id: number; patientId: string; consultation: number; medicine: number; testFee: number; total: number; status: 'Pending' | 'Paid' }
export type LogLevel = 'info' | 'success' | 'warn' | 'error';
export interface LogEntry { id: number; time: string; level: LogLevel; msg: string }
export interface State {
  patients: Patient[]; doctors: Doctor[]; appointments: Appointment[]; waitlist: WaitEntry[];
  records: MedRecord[]; bills: Bill[]; log: LogEntry[];
  seq: { appt: number; wait: number; record: number; bill: number; log: number };
}
export interface BookResult { ok: boolean; waitlisted?: boolean; message: string; patientName?: string }
