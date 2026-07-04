import { Link } from 'react-router-dom';
import {
  Landmark,
  Wallet,
  Users,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  CircleDollarSign,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useData } from '../store/DataContext';
import { portfolioMetrics, dueBuckets, monthlySeries, loanStatusBreakdown } from '../lib/metrics';
import { peso, pesoCompact, pct, fmtDate, initials } from '../lib/format';
import { StatCard, StatusBadge, Avatar, PageHeader } from '../components/ui';

const STATUS_COLORS: Record<string, string> = {
  active: '#10b981',
  overdue: '#ef4444',
  paid: '#3b82f6',
  pending: '#f59e0b',
  approved: '#8b5cf6',
  defaulted: '#991b1b',
  rejected: '#94a3b8',
};

export default function Dashboard() {
  const data = useData();
  const m = portfolioMetrics(data);
  const { dueToday, overdue } = dueBuckets(data.repayments);
  const series = monthlySeries(data, 6);
  const statusCounts = loanStatusBreakdown(data);
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const recentLoans = [...data.loans]
    .sort((a, b) => b.applicationDate.localeCompare(a.applicationDate))
    .slice(0, 5);

  const collectRate =
    m.expectedInterest + m.totalDisbursed > 0
      ? m.collectionsThisMonth
      : 0;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Portfolio overview • ${fmtDate(new Date().toISOString())}`}
        action={
          <Link to="/loans" className="btn-primary">
            <CircleDollarSign className="h-4 w-4" /> New Loan
          </Link>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Disbursed" value={peso(m.totalDisbursed)} icon={Landmark} tone="brand" trend={{ value: '12.4%', up: true }} sub="vs last month" />
        <StatCard label="Outstanding Portfolio" value={peso(m.outstanding)} icon={Wallet} tone="blue" sub={`${m.activeLoans} open loans`} />
        <StatCard label="Active Borrowers" value={m.activeBorrowers} icon={Users} tone="violet" sub={`${m.totalClients} total clients`} />
        <StatCard label="Portfolio at Risk" value={pct(m.par)} icon={AlertTriangle} tone="red" sub={`${peso(m.overdueAmount)} overdue`} />
      </div>

      {/* Charts */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800">Disbursements vs Collections</h3>
              <p className="text-sm text-slate-500">Last 6 months</p>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
              <TrendingUp className="h-3.5 w-3.5" /> {peso(collectRate)} collected MTD
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={series} margin={{ left: -12, right: 8, top: 4 }}>
              <defs>
                <linearGradient id="gDisb" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gColl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" />
              <YAxis tickFormatter={(v) => pesoCompact(v)} tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" width={56} />
              <Tooltip formatter={(v: number) => peso(v)} contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Area type="monotone" dataKey="disbursed" name="Disbursed" stroke="#10b981" strokeWidth={2.5} fill="url(#gDisb)" />
              <Area type="monotone" dataKey="collected" name="Collected" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gColl)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-slate-800">Loan Portfolio</h3>
          <p className="text-sm text-slate-500">By status</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs capitalize text-slate-600">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Due today / overdue */}
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Collections Focus</h3>
            <Link to="/collections" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            <FocusRow label="Due Today" count={dueToday.length} amount={dueToday.reduce((s, r) => s + (r.amountDue - r.amountPaid), 0)} tone="amber" />
            <FocusRow label="Overdue" count={overdue.length} amount={m.overdueAmount} tone="red" />
          </div>
          <div className="mt-4 space-y-2">
            {overdue.slice(0, 4).map((r) => {
              const loan = data.loanById(r.loanId);
              const client = loan ? data.clientById(loan.clientId) : undefined;
              if (!client) return null;
              return (
                <Link key={r.id} to={`/loans/${r.loanId}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50">
                  <Avatar initials={initials(client.firstName, client.lastName)} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700">{client.firstName} {client.lastName}</p>
                    <p className="text-xs text-slate-400">Installment #{r.installmentNo} • {fmtDate(r.dueDate)}</p>
                  </div>
                  <span className="text-sm font-semibold text-red-600">{peso(r.amountDue - r.amountPaid)}</span>
                </Link>
              );
            })}
            {overdue.length === 0 && <p className="py-4 text-center text-sm text-slate-400">No overdue payments 🎉</p>}
          </div>
        </div>

        {/* Recent loans */}
        <div className="card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h3 className="font-bold text-slate-800">Recent Loan Applications</h3>
            <Link to="/loans" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
              All loans <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th">Client</th>
                  <th className="th">Product</th>
                  <th className="th">Amount</th>
                  <th className="th">Applied</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentLoans.map((loan) => {
                  const client = data.clientById(loan.clientId);
                  const product = data.productById(loan.productId);
                  return (
                    <tr key={loan.id} className="hover:bg-slate-50">
                      <td className="td">
                        <Link to={`/loans/${loan.id}`} className="flex items-center gap-2.5">
                          <Avatar initials={client ? initials(client.firstName, client.lastName) : '??'} size="sm" />
                          <span className="font-medium text-slate-700">{client?.firstName} {client?.lastName}</span>
                        </Link>
                      </td>
                      <td className="td text-slate-500">{product?.name ?? 'Custom'}</td>
                      <td className="td font-semibold">{peso(loan.principal)}</td>
                      <td className="td text-slate-500">{fmtDate(loan.applicationDate)}</td>
                      <td className="td"><StatusBadge status={loan.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function FocusRow({ label, count, amount, tone }: { label: string; count: number; amount: number; tone: 'amber' | 'red' }) {
  const tones = { amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700' };
  return (
    <div className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${tones[tone]}`}>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs opacity-70">{count} payment{count === 1 ? '' : 's'}</p>
      </div>
      <span className="text-lg font-bold">{peso(amount)}</span>
    </div>
  );
}
