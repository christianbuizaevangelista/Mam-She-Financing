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
import { peso, pesoCompact, pct } from '../lib/format';
import { PageHeader } from '../components/ui';

export default function Reports() {
  const data = useData();
  const m = portfolioMetrics(data);
  const series = monthlySeries(data, 6);

  return (
    <div>
      <PageHeader title="Reports" subtitle="Portfolio performance & risk analytics" />

      {/* Summary tiles */}
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <Tile label="Total Disbursed" value={peso(m.totalDisbursed)} />
        <Tile label="Outstanding" value={peso(m.outstanding)} />
        <Tile label="Expected Interest" value={peso(m.expectedInterest)} tone="text-emerald-600" />
        <Tile label="Collections (MTD)" value={peso(m.collectionsThisMonth)} />
        <Tile label="Portfolio at Risk" value={pct(m.par)} tone={m.par > 0.1 ? 'text-red-600' : 'text-slate-800'} />
        <Tile label="Overdue" value={peso(m.overdueAmount)} tone={m.overdueAmount > 0 ? 'text-red-600' : 'text-slate-800'} />
      </div>

      <div className="card p-5">
        <h3 className="font-bold text-slate-800">Monthly Disbursements vs Collections</h3>
        <p className="mb-4 text-sm text-slate-500">Last 6 months</p>
        <ResponsiveContainer width="100%" height={320}>
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
