import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, CreditCard, Briefcase, Landmark, Plus } from 'lucide-react';
import { useData } from '../store/DataContext';
import { peso, initials, creditRating, fmtDate } from '../lib/format';
import { loanSummary } from '../lib/loan';
import { Avatar, Badge, StatusBadge, ProgressBar, EmptyState } from '../components/ui';

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const data = useData();
  const client = id ? data.clientById(id) : undefined;

  if (!client) {
    return (
      <div className="card p-8 text-center">
        <p className="text-slate-500">Client not found.</p>
        <Link to="/clients" className="btn-secondary mt-4 inline-flex">Back to clients</Link>
      </div>
    );
  }

  const loans = data.loansForClient(client.id);
  const openLoans = loans.filter((l) => l.status === 'active' || l.status === 'overdue');
  const outstanding = openLoans.reduce((s, l) => s + loanSummary(l, data.repayments).outstanding, 0);
  const totalBorrowed = loans.reduce((s, l) => s + l.principal, 0);
  const rating = creditRating(client.creditScore);

  return (
    <div>
      <button onClick={() => navigate(-1)} className="btn-ghost mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Profile card */}
        <div className="card p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar initials={initials(client.firstName, client.lastName)} size="lg" />
            <h2 className="mt-3 text-xl font-bold text-slate-800">{client.firstName} {client.lastName}</h2>
            <p className="text-sm text-slate-500">{client.businessType}</p>
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge status={client.status} />
              <Badge tone={rating.tone as any}>{rating.label} • {client.creditScore}</Badge>
            </div>
          </div>

          <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm">
            <Info icon={Phone} label="Phone" value={client.phone} />
            {client.email && <Info icon={Mail} label="Email" value={client.email} />}
            <Info icon={MapPin} label="Address" value={`${client.address}, ${client.city}`} />
            <Info icon={Briefcase} label="Business" value={client.businessType} />
            <Info icon={CreditCard} label={client.idType} value={client.idNumber} />
            <Info icon={Landmark} label="Client since" value={fmtDate(client.createdAt)} />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-3 gap-4">
            <MiniStat label="Outstanding" value={peso(outstanding)} />
            <MiniStat label="Total Borrowed" value={peso(totalBorrowed)} />
            <MiniStat label="Loans" value={String(loans.length)} />
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="font-bold text-slate-800">Loan History</h3>
              <Link to="/loans" state={{ clientId: client.id }} className="btn-secondary !py-1.5 text-sm">
                <Plus className="h-3.5 w-3.5" /> New Loan
              </Link>
            </div>
            {loans.length === 0 ? (
              <EmptyState icon={Landmark} title="No loans yet" hint="This client has no loan records." />
            ) : (
              <div className="divide-y divide-slate-100">
                {loans.map((loan) => {
                  const sum = loanSummary(loan, data.repayments);
                  const product = data.productById(loan.productId);
                  return (
                    <Link key={loan.id} to={`/loans/${loan.id}`} className="block px-5 py-4 hover:bg-slate-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">{peso(loan.principal)} <span className="font-normal text-slate-400">• {product?.name ?? 'Custom loan'}</span></p>
                          <p className="text-xs text-slate-500">{loan.purpose} • {fmtDate(loan.disbursementDate ?? loan.applicationDate)}</p>
                        </div>
                        <StatusBadge status={loan.status} />
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <ProgressBar value={sum.progress} tone={loan.status === 'overdue' ? 'red' : 'brand'} />
                        <span className="whitespace-nowrap text-xs font-medium text-slate-500">{Math.round(sum.progress * 100)}% paid</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {client.notes && (
            <div className="card p-5">
              <h3 className="mb-2 font-bold text-slate-800">Notes</h3>
              <p className="text-sm text-slate-600">{client.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-slate-100 p-2 text-slate-500"><Icon className="h-4 w-4" /></div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="truncate font-medium text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4 text-center">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-800">{value}</p>
    </div>
  );
}
