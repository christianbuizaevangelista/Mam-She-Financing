import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useData } from '../store/DataContext';
import { portfolioMetrics, monthlySeries } from '../lib/metrics';
import { loanSummary } from '../lib/loan';
import { peso, pesoCompact, pct } from '../lib/format';
import { PageHeader, ProgressBar } from '../components/ui';

export default function Reports() {
  const data = useData();
  const m = portfolioMetrics(data);
  const series = monthlySeries(data, 6);

  const byProduct = useMemo(() => {
    return data.products.map((p) => {
      const loans = data.loans.filter((l) => l.productId === p.id);
      const disbursed = loans.reduce((s, l) => s + l.principal, 0);
      const outstanding = loans
        .filter((l) => l.status === 'active' || l.status === 'overdue')
        .reduce((s, l) => s + loanSummary(l, data.repayments).outstanding, 0);
      return { name: p.name, count: loans.length, disbursed, outstanding };
    }).sort((a, b) => b.disbursed - a.disbursed);
  }, [data]);

  const byBranch = useMemo(() => {
    return data.branches.map((br) => {
      const clientIds = new Set(data.clients.filter((c) => c.branch === br.id).map((c) => c.id));
      const loans = data.loans.filter((l) => clientIds.has(l.clientId));
      const disbursed = loans.reduce((s, l) => s + l.principal, 0);
      const overdue = loans.filter((l) => l.status === 'overdue').length;
      return { name: br.name, clients: clientIds.size, loans: loans.length, disbursed, overdue };
    });
  }, [data]);

  const totalDisbursedAll = byProduct.reduce((s, p) => s + p.disbursed, 0);

  return (
    <div>
      <PageHeader title="Reports" subtitle="Portfolio performance & risk analytics" />

      {/* Summary tiles */}
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="Total Disbursed" value={peso(m.totalDisbursed)} />
        <Tile label="Outstanding" value={peso(m.outstanding)} />
        <Tile label="Expected Interest" value={peso(m.expectedInterest)} tone="text-emerald-600" />
        <Tile label="Portfolio at Risk" value={pct(m.par)} tone={m.par > 0.1 ? 'text-red-600' : 'text-slate-800'} />
      </div>

      <div className="mb-4 card p-5">
        <h3 className="font-bold text-slate-800">Monthly Disbursements vs Collections</h3>
        <p className="mb-4 text-sm text-slate-500">Last 6 months</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={series} margin={{ left: -12, right: 8, top: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" />
            <YAxis tickFormatter={(v) => pesoCompact(v)} tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" width={56} />
            <Tooltip formatter={(v: number) => peso(v)} contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13 }} cursor={{ fill: '#f1f5f9' }} />
            <Legend iconType="circle" iconSize={8} />
            <Bar dataKey="disbursed" name="Disbursed" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="collected" name="Collected" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* By product */}
        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="font-bold text-slate-800">Portfolio by Product</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {byProduct.map((p) => (
              <div key={p.name} className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-700">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.count} loans • {peso(p.outstanding)} outstanding</p>
                  </div>
                  <p className="font-bold text-slate-800">{peso(p.disbursed)}</p>
                </div>
                <div className="mt-2">
                  <ProgressBar value={totalDisbursedAll ? p.disbursed / totalDisbursedAll : 0} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By branch */}
        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="font-bold text-slate-800">Performance by Branch</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th">Branch</th>
                  <th className="th">Clients</th>
                  <th className="th">Loans</th>
                  <th className="th">Disbursed</th>
                  <th className="th">Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {byBranch.map((b) => (
                  <tr key={b.name} className="hover:bg-slate-50">
                    <td className="td font-medium text-slate-700">{b.name}</td>
                    <td className="td">{b.clients}</td>
                    <td className="td">{b.loans}</td>
                    <td className="td font-semibold">{peso(b.disbursed)}</td>
                    <td className="td">
                      {b.overdue > 0 ? <span className="font-semibold text-red-600">{b.overdue}</span> : <span className="text-slate-400">0</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${tone ?? 'text-slate-800'}`}>{value}</p>
    </div>
  );
}
