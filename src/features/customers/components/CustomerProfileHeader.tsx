import { Phone, Star, Store, Wallet } from 'lucide-react';
import { cn } from '@shared/lib/cn';
import { formatCurrency, formatNumber, customerInitial, formatDateTime } from '@shared/lib/format';
import { useLoyaltyConfig } from '@/features/settings';
import { Icon } from '@shared/components';
import type { Customer } from '../types/customer.types';

interface CustomerProfileHeaderProps {
  customer: Customer;
  className?: string;
}

export function CustomerProfileHeader({ customer, className }: CustomerProfileHeaderProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-line bg-panel shadow-sm',
        className
      )}
    >
      <div className="bg-gradient-to-l from-brand-500 to-umber px-5 py-6 text-white">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/15 text-2xl font-extrabold">
            {customerInitial(customer.name)}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-extrabold">{customer.name}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-white/85">
              <Icon icon={Phone} size="sm" />
              {customer.phone}
            </p>
            <p className="mt-1 text-xs text-white/70">
              عضو منذ {formatDateTime(customer.created_at)}
            </p>
          </div>
        </div>
      </div>

      {customer.notes && (
        <div className="border-t border-line px-5 py-3">
          <p className="text-xs font-bold text-muted">ملاحظات</p>
          <p className="mt-1 text-sm text-ink">{customer.notes}</p>
        </div>
      )}
    </div>
  );
}

interface StatTileProps {
  icon: typeof Star;
  label: string;
  value: string;
  tone?: 'brand' | 'gold' | 'teal';
}

const toneClasses = {
  brand: 'bg-brand-500/10 text-brand-500',
  gold: 'bg-wheat/15 text-wheat-dark',
  teal: 'bg-umber/10 text-umber',
};

export function CustomerStatsRow({ customer }: { customer: Customer }) {
  const { config } = useLoyaltyConfig();
  const tiles: StatTileProps[] = [
    {
      icon: Star,
      label: 'النقاط',
      value: formatNumber(customer.points),
      tone: 'brand',
    },
    {
      icon: Store,
      label: 'الزيارات',
      value: formatNumber(customer.visit_count),
      tone: 'gold',
    },
    {
      icon: Wallet,
      label: 'إجمالي الإنفاق',
      value: formatCurrency(customer.total_spent, config.currency),
      tone: 'teal',
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="rounded-2xl border border-line bg-panel p-4 shadow-sm"
        >
          <div
            className={cn(
              'mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl',
              toneClasses[tile.tone ?? 'brand']
            )}
          >
            <Icon icon={tile.icon} size="sm" />
          </div>
          <p className="text-xs font-bold text-muted">{tile.label}</p>
          <p className="mt-1 text-lg font-extrabold text-ink">{tile.value}</p>
        </div>
      ))}
    </div>
  );
}
