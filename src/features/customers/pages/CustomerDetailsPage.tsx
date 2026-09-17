import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Gift,
  Pencil,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import {
  Button,
  EmptyState,
  Icon,
  Modal,
  RouteFallback,
} from '@shared/components';
import { formatNumber } from '@shared/lib/format';
import {
  loyaltyEligible,
  loyaltyProgress,
  loyaltyRemaining,
} from '@shared/lib/loyalty';
import { useLoyaltyConfig } from '@/features/settings';
import { CustomerPermissions, GiftPermissions, PurchasePermissions, usePermissions } from '@/features/auth';
import {
  useCustomerQuery,
  useDeleteCustomerMutation,
} from '../api/customers.queries';
import {
  CustomerProfileHeader,
  CustomerStatsRow,
} from '../components/CustomerProfileHeader';
import { CustomerQrPanel } from '../components/CustomerQrPanel';
import { usePurchasesQuery } from '@/features/purchases/api/purchases.queries';
import { PurchaseCard } from '@/features/purchases/components/PurchaseCard';
import { useGiftsQuery, useGiftTypesQuery, useDeliverGiftMutation, useCancelGiftMutation } from '@/features/gifts/api/gifts.queries';
import { DeliverGiftModal } from '@/features/gifts/components/DeliverGiftModal';
import { GiftCard } from '@/features/gifts/components/GiftCard';
import { RedeemGiftModal } from '@/features/gifts/components/RedeemGiftModal';
import type { GiftRedemption } from '@/features/gifts/types/gift.types';

function LoyaltyTrack({
  title,
  progress,
  status,
  barClass,
}: {
  title: string;
  progress: number;
  status: string;
  barClass: string;
}) {
  return (
    <div className="rounded-xl border border-line/70 bg-surface/60 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-ink">{title}</span>
        <span className="text-xs font-bold text-muted">{status}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-panel">
        <div
          className={`h-full rounded-full transition-all ${barClass}`}
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: typeof Gift;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-base font-extrabold text-ink">
        <Icon icon={icon} size="sm" className="text-wheat" />
        {title}
      </h3>
      {children}
    </section>
  );
}

export function CustomerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canUpdate = can(CustomerPermissions.UPDATE);
  const canDelete = can(CustomerPermissions.DELETE);
  const canCreatePurchase = can(PurchasePermissions.CREATE);
  const canUpdatePurchase = can(PurchasePermissions.UPDATE);
  const canRedeemGift = can(GiftPermissions.REDEEM);
  const canDeliverGift = can(GiftPermissions.DELIVER);
  const canCancelGift = can(GiftPermissions.CANCEL);

  const [redeemOpen, setRedeemOpen] = useState(false);

  const { data: customer, isLoading, isError, refetch } = useCustomerQuery(id);
  const { data: purchasesData, isLoading: purchasesLoading } = usePurchasesQuery(
    { customer_id: id!, skip: 0, limit: 20 },
    Boolean(id)
  );
  const { data: giftsData, isLoading: giftsLoading } = useGiftsQuery(
    { customer_id: id!, skip: 0, limit: 20, exclude_cancelled: true },
    Boolean(id)
  );
  const { data: activeGiftTypes = [] } = useGiftTypesQuery(true);
  const hasGiftTypes = activeGiftTypes.length > 0;
  const deleteMutation = useDeleteCustomerMutation();
  const deliverGiftMutation = useDeliverGiftMutation();
  const cancelGiftMutation = useCancelGiftMutation();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deliverGift, setDeliverGift] = useState<GiftRedemption | null>(null);
  const [giftActionId, setGiftActionId] = useState<string | null>(null);

  const { config } = useLoyaltyConfig();
  const visitTarget = config.visitRewardTarget;
  const pointsTarget = config.pointsRewardTarget;

  if (isLoading) return <RouteFallback compact />;

  if (isError || !customer) {
    return (
      <EmptyState
        message="تعذر تحميل بيانات العميل"
        icon={AlertCircle}
        actionLabel="العودة للقائمة"
        onAction={() => navigate('/customers')}
      />
    );
  }

  if (!customer.is_active) {
    return (
      <EmptyState
        message="هذا العميل محذوف"
        description="يمكن استعادته من قائمة المحذوفين"
        actionLabel="العودة للقائمة"
        onAction={() => navigate('/customers')}
      />
    );
  }

  const visitEligible = loyaltyEligible(customer.visit_count, visitTarget);
  const pointsEligible = loyaltyEligible(customer.points, pointsTarget);

  const handleDelete = () => {
    deleteMutation.mutate(customer.id, {
      onSuccess: () => navigate('/customers'),
    });
  };

  return (
    <div className="page-shell mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/customers"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-wheat transition-colors hover:text-wheat-dark"
        >
          <Icon icon={ArrowRight} size="sm" />
          العودة للعملاء
        </Link>

        <div className="flex flex-wrap gap-2">
          {canUpdate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate(`/customers/${customer.id}/edit`)}
            >
              <Icon icon={Pencil} size="sm" />
              تعديل
            </Button>
          )}
          {canDelete && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              <Icon icon={Trash2} size="sm" />
              حذف
            </Button>
          )}
        </div>
      </div>

      <CustomerProfileHeader customer={customer} />
      <CustomerStatsRow customer={customer} />

      <SectionCard title="تقدم الهدايا" icon={Gift}>
        <div className="space-y-3">
          <LoyaltyTrack
            title="مسار هدية الزيارات"
            progress={loyaltyProgress(customer.visit_count, visitTarget)}
            status={
              visitEligible
                ? 'مؤهل لهدية الزيارات'
                : `متبقي ${formatNumber(loyaltyRemaining(customer.visit_count, visitTarget))} زيارة`
            }
            barClass="bg-wheat"
          />
          <LoyaltyTrack
            title="مسار هدية النقاط"
            progress={loyaltyProgress(customer.points, pointsTarget)}
            status={
              pointsEligible
                ? 'مؤهل لهدية النقاط'
                : `متبقي ${formatNumber(loyaltyRemaining(customer.points, pointsTarget))} نقطة`
            }
            barClass="bg-brand-500"
          />
          {(visitEligible || pointsEligible) && (
            <p className="text-sm font-extrabold text-wheat">العميل مؤهل للحصول على هدية</p>
          )}
        </div>
      </SectionCard>

      <SectionCard title="رمز QR للعميل" icon={Gift}>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-center sm:max-w-xs sm:text-right">
            <p className="text-sm font-bold text-ink">امسح الرمز لتحديد العميل بسرعة</p>
            <p className="mt-2 text-xs text-muted">
              يمكنك مشاركة الصورة عبر واتساب أو تحميلها من الأزرار أدناه
            </p>
          </div>
          <CustomerQrPanel
            customerId={customer.id}
            customerName={customer.name}
            phone={customer.phone}
            size={160}
          />
        </div>
      </SectionCard>

      <SectionCard title="المشتريات" icon={ShoppingBag}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted">آخر مشتريات هذا العميل</p>
          {canCreatePurchase && (
            <Button
              type="button"
              size="sm"
              onClick={() => navigate(`/purchases/new?customerId=${customer.id}`)}
            >
              <Icon icon={Plus} size="sm" />
              إضافة مشترى
            </Button>
          )}
        </div>

        {purchasesLoading && <RouteFallback compact />}

        {!purchasesLoading && (purchasesData?.items.length ?? 0) === 0 && (
          <p className="text-sm text-muted">لا توجد مشتريات مسجلة بعد</p>
        )}

        {!purchasesLoading && purchasesData && purchasesData.items.length > 0 && (
          <div className="space-y-2">
            {purchasesData.items.map((purchase) => (
              <PurchaseCard
                key={purchase.id}
                purchase={purchase}
                showEdit={canUpdatePurchase}
              />
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="الهدايا" icon={Gift}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted">سجل هدايا هذا العميل</p>
          {canRedeemGift && hasGiftTypes && (visitEligible || pointsEligible) && (
            <Button type="button" size="sm" onClick={() => setRedeemOpen(true)}>
              <Icon icon={Gift} size="sm" />
              استبدال هدية
            </Button>
          )}
        </div>

        {!hasGiftTypes && (
          <p className="mb-3 text-sm text-muted">
            لا يمكن الاستبدال حتى تُضاف أنواع هدايا من{' '}
            <Link to="/gifts/types" className="font-bold text-wheat hover:underline">
              إدارة الأنواع
            </Link>
            .
          </p>
        )}

        {giftsLoading && <RouteFallback compact />}

        {!giftsLoading && (giftsData?.items.length ?? 0) === 0 && (
          <p className="text-sm text-muted">لا توجد هدايا مسجلة بعد</p>
        )}

        {!giftsLoading && giftsData && giftsData.items.length > 0 && (
          <div className="space-y-2">
            {giftsData.items.map((gift) => (
              <GiftCard
                key={gift.id}
                gift={gift}
                onDeliver={
                  canDeliverGift && gift.status === 'pending'
                    ? () => setDeliverGift(gift)
                    : undefined
                }
                onCancel={
                  canCancelGift && gift.status === 'pending'
                    ? async () => {
                        setGiftActionId(gift.id);
                        try {
                          await cancelGiftMutation.mutateAsync(gift.id);
                        } finally {
                          setGiftActionId(null);
                        }
                      }
                    : undefined
                }
                delivering={deliverGift?.id === gift.id && deliverGiftMutation.isPending}
                cancelling={giftActionId === gift.id && cancelGiftMutation.isPending}
              />
            ))}
          </div>
        )}
      </SectionCard>

      {customer && (
        <RedeemGiftModal
          open={redeemOpen}
          customer={customer}
          onClose={() => setRedeemOpen(false)}
        />
      )}

      <DeliverGiftModal
        open={Boolean(deliverGift)}
        gift={deliverGift}
        onClose={() => setDeliverGift(null)}
      />

      <Modal
        open={deleteOpen}
        title="حذف العميل"
        description={`هل أنت متأكد من حذف "${customer.name}"؟ يمكن استعادته لاحقاً من قائمة المحذوفين.`}
        confirmLabel="حذف"
        confirmVariant="danger"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}
