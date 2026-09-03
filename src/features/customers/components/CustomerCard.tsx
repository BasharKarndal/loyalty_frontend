import { ChevronLeft, RotateCcw, Star, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@shared/lib/cn';
import { formatCurrency, formatNumber, customerInitial } from '@shared/lib/format';
import {
  loyaltyEligible,
  loyaltyProgress,
  loyaltyRemaining,
} from '@shared/lib/loyalty';
import { useLoyaltyConfig } from '@/features/settings';
import { Icon } from '@shared/components';
import type { Customer } from '../types/customer.types';
import { CafeOwnerLabel } from '@/features/admin/components/CafeOwnerLabel';

interface CustomerCardProps {
  customer: Customer;
  className?: string;
}

function StatChip({
  icon,
  label,
  colorClass,
}: {
  icon: typeof Star;
  label: string;
  colorClass: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
        colorClass
      )}
    >
      <Icon icon={icon} size="xs" />
      {label}
    </span>
  );
}

function MiniTrackBar({
  label,
  progress,
  status,
  barClass,
}: {
  label: string;
  progress: number;
  status: string;
  barClass: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-muted">{label}</span>
        <span className="font-bold text-ink">{status}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface">
        <div
          className={cn('h-full rounded-full transition-all', barClass)}
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
}

export function CustomerCard({ customer, className }: CustomerCardProps) {
  const { config } = useLoyaltyConfig();
  const visitTarget = config.visitRewardTarget;
  const pointsTarget = config.pointsRewardTarget;
  const visitEligible = loyaltyEligible(customer.visit_count, visitTarget);
  const pointsEligible = loyaltyEligible(customer.points, pointsTarget);
  const eligible = visitEligible || pointsEligible;

  return (
    <Link
      to={`/customers/${customer.id}`}
      className={cn(
        'group block rounded-2xl border border-line/80 bg-panel p-4 shadow-sm transition-all',
        'hover:border-wheat/40 hover:shadow-md',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-base font-extrabold text-brand-500">
          {customerInitial(customer.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-extrabold text-ink">{customer.name}</h3>
          <CafeOwnerLabel ownerId={customer.owner_id} />
          <p className="truncate text-sm font-semibold text-muted">{customer.phone}</p>
        </div>
        <Icon
          icon={ChevronLeft}
          size="sm"
          className="shrink-0 text-muted transition-transform group-hover:-translate-x-0.5"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <StatChip
          icon={Star}
          label={`النقاط: ${formatNumber(customer.points)}`}
          colorClass="bg-brand-500/10 text-brand-500"
        />
        <StatChip
          icon={Store}
          label={`الزيارات: ${formatNumber(customer.visit_count)}`}
          colorClass="bg-wheat/15 text-wheat-dark"
        />
      </div>

      <p className="mt-2 text-sm font-semibold text-muted">
        إجمالي المشتريات: {formatCurrency(customer.total_spent, config.currency)}
      </p>

      <div className="mt-3 space-y-2">
        <MiniTrackBar
          label="مسار هدية الزيارات"
          progress={loyaltyProgress(customer.visit_count, visitTarget)}
          status={
            visitEligible
              ? 'مؤهل لهدية الزيارات'
              : `متبقي ${formatNumber(loyaltyRemaining(customer.visit_count, visitTarget))}`
          }
          barClass="bg-wheat"
        />
        <MiniTrackBar
          label="مسار هدية النقاط"
          progress={loyaltyProgress(customer.points, pointsTarget)}
          status={
            pointsEligible
              ? 'مؤهل لهدية النقاط'
              : `متبقي ${formatNumber(loyaltyRemaining(customer.points, pointsTarget))}`
          }
          barClass="bg-brand-500"
        />
      </div>

      {eligible && (
        <p className="mt-2 text-xs font-extrabold text-wheat">مؤهل للحصول على هدية</p>
      )}
    </Link>
  );
}

interface InactiveCustomerCardProps {
  customer: Customer;
  onRestore?: () => void;
  restoring?: boolean;
}

export function InactiveCustomerCard({
  customer,
  onRestore,
  restoring,
}: InactiveCustomerCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line/80 bg-panel/80 p-4">
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-extrabold text-ink">{customer.name}</h3>
        <CafeOwnerLabel ownerId={customer.owner_id} />
        <p className="truncate text-sm text-muted">{customer.phone}</p>
      </div>
      {onRestore && (
        <button
          type="button"
          onClick={onRestore}
          disabled={restoring}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-umber/10 px-3 py-2 text-sm font-bold text-umber transition-colors hover:bg-umber/20 disabled:opacity-50"
        >
          <Icon icon={RotateCcw} size="sm" />
          {restoring ? 'جاري الاستعادة...' : 'استعادة'}
        </button>
      )}
    </div>
  );
}
