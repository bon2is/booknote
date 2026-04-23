import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export default function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center py-20 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center mb-4 text-[var(--color-muted)]">
        {icon}
      </div>
      <p className="text-sm font-semibold text-[var(--color-text)] mb-1">{title}</p>
      <p className="text-xs text-[var(--color-muted)] leading-relaxed">{description}</p>
    </div>
  );
}
