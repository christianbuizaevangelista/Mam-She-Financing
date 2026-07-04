import React from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';

/* ---------------- Badge ---------------- */
type Tone = 'slate' | 'emerald' | 'green' | 'amber' | 'red' | 'blue' | 'violet';

const toneMap: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
  violet: 'bg-violet-100 text-violet-700',
};

export function Badge({ tone = 'slate', children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={clsx('badge', toneMap[tone])}>{children}</span>;
}

const statusTones: Record<string, Tone> = {
  active: 'emerald',
  paid: 'blue',
  pending: 'amber',
  approved: 'violet',
  overdue: 'red',
  rejected: 'slate',
  defaulted: 'red',
  partial: 'amber',
  inactive: 'slate',
  blacklisted: 'red',
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTones[status] ?? 'slate'}>{status[0].toUpperCase() + status.slice(1)}</Badge>;
}

/* ---------------- StatCard ---------------- */
export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = 'brand',
  trend,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'brand' | 'blue' | 'amber' | 'red' | 'violet';
  trend?: { value: string; up: boolean };
}) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
        </div>
        <div className={clsx('rounded-lg p-2.5', tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {(sub || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span className={clsx('font-semibold', trend.up ? 'text-emerald-600' : 'text-red-600')}>
              {trend.up ? '▲' : '▼'} {trend.value}
            </span>
          )}
          {sub && <span className="text-slate-400">{sub}</span>}
        </div>
      )}
    </div>
  );
}

/* ---------------- ProgressBar ---------------- */
export function ProgressBar({ value, tone = 'brand' }: { value: number; tone?: 'brand' | 'amber' | 'red' }) {
  const tones = { brand: 'bg-brand-500', amber: 'bg-amber-500', red: 'bg-red-500' };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div className={clsx('h-full rounded-full', tones[tone])} style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }} />
    </div>
  );
}

/* ---------------- Avatar ---------------- */
export function Avatar({ initials, size = 'md' }: { initials: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };
  return (
    <div className={clsx('flex items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700', sizes[size])}>
      {initials}
    </div>
  );
}

/* ---------------- Modal ---------------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8" onClick={onClose}>
      <div
        className={clsx('card w-full animate-in', wide ? 'max-w-3xl' : 'max-w-lg')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button className="btn-ghost -mr-2 !px-2" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- EmptyState ---------------- */
export function EmptyState({ icon: Icon, title, hint }: { icon: React.ComponentType<{ className?: string }>; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-slate-100 p-4">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <p className="mt-4 font-semibold text-slate-700">{title}</p>
      {hint && <p className="mt-1 text-sm text-slate-400">{hint}</p>}
    </div>
  );
}

/* ---------------- PageHeader ---------------- */
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
