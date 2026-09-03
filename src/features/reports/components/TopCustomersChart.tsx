import { customerInitial, formatCurrency } from '@shared/lib/format';
import type { TopCustomerSpend } from '../types/report.types';
import { ChartCard } from './ChartCard';

interface TopCustomersChartProps {
  title: string;
  items: TopCustomerSpend[];
  currency: string;
}

export function TopCustomersChart({ title, items, currency }: TopCustomersChartProps) {
  if (items.length === 0) {
    return (
      <ChartCard title={title}>
        <div className="flex h-[160px] items-center justify-center text-sm text-muted">
          لا يوجد عملاء في هذه الفترة
        </div>
      </ChartCard>
    );
  }

  const maxSpent = Math.max(...items.map((i) => Number(i.spent)), 1);

  return (
    <ChartCard title={title}>
      <ul className="space-y-3">
        {items.map((item) => {
          const spent = Number(item.spent);
          const widthPct = Math.max((spent / maxSpent) * 100, 6);
          return (
            <li key={item.customer_id}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-wheat/15 text-xs font-extrabold text-wheat-dark">
                    {customerInitial(item.customer_name)}
                  </span>
                  <span className="truncate font-bold text-ink">{item.customer_name}</span>
                </span>
                <span className="shrink-0 font-extrabold text-ink">
                  {formatCurrency(spent, currency)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-wheat to-umber"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </ChartCard>
  );
}
