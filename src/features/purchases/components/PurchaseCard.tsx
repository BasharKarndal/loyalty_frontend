import { Link } from 'react-router-dom';
import { ChevronLeft, Pencil, Star } from 'lucide-react';
import { cn } from '@shared/lib/cn';
import { formatCurrency, formatDateTime, formatNumber } from '@shared/lib/format';
import { useLoyaltyConfig } from '@/features/settings';
import { Icon } from '@shared/components';
import type { Purchase } from '../types/purchase.types';
import { CafeOwnerLabel } from '@/features/admin/components/CafeOwnerLabel';

interface PurchaseCardProps {
  purchase: Purchase;
  showEdit?: boolean;
  className?: string;
}

export function PurchaseCard({ purchase, showEdit, className }: PurchaseCardProps) {
  const { config } = useLoyaltyConfig();

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border border-line bg-panel p-4 shadow-sm transition-colors hover:border-wheat/30',
        className
      )}
    >
      <Link to={`/customers/${purchase.customer_id}`} className="min-w-0 flex-1">
        <h3 className="truncate text-base font-extrabold text-ink">
          {purchase.customer_name || 'عميل'}
        </h3>
        <CafeOwnerLabel ownerId={purchase.owner_id} />
        <p className="mt-0.5 text-xs text-muted">{formatDateTime(purchase.created_at)}</p>
        {purchase.notes && (
          <p className="mt-1 line-clamp-1 text-xs text-muted">{purchase.notes}</p>
        )}
      </Link>

      <div className="shrink-0 text-left">
        <p className="text-sm font-extrabold text-ink">
          {formatCurrency(purchase.amount, config.currency)}
        </p>
        <p className="mt-0.5 flex items-center justify-end gap-1 text-xs font-bold text-brand-500">
          <Icon icon={Star} size="xs" />+{formatNumber(purchase.points_earned)}
        </p>
      </div>

      {showEdit && (
        <Link
          to={`/purchases/${purchase.id}/edit`}
          className="shrink-0 rounded-xl border border-line p-2 text-muted transition-colors hover:border-wheat/40 hover:text-wheat"
          aria-label="تعديل المشترى"
        >
          <Icon icon={Pencil} size="sm" />
        </Link>
      )}

      <Link
        to={`/customers/${purchase.customer_id}`}
        className="shrink-0 text-muted transition-colors hover:text-wheat"
        aria-label="تفاصيل العميل"
      >
        <Icon icon={ChevronLeft} size="sm" />
      </Link>
    </div>
  );
}
