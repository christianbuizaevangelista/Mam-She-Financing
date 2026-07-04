import { supabase } from '../lib/supabase';
import type { AppData, Client, Loan, LoanProduct, Repayment } from '../types';
import {
  branchToRow,
  clientToRow,
  loanToRow,
  productToRow,
  repaymentToRow,
  rowToBranch,
  rowToClient,
  rowToLoan,
  rowToProduct,
  rowToRepayment,
} from '../lib/mappers';

function db() {
  if (!supabase) throw new Error('Supabase not configured');
  return supabase;
}

/** Load the entire dataset from Supabase. */
export async function loadAll(): Promise<AppData> {
  const sb = db();
  const [branches, products, clients, loans, repayments] = await Promise.all([
    sb.from('branches').select('*'),
    sb.from('loan_products').select('*'),
    sb.from('clients').select('*'),
    sb.from('loans').select('*'),
    sb.from('repayments').select('*'),
  ]);
  const err = branches.error || products.error || clients.error || loans.error || repayments.error;
  if (err) throw err;
  return {
    branches: (branches.data ?? []).map(rowToBranch),
    products: (products.data ?? []).map(rowToProduct),
    clients: (clients.data ?? []).map(rowToClient),
    loans: (loans.data ?? []).map(rowToLoan),
    repayments: (repayments.data ?? []).map(rowToRepayment),
  };
}

/** True when the project has no clients yet (fresh database). */
export async function isEmpty(): Promise<boolean> {
  const sb = db();
  const { count, error } = await sb.from('clients').select('*', { count: 'exact', head: true });
  if (error) throw error;
  return (count ?? 0) === 0;
}

/** Push a full dataset into Supabase (used for first-run seeding). Order respects FKs. */
export async function seedAll(data: AppData): Promise<void> {
  const sb = db();
  const steps: { table: string; rows: any[] }[] = [
    { table: 'branches', rows: data.branches.map(branchToRow) },
    { table: 'loan_products', rows: data.products.map(productToRow) },
    { table: 'clients', rows: data.clients.map(clientToRow) },
    { table: 'loans', rows: data.loans.map(loanToRow) },
    { table: 'repayments', rows: data.repayments.map(repaymentToRow) },
  ];
  for (const step of steps) {
    if (step.rows.length === 0) continue;
    const { error } = await sb.from(step.table).upsert(step.rows);
    if (error) throw new Error(`Seeding ${step.table} failed: ${error.message}`);
  }
}

/** Delete all rows (FK-safe order) then reseed. */
export async function resetAll(data: AppData): Promise<void> {
  const sb = db();
  const wipeOrder = ['repayments', 'loans', 'clients', 'loan_products', 'branches'];
  for (const table of wipeOrder) {
    const { error } = await sb.from(table).delete().neq('id', '__none__');
    if (error) throw new Error(`Clearing ${table} failed: ${error.message}`);
  }
  await seedAll(data);
}

/* ---- Write-through helpers (fire-and-forget from the store) ---- */
export const saveClient = (c: Client) => db().from('clients').upsert(clientToRow(c));
export const saveProduct = (p: LoanProduct) => db().from('loan_products').upsert(productToRow(p));
export const saveLoan = (l: Loan) => db().from('loans').upsert(loanToRow(l));
export const saveRepayment = (r: Repayment) => db().from('repayments').upsert(repaymentToRow(r));
export const saveRepayments = (rs: Repayment[]) =>
  rs.length ? db().from('repayments').upsert(rs.map(repaymentToRow)) : Promise.resolve({ error: null });
