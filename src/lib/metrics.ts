import dayjs from 'dayjs';
import type { AppData, Loan, Repayment } from '../types';
import { loanSummary, totalPayable } from './loan';

const DISBURSED: Loan['status'][] = ['active', 'overdue', 'paid', 'defaulted'];
const OPEN: Loan['status'][] = ['active', 'overdue'];

export function portfolioMetrics(data: AppData) {
  const { loans, repayments, clients } = data;

  const disbursedLoans = loans.filter((l) => DISBURSED.includes(l.status));
  const openLoans = loans.filter((l) => OPEN.includes(l.status));

  const totalDisbursed = disbursedLoans.reduce((s, l) => s + l.principal, 0);

  let outstanding = 0;
  let overduePrincipal = 0;
  for (const loan of openLoans) {
    const sum = loanSummary(loan, repayments);
    outstanding += sum.outstanding;
    if (loan.status === 'overdue') overduePrincipal += sum.outstanding;
  }

  const activeBorrowers = new Set(openLoans.map((l) => l.clientId)).size;

  // Collections this month (by paidDate).
  const startMonth = dayjs().startOf('month');
  const collectionsThisMonth = repayments
    .filter((r) => r.paidDate && dayjs(r.paidDate).isAfter(startMonth))
    .reduce((s, r) => s + r.amountPaid, 0);

  const expectedInterest = disbursedLoans.reduce(
    (s, l) => s + (totalPayable(l.principal, l.monthlyRate, l.termMonths) - l.principal),
    0
  );

  // Portfolio at risk = outstanding tied to overdue loans / total outstanding.
  const par = outstanding > 0 ? overduePrincipal / outstanding : 0;

  const overdueRepayments = repayments.filter((r) => r.status === 'overdue');
  const overdueAmount = overdueRepayments.reduce((s, r) => s + (r.amountDue - r.amountPaid), 0);

  return {
    totalDisbursed,
    outstanding,
    activeLoans: openLoans.length,
    activeBorrowers,
    totalClients: clients.length,
    collectionsThisMonth,
    expectedInterest,
    par,
    overdueAmount,
    overdueCount: overdueRepayments.length,
  };
}

export function dueBuckets(repayments: Repayment[]) {
  const today = dayjs().startOf('day');
  const endWeek = today.add(7, 'day');
  const open = repayments.filter((r) => r.status !== 'paid');
  const dueToday = open.filter((r) => dayjs(r.dueDate).isSame(today, 'day'));
  const dueThisWeek = open.filter((r) => {
    const d = dayjs(r.dueDate);
    return d.isAfter(today) && d.isBefore(endWeek);
  });
  const overdue = open.filter((r) => r.status === 'overdue');
  return { dueToday, dueThisWeek, overdue };
}

/** Monthly disbursement vs collection series for the last N months. */
export function monthlySeries(data: AppData, months = 6) {
  const out: { month: string; disbursed: number; collected: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const m = dayjs().subtract(i, 'month');
    const start = m.startOf('month');
    const end = m.endOf('month');
    const disbursed = data.loans
      .filter((l) => l.disbursementDate && dayjs(l.disbursementDate).isAfter(start) && dayjs(l.disbursementDate).isBefore(end))
      .reduce((s, l) => s + l.principal, 0);
    const collected = data.repayments
      .filter((r) => r.paidDate && dayjs(r.paidDate).isAfter(start) && dayjs(r.paidDate).isBefore(end))
      .reduce((s, r) => s + r.amountPaid, 0);
    out.push({ month: m.format('MMM'), disbursed, collected });
  }
  return out;
}

export function loanStatusBreakdown(data: AppData) {
  const counts: Record<string, number> = {};
  for (const l of data.loans) counts[l.status] = (counts[l.status] ?? 0) + 1;
  return counts;
}
