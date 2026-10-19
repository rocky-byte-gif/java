import { Receipt } from 'lucide-react';
import { useState } from 'react';
import { Badge, btn, Card, Field, input, PageHeader, Table, td } from '../components/ui';
import { addBill, money, patientName, setBillStatus, useStore } from '../lib/store';

export default function Billing() {
  const s = useStore();
  const [patientId, setPatientId] = useState('');
  const [c, setC] = useState('500');
  const [m, setM] = useState('0');
  const [t, setT] = useState('0');
  const pid = patientId || s.patients[0]?.id || '';
  const num = (v: string) => Math.max(0, Number(v) || 0);
  const total = num(c) + num(m) + num(t);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pid || total <= 0) return;
    addBill({ patientId: pid, consultation: num(c), medicine: num(m), testFee: num(t) });
    setM('0');
    setT('0');
  };

  const paid = s.bills.filter((b) => b.status === 'Paid').reduce((x, b) => x + b.total, 0);
  const pending = s.bills.filter((b) => b.status === 'Pending').reduce((x, b) => x + b.total, 0);

  return (
    <>
      <PageHeader title="Billing" sub="Generate invoices and track payments" />
      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="New bill" icon={<Receipt size={16} className="text-cyan-600" />}>
          <form onSubmit={submit} className="space-y-3">
            <Field label="Patient">
              <select className={input} value={pid} onChange={(e) => setPatientId(e.target.value)}>
                {s.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Consultation (₹)"><input className={input} inputMode="decimal" value={c} onChange={(e) => setC(e.target.value)} /></Field>
            <Field label="Medicine (₹)"><input className={input} inputMode="decimal" value={m} onChange={(e) => setM(e.target.value)} /></Field>
            <Field label="Test fee (₹)"><input className={input} inputMode="decimal" value={t} onChange={(e) => setT(e.target.value)} /></Field>
            <div className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
              <span>Total</span><b className="font-mono">{money(total)}</b>
            </div>
            <button className={`${btn.primary} w-full`} type="submit" disabled={total <= 0}>Generate bill</button>
          </form>
        </Card>

        <Card title="Bills" className="xl:col-span-2" action={
          <span className="text-xs text-slate-500">Paid <b className="text-emerald-600">{money(paid)}</b> · Pending <b className="text-amber-600">{money(pending)}</b></span>
        }>
          <Table head={['#', 'Patient', 'Consult', 'Medicine', 'Tests', 'Total', 'Status', '']} empty="No bills yet.">
            {s.bills.map((b) => (
              <tr key={b.id}>
                <td className={`${td} font-mono text-xs text-slate-500`}>{b.id}</td>
                <td className={`${td} font-medium`}>{patientName(s, b.patientId)}</td>
                <td className={td}>{money(b.consultation)}</td>
                <td className={td}>{money(b.medicine)}</td>
                <td className={td}>{money(b.testFee)}</td>
                <td className={`${td} font-semibold`}>{money(b.total)}</td>
                <td className={td}><Badge tone={b.status === 'Paid' ? 'green' : 'amber'}>{b.status}</Badge></td>
                <td className={td}>
                  <button className={btn.ghost} onClick={() => setBillStatus(b.id, b.status === 'Paid' ? 'Pending' : 'Paid')}>
                    {b.status === 'Paid' ? 'Mark pending' : 'Mark paid'}
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </>
  );
}
