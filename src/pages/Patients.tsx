import { Search, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Badge, btn, Card, Field, input, PageHeader, Table, td } from '../components/ui';
import { addPatient, BLOOD_GROUPS, deletePatient, useStore } from '../lib/store';

const empty = { name: '', age: '', phone: '', bloodGroup: 'O+', allergies: '' };

export default function Patients() {
  const s = useStore();
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    const age = Number(f.age);
    if (!f.name.trim()) err.name = 'Name is required';
    if (!Number.isInteger(age) || age < 0 || age > 120) err.age = 'Enter age 0-120';
    if (!/^\d{10}$/.test(f.phone)) err.phone = 'Phone must be 10 digits';
    setErrors(err);
    if (Object.keys(err).length) return;
    addPatient({ name: f.name.trim(), age, phone: f.phone, bloodGroup: f.bloodGroup, allergies: f.allergies.trim() || 'None' });
    setF(empty);
  };

  const q = query.trim().toLowerCase();
  const rows = s.patients.filter((p) => !q || [p.name, p.id, p.phone].some((v) => v.toLowerCase().includes(q)));

  return (
    <>
      <PageHeader title="Patients" sub="Register and manage patient profiles" />
      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="New patient" icon={<UserPlus size={16} className="text-cyan-600" />}>
          <form onSubmit={submit} className="space-y-3" noValidate>
            <Field label="Full name" error={errors.name}><input className={input} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={50} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Age" error={errors.age}><input className={input} inputMode="numeric" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} /></Field>
              <Field label="Blood group">
                <select className={input} value={f.bloodGroup} onChange={(e) => setF({ ...f, bloodGroup: e.target.value })}>
                  {BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Phone (10 digits)" error={errors.phone}><input className={input} inputMode="numeric" maxLength={10} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, '') })} /></Field>
            <Field label="Allergies"><input className={input} placeholder="None" maxLength={100} value={f.allergies} onChange={(e) => setF({ ...f, allergies: e.target.value })} /></Field>
            <button className={`${btn.primary} w-full`} type="submit">Register patient</button>
          </form>
        </Card>

        <Card title={`All patients (${rows.length})`} className="xl:col-span-2" action={
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${input} !py-1.5 pl-8`} placeholder="Search name, ID, phone" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        }>
          <Table head={['ID', 'Name', 'Age', 'Phone', 'Blood', 'Allergies', '']} empty="No patients match.">
            {rows.map((p) => (
              <tr key={p.id}>
                <td className={`${td} font-mono text-xs text-slate-500`}>{p.id}</td>
                <td className={`${td} font-medium`}>{p.name}</td>
                <td className={td}>{p.age}</td>
                <td className={`${td} font-mono text-xs`}>{p.phone}</td>
                <td className={td}><Badge tone="red">{p.bloodGroup}</Badge></td>
                <td className={td}>{p.allergies}</td>
                <td className={td}>
                  <button className={btn.danger} aria-label={`Delete ${p.name}`} onClick={() => { if (confirm(`Delete ${p.name} and all their appointments, records and bills?`)) deletePatient(p.id); }}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </>
  );
}
