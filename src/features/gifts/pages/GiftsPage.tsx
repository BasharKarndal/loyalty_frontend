import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Gift, Plus, Settings } from 'lucide-react';
import { Button, EmptyState, Icon, RouteFallback } from '@shared/components';
import { getApiErrorMessage } from '@shared/lib/apiError';
import { formatNumber } from '@shared/lib/format';
import { isEligibleForAny } from '@shared/lib/loyalty';
import { useLoyaltyConfig } from '@/features/settings';
import { GiftPermissions, GiftTypePermissions, usePermissions } from '@/features/auth';
import { useCustomersQuery } from '@/features/customers/api/customers.queries';
import {
  useCancelGiftMutation,
  useDeliverGiftMutation,
  useGiftTypesQuery,
  useGiftsQuery,
  useSyncPendingGiftsMutation,
} from '../api/gifts.queries';
import { GiftCard } from '../components/GiftCard';
import { DeliverGiftModal } from '../components/DeliverGiftModal';
import { EligibleCustomerCard, RedeemGiftModal } from '../components/RedeemGiftModal';
import { PeriodChip } from '@/features/purchases/components/PeriodChip';
import type { Customer } from '@/features/customers/types/customer.types';
import type { GiftRedemption, GiftStatusFilter } from '../types/gift.types';

export function GiftsPage() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canRedeem = can(GiftPermissions.REDEEM);
  const canDeliver = can(GiftPermissions.DELIVER);
  const canCancel = can(GiftPermissions.CANCEL);
  const canManageTypes = can(GiftTypePermissions.CREATE);

  const { data: activeGiftTypes = [], isLoading: typesLoading } = useGiftTypesQuery(true);
  const hasGiftTypes = activeGiftTypes.length > 0;

  const [filter, setFilter] = useState<GiftStatusFilter>('pending');
  const [redeemCustomer, setRedeemCustomer] = useState<Customer | null>(null);
  const [deliverGift, setDeliverGift] = useState<GiftRedemption | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [syncReady, setSyncReady] = useState(false);

  const syncPending = useSyncPendingGiftsMutation();

  useEffect(() => {
    syncPending.mutate(undefined, {
      onSettled: () => setSyncReady(true),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  const listParams = useMemo(
    () => ({
      skip: 0,
      limit: 100,
      status: filter === 'all' ? undefined : filter,
      exclude_cancelled: filter === 'all',
    }),
    [filter]
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useGiftsQuery(listParams, syncReady);
  const { data: customersData } = useCustomersQuery({ skip: 0, limit: 200, active_only: true });
  const deliverMutation = useDeliverGiftMutation();
  const cancelMutation = useCancelGiftMutation();

  const { config } = useLoyaltyConfig();

  const eligibleCustomers = useMemo(
    () =>
      (customersData?.items ?? []).filter((c) =>
        isEligibleForAny(c.visit_count, c.points, config)
      ),
    [customersData, config]
  );

  const eligibleWithoutPending = useMemo(() => {
    const pendingCustomerIds = new Set(
      (data?.items ?? []).filter((g) => g.status === 'pending').map((g) => g.customer_id)
    );
    return eligibleCustomers.filter((c) => !pendingCustomerIds.has(c.id));
  }, [eligibleCustomers, data?.items]);

  const showLegacyEligible =
    filter === 'pending' &&
    eligibleWithoutPending.length > 0 &&
    canRedeem &&
    hasGiftTypes &&
    syncReady;

  const handleDeliver = (gift: GiftRedemption) => {
    setDeliverGift(gift);
  };

  const handleCancel = async (id: string) => {
    setActionId(id);
    try {
      await cancelMutation.mutateAsync(id);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="page-shell mx-auto max-w-4xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-ink">الهدايا</h2>
          <p className="mt-1 text-sm text-muted">استبدال وتسليم هدايا الولاء</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => navigate('/gifts/types')}>
            <Icon icon={Settings} size="sm" />
            أنواع الهدايا ({formatNumber(activeGiftTypes.length)})
          </Button>
        </div>
      </div>

      {!typesLoading && !hasGiftTypes && (
        <div className="rounded-2xl border border-wheat/30 bg-wheat/10 p-4">
          <p className="text-sm font-bold text-ink">لم تُعرّف أي نوع هدية بعد</p>
          <p className="mt-1 text-sm text-muted">
            أنواع الهدايا تُدار يدوياً — أضف ما يناسب مقهاك (مثل: قهوة، كيك، خصم...) قبل استبدال
            الهدايا.
          </p>
          {canManageTypes && (
            <Button type="button" size="sm" className="mt-3" onClick={() => navigate('/gifts/types')}>
              <Icon icon={Plus} size="sm" />
              إضافة أول نوع هدية
            </Button>
          )}
        </div>
      )}

      {data && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-line bg-panel p-4">
            <p className="text-xs font-bold text-muted">قيد الانتظار</p>
            <p className="mt-1 text-2xl font-extrabold text-wheat">{formatNumber(data.pending_count)}</p>
          </div>
          <div className="rounded-xl border border-line bg-panel p-4">
            <p className="text-xs font-bold text-muted">مُسلّمة</p>
            <p className="mt-1 text-2xl font-extrabold text-umber">{formatNumber(data.delivered_count)}</p>
          </div>
          <div className="rounded-xl border border-line bg-panel p-4">
            <p className="text-xs font-bold text-muted">مؤهلون (لم تُسجَّل)</p>
            <p className="mt-1 text-2xl font-extrabold text-brand-500">
              {formatNumber(eligibleWithoutPending.length)}
            </p>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <h3 className="text-base font-extrabold text-ink">
          {filter === 'pending' ? 'هدايا قيد الانتظار' : 'سجل الهدايا'}
        </h3>
        <div className="flex flex-wrap gap-2">
          <PeriodChip label="الكل" selected={filter === 'all'} onClick={() => setFilter('all')} />
          <PeriodChip label="قيد الانتظار" selected={filter === 'pending'} onClick={() => setFilter('pending')} />
          <PeriodChip label="مُسلّمة" selected={filter === 'delivered'} onClick={() => setFilter('delivered')} />
        </div>

        {data && (
          <p className="text-sm font-bold text-muted">
            العدد: {formatNumber(data.total)}
            {isFetching && !isLoading && (
              <span className="mr-2 text-xs font-normal">— جاري التحديث...</span>
            )}
          </p>
        )}

        {(!syncReady || syncPending.isPending || isLoading) && <RouteFallback compact />}
        {syncReady && !syncPending.isPending && !isLoading && isError && (
          <EmptyState
            message={getApiErrorMessage(error, 'تعذر تحميل الهدايا')}
            icon={AlertCircle}
            actionLabel="إعادة المحاولة"
            onAction={() => refetch()}
          />
        )}
        {syncReady &&
          !syncPending.isPending &&
          !isLoading &&
          !isError &&
          data?.items.length === 0 &&
          !showLegacyEligible && (
          <EmptyState
            message={
              filter === 'pending'
                ? 'لا توجد هدايا قيد الانتظار'
                : filter === 'delivered'
                  ? 'لا توجد هدايا مُسلّمة'
                  : 'لا توجد هدايا'
            }
            icon={Gift}
          />
        )}

        {showLegacyEligible && (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              عملاء وصلوا للهدية قبل تفعيل التسجيل التلقائي — يمكنك تسجيل هديتهم يدوياً:
            </p>
            {eligibleWithoutPending.map((customer) => (
              <EligibleCustomerCard
                key={customer.id}
                customer={customer}
                onRedeem={() => setRedeemCustomer(customer)}
              />
            ))}
          </div>
        )}

        {syncReady && !syncPending.isPending && !isLoading && !isError && data && data.items.length > 0 && (
          <div className="space-y-3">
            {data.items.map((gift) => (
              <GiftCard
                key={gift.id}
                gift={gift}
                onDeliver={canDeliver && gift.status === 'pending' ? () => handleDeliver(gift) : undefined}
                onCancel={canCancel && gift.status === 'pending' ? () => handleCancel(gift.id) : undefined}
                delivering={deliverGift?.id === gift.id && deliverMutation.isPending}
                cancelling={actionId === gift.id && cancelMutation.isPending}
              />
            ))}
          </div>
        )}
      </section>

      {redeemCustomer && (
        <RedeemGiftModal
          open={Boolean(redeemCustomer)}
          customer={redeemCustomer}
          onClose={() => setRedeemCustomer(null)}
        />
      )}

      <DeliverGiftModal
        open={Boolean(deliverGift)}
        gift={deliverGift}
        onClose={() => setDeliverGift(null)}
      />
    </div>
  );
}
