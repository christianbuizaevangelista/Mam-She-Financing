import { useState } from 'react';
import { Plus, Package, Building2, RotateCcw, Power } from 'lucide-react';
import { useData } from '../store/DataContext';
import type { LoanProduct, PaymentFrequency } from '../types';
import { peso, pct } from '../lib/format';
import { PageHeader, Badge, Modal } from '../components/ui';

export default function Settings() {
  const data = useData();
  const [showProduct, setShowProduct] = useState(false);

  return (
    <div>
      <PageHeader title="Settings" subtitle="Loan products, branches & data" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Loan products */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-brand-600" />
                <h3 className="font-bold text-slate-800">Loan Products</h3>
              </div>
              <button className="btn-primary !py-1.5 text-sm" onClick={() => setShowProduct(true)}>
                <Plus className="h-3.5 w-3.5" /> Add Product
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="th">Product</th>
                    <th className="th">Rate/mo</th>
                    <th className="th">Term</th>
                    <th className="th">Amount range</th>
                    <th className="th">Frequency</th>
                    <th className="th text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="td font-medium text-slate-700">{p.name}</td>
                      <td className="td">{pct(p.monthlyRate)}</td>
                      <td className="td">{p.termMonths} mo</td>
                      <td className="td text-slate-500">{peso(p.minAmount)} – {peso(p.maxAmount)}</td>
                      <td className="td capitalize">{p.frequency}</td>
                      <td className="td text-right">
                        <button
                          onClick={() => data.updateProduct(p.id, { active: !p.active })}
                          className="inline-flex items-center gap-1.5"
                          title="Toggle active"
                        >
                          <Badge tone={p.active ? 'emerald' : 'slate'}>
                            <Power className="h-3 w-3" /> {p.active ? 'Active' : 'Off'}
                          </Badge>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Branches + data */}
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
              <Building2 className="h-5 w-5 text-brand-600" />
              <h3 className="font-bold text-slate-800">Branches</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {data.branches.map((b) => (
                <div key={b.id} className="px-5 py-3.5">
                  <p className="font-medium text-slate-700">{b.name}</p>
                  <p className="text-xs text-slate-400">{b.address}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-amber-600" />
              <h3 className="font-bold text-slate-800">Demo Data</h3>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {data.usingSupabase
                ? 'Data is stored in your Supabase database. Reset to wipe all tables and restore the original sample clients, loans, and payments.'
                : 'All data is stored locally in your browser. Reset to restore the original sample clients, loans, and payments.'}
            </p>
            <button
              className="btn-danger mt-4 w-full"
              onClick={() => {
                if (confirm('Reset all data to the demo sample? This cannot be undone.')) data.resetData();
              }}
            >
              <RotateCcw className="h-4 w-4" /> Reset Demo Data
            </button>
          </div>
        </div>
      </div>

      <ProductModal open={showProduct} onClose={() => setShowProduct(false)} />
    </div>
  );
}

function ProductModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addProduct } = useData();
  const [form, setForm] = useState<Omit<LoanProduct, 'id'>>({
    name: '',
    monthlyRate: 0.03,
    termMonths: 6,
    minAmount: 5000,
    maxAmount: 50000,
    frequency: 'monthly',
    active: true,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;
    addProduct(form);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Loan Product">
      <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Product name *</label>
          <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div>
          <label className="label">Monthly interest (%)</label>
          <input className="input" type="number" step="0.1" value={form.monthlyRate * 100} onChange={(e) => set('monthlyRate', Number(e.target.value) / 100)} />
        </div>
        <div>
          <label className="label">Term (months)</label>
          <input className="input" type="number" value={form.termMonths} onChange={(e) => set('termMonths', Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Min amount</label>
          <input className="input" type="number" value={form.minAmount} onChange={(e) => set('minAmount', Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Max amount</label>
          <input className="input" type="number" value={form.maxAmount} onChange={(e) => set('maxAmount', Number(e.target.value))} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Payment frequency</label>
          <select className="input" value={form.frequency} onChange={(e) => set('frequency', e.target.value as PaymentFrequency)}>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div className="sm:col-span-2 mt-1 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Add Product</button>
        </div>
      </form>
    </Modal>
  );
}
