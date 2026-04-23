import type { BookStatus } from '../lib/types';

interface StatusBadgeProps {
  status: BookStatus;
  size?: 'sm' | 'md';
}

const CONFIG: Record<BookStatus, { label: string; className: string }> = {
  want:    { label: '읽고싶어', className: 'bg-[var(--color-indigo-dim)] text-[var(--color-indigo)] border border-[var(--color-indigo)]/30' },
  reading: { label: '읽는중',   className: 'bg-[var(--color-accent-dim)] text-[var(--color-accent)] border border-[var(--color-accent)]/30' },
  done:    { label: '완료',     className: 'bg-[var(--color-green-dim)] text-[var(--color-green)] border border-[var(--color-green)]/30' },
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const { label, className } = CONFIG[status];
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center rounded-full font-semibold tracking-wide ${sizeClass} ${className}`}>
      {label}
    </span>
  );
}
