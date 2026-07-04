import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { Banknote, Wallet, CalendarClock, AlertTriangle } from 'lucide-react';
import { useData } from '../store/DataContext';
import type { Repayment } from '../types';
import { peso, initials, fmtDate, fromNow } from '../lib/format';
import { Avatar, StatusBadge, PageHeader, Modal, EmptyState, StatCard } from '../components/ui';

type Tab = 'overdue' | 'today' | 'week' | 'upcoming';

export default function Collections() {
  const data = useData();
  const [tab, setTab] = useState<Tab>('overdue');
  const [payTarget, setPayTarget] = useState<Repayment | null>(null);

  const buckets = useMemo(() => {
    const today = dayjs().startOf('day');
    const endWeek = today.add(7, 'day');
    const open = data.repayments.filter((r) => r.status !== 'paid');
    return {
      overdue: open.filter((r) => r.status === 'overdue').sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
      today: open.filter((r) => dayjs(r.dueDate).isSame(today, 'day')),
      week: open.filter((r) => {
        const d = dayjs(r.dueDate);
        return d.isAfter(today) && d.isBefore(endWeek);
      }).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
      upcoming: open.filter((r) => dayjs(r.dueDate).isAfter(endWeek)).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    };
  }, [data.repayments]);

  const collectedToday = data.repayments
    .filter((r) => r.paidDate && dayjs(r.paidDate).isSame(dayjs(), 'day'))
    .reduce((s, r) => s + r.amountPaid, 0);

  const sumBucket = (rows: Repayment[]) => rows.reduce((s, r) => s + (r.amountDue - r.amountPaid), 0);

  const rows = buckets[tab];

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'overdue', label: 'Overdue', count: buckets.overdue.length },
    { key: 'today', label: 'Due Today', count: buckets.today.length },
    { key: 'week', label: 'This Week', count: buckets.week.length },
    { key: 'upcoming', label: 'Upcoming', count: buckets.upcoming.length },
  ];

  return (
    <div>
      <PageHeader title="Collections" subtitle="Track and record repayments" />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Overdue" value={peso(sumBucket(buckets.overdue))} icon={AlertTriangle} tone="red" sub={`${buckets.overdue.length} payments`} />
        <StatCard label="Due Today" value={peso(sumBucket(buckets.today))} icon={CalendarClock} tone="amber" sub={`${buckets.today.length} payments`} />
        <StatCard label="Due This Week" value={peso(sumBucket(buckets.week))} icon={Wallet} tone="blue" sub={`${buckets.week.length} payments`} />
        <StatCard label="Collected Today" value={peso(collectedToday)} icon={Banknote} tone="brand" />
      </div>

      <div className="card overflow-hidden">
        <div className="flex gap-1 border-b border-slate-200 px-3 pt-3">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                tab === t.key ? 'bg-white text-brand-700' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${tab === t.key ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>{t.count}</span>
              {tab === t.key && <span className="absolute inset-x-3 -bottom-px h-0.5 bg-brand-600" />}
            </button>
          ))}
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={Wallet} title="Nothing here" hint="No payments in this bucket." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th">Client</th>
                  <th className="th">Installment</th>
                  <th className="th">Due date</th>
                  <th className="th">Amount</th>
                  <th className="th">Status</th>
                  <th className="th text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => {
                  const loan = data.loanById(r.loanId);
                  const client = loan ? data.clientById(loan.clientId) : undefined;
                  if (!client) return null;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="td">
                        <Link to={`/clients/${client.id}`} className="flex items-center gap-2.5">
                          <Avatar initials={initials(client.firstName, client.lastName)} size="sm" />
                          <div>
                            <p className="font-medium text-slate-700">{client.firstName} {client.lastName}</p>
                            <p className="text-xs text-slate-400">{client.phone}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="td">
                        <Link to={`/loans/${r.loanId}`} className="text-brand-600 hover:underline">#{r.installmentNo}</Link>
                      </td>
                      <td className="td">
                        <span className="text-slate-700">{fmtDate(r.dueDate)}</span>
                        <span className={`ml-2 text-xs ${r.status === 'overdue' ? 'text-red-500' : 'text-slate-400'}`}>{fromNow(r.dueDate)}</span>
                      </td>
                      <td className="td font-semibold">{peso(r.amountDue - r.amountPaid, { decimals: true })}</td>
                      <td className="td"><StatusBadge status={r.status} /></td>
                      <td className="td text-right">
                        <button className="btn-primary !py-1.5 text-xs" onClick={() => setPayTarget(r)}>
                          <Banknote className="h-3.5 w-3.5" /> Collect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CollectModal repayment={payTarget} onClose={() => setPayTarget(null)} />
    </div>
  );
}

function CollectModal({ repayment, onClose }: { repayment: Repayment | null; onClose: () => void }) {
  const data = useData();
  const remaining = repayment ? repayment.amountDue - repayment.amountPaid : 0;
  const [amount, setAmount] = useState(remaining);

  useEffect(() => {
    if (repayment) setAmount(repayment.amountDue - repayment.amountPaid);
  }, [repayment]);

  const loan = repayment ? data.loanById(repayment.loanId) : undefined;
  const client = loan ? data.clientById(loan.clientId) : undefined;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!repayment || amount <= 0) return;
    data.recordPayment(repayment.id, amount);
    onClose();
  }

  return (
    <Modal open={Boolean(repayment)} onClose={onClose} title="Collect Payment">
      {repayment && (
        <form onSubmit={submit} className="space-y-4">
          {client && (
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
              <Avatar initials={initials(client.firstName, client.lastName)} size="md" />
              <div>
                <p className="font-semibold text-slate-800">{client.firstName} {client.lastName}</p>
                <p className="text-sm text-slate-500">Installment #{repayment.installmentNo} • due {fmtDate(repayment.dueDate)}</p>
              </div>
            </div>
          )}
          <div>
            <label className="label">Amount received (remaining {peso(remaining, { decimals: true })})</label>
            <input className="input" type="number" step="0.01" max={remaining} value={amount} onChange={(e) => setAmount(Number(e.target.value))} autoFocus />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary"><Banknote className="h-4 w-4" /> Confirm</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
