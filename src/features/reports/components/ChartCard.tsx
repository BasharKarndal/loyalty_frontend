import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function ChartCard({ title, children, className = '' }: ChartCardProps) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-line bg-panel shadow-sm ${className}`}
    >
      <div className="border-b border-line px-4 py-3">
        <h3 className="text-sm font-extrabold text-ink">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
