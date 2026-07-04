import dayjs from 'dayjs';

export function peso(amount: number, opts: { decimals?: boolean } = {}): string {
  const decimals = opts.decimals ?? false;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(amount || 0);
}

export function pesoCompact(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) return `₱${(amount / 1_000_000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1_000) return `₱${(amount / 1_000).toFixed(0)}k`;
  return `₱${amount}`;
}

export function pct(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function fmtDate(iso?: string): string {
  if (!iso) return '—';
  return dayjs(iso).format('MMM D, YYYY');
}

export function fmtDateShort(iso?: string): string {
  if (!iso) return '—';
  return dayjs(iso).format('MMM D');
}

export function fromNow(iso?: string): string {
  if (!iso) return '—';
  const days = dayjs().startOf('day').diff(dayjs(iso).startOf('day'), 'day');
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days === -1) return 'Tomorrow';
  if (days > 0) return `${days} days ago`;
  return `in ${Math.abs(days)} days`;
}

export function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export function fmtSize(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

export function creditRating(score: number): { label: string; tone: string } {
  if (score >= 750) return { label: 'Excellent', tone: 'emerald' };
  if (score >= 670) return { label: 'Good', tone: 'green' };
  if (score >= 580) return { label: 'Fair', tone: 'amber' };
  return { label: 'Poor', tone: 'red' };
}
