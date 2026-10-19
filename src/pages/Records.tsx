import { FilePlus2 } from 'lucide-react';
import { useState } from 'react';
import { btn, Card, Field, input, PageHeader, Table, td } from '../components/ui';
import { addRecord, patientName, useStore } from '../lib/store';

export default function Records() {
  const s = useStore();
  const [patientId, setPatientId] = useState('');
  const [doc, setDoc] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const pid = patientId || s.patients[0]?.id || '';
  const dname = doc || s.doctors[0]?.name || '';
  const patient = s.patients.find((p) => p.id === pid);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pid) return setError('Register a patient first.');
    if (!diagnosis.trim()) return setError('Diagnosis is required.');
    setError('');
    addRecord({ patientId: pid, diagnosis: diagnosis.trim(), prescription: prescription.trim() || 'None', doctorName: dname });
    setDiagnosis('');
    setPrescription('');
  };

  const rows = s.records.filter((r) => filter === 'all' || r.patientId === filter);

  return (
    <>
      <PageHeader title="Medical records" sub="Diagnoses and prescriptions per patient" />
      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Add record" icon={<FilePlus2 size={16} className="text-cyan-600" />}>
          <form onSubmit={submit} className="space-y-3" noValidate>
            <Field label="Patient">
              <select className={input} value={pid} onChange={(e) => setPatientId(e.target.value)}>
                {s.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            {patient && patient.allergies !== 'None' && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">Allergy alert: {patient.allergies}</p>
            )}
            <Field label="Doctor">
              <select className={input} value={dname} onChange={(e) => setDoc(e.target.value)}>
                {s.doctors.map((d) => <option key={d.id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Diagnosis"><input className={input} maxLength={200} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} /></Field>
            <Field label="Prescription"><textarea className={input} rows={3} maxLength={200} value={prescription} onChange={(e) => setPrescription(e.target.value)} /></Field>
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <button className={`${btn.primary} w-full`} type="submit">Save record</button>
          </form>
        </Card>

        <Card title={`Records (${rows.length})`} className="xl:col-span-2" action={
          <select className={`${input} !w-auto !py-1.5`} value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by patient">
            <option value="all">All patients</option>
            {s.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        }>
          <Table head={['Date', 'Patient', 'Diagnosis', 'Prescription', 'Doctor']} empty="No records.">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className={`${td} font-mono text-xs`}>{r.date}</td>
                <td className={`${td} font-medium`}>{patientName(s, r.patientId)}</td>
                <td className="px-3 py-2.5">{r.diagnosis}</td>
                <td className="px-3 py-2.5">{r.prescription}</td>
                <td className={td}>{r.doctorName}</td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </>
  );
}
