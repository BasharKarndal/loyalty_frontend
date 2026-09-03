import { Link } from 'react-router-dom';
import { Check, Store, Star, X } from 'lucide-react';
import { Button, Icon } from '@shared/components';
import { formatDateTime, formatNumber } from '@shared/lib/format';
import { cn } from '@shared/lib/cn';
import { GiftTypeVisual } from './GiftTypeVisual';
import type { GiftRedemption } from '../types/gift.types';
import { CafeOwnerLabel } from '@/features/admin/components/CafeOwnerLabel';

const statusLabels = {
  pending: 'قيد الانتظار',
  delivered: 'مُسلّمة',
  cancelled: 'ملغاة',
};

const statusClasses = {
  pending: 'bg-wheat/15 text-wheat-dark',
  delivered: 'bg-umber/10 text-umber',
  cancelled: 'bg-surface text-muted',
};

interface GiftCardProps {
  gift: GiftRedemption;
  onDeliver?: () => void;
  onCancel?: () => void;
  delivering?: boolean;
  cancelling?: boolean;
}

export function GiftCard({
  gift,
  onDeliver,
  onCancel,
  delivering,
  cancelling,
}: GiftCardProps) {
  const trackLabel = gift.reward_track === 'visits' ? 'مسار الزيارات' : 'مسار النقاط';
  const trackIcon = gift.reward_track === 'visits' ? Store : Star;

  return (
    <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <GiftTypeVisual iconKey={gift.gift_type_icon} name={gift.gift_type_name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-extrabold text-ink">{gift.gift_type_name}</h3>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-bold',
                statusClasses[gift.status]
              )}
            >
              {statusLabels[gift.status]}
            </span>
          </div>
          <Link
            to={`/customers/${gift.customer_id}`}
            className="mt-1 block text-sm font-semibold text-wheat hover:underline"
          >
            {gift.customer_name}
          </Link>
          <CafeOwnerLabel ownerId={gift.owner_id} />
          <p className="mt-0.5 text-xs text-muted">{formatDateTime(gift.created_at)}</p>
          <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-muted">
            <Icon icon={trackIcon} size="xs" />
            {trackLabel} — التكلفة {formatNumber(gift.points_used)}
          </p>
          {gift.notes && <p className="mt-1 text-xs text-muted">{gift.notes}</p>}
          {!gift.gift_type_id && gift.status === 'pending' && (
            <p className="mt-2 text-xs font-bold text-wheat">بانتظار تسليم الهدية للعميل</p>
          )}
        </div>
      </div>

      {gift.status === 'pending' && (onDeliver || onCancel) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {onDeliver && (
            <Button type="button" size="sm" onClick={onDeliver} disabled={delivering}>
              <Icon icon={Check} size="sm" />
              {delivering ? 'جاري التأكيد...' : 'تأكيد التسليم'}
            </Button>
          )}
          {onCancel && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onCancel}
              disabled={cancelling}
            >
              <Icon icon={X} size="sm" />
              {cancelling ? 'جاري الإلغاء...' : 'إلغاء'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
