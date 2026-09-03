import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Store, Star } from 'lucide-react';
import { Icon, Modal } from '@shared/components';
import { useDeliverGiftMutation, useGiftTypesQuery } from '../api/gifts.queries';
import { GiftTypeVisual } from './GiftTypeVisual';
import type { GiftRedemption } from '../types/gift.types';

interface DeliverGiftModalProps {
  open: boolean;
  gift: GiftRedemption | null;
  onClose: () => void;
}

export function DeliverGiftModal({ open, gift, onClose }: DeliverGiftModalProps) {
  const [giftTypeId, setGiftTypeId] = useState('');
  const { data: giftTypes = [] } = useGiftTypesQuery(true);
  const deliverMutation = useDeliverGiftMutation();

  useEffect(() => {
    if (!open || !gift) return;
    setGiftTypeId(gift.gift_type_id ?? '');
  }, [open, gift?.id, gift?.gift_type_id]);

  const handleClose = () => {
    setGiftTypeId('');
    onClose();
  };

  const handleDeliver = () => {
    if (!gift || !giftTypeId) return;
    deliverMutation.mutate(
      { id: gift.id, gift_type_id: giftTypeId },
      { onSuccess: () => handleClose() }
    );
  };

  if (!gift) return null;

  const trackLabel = gift.reward_track === 'visits' ? 'مسار الزيارات' : 'مسار النقاط';
  const trackIcon = gift.reward_track === 'visits' ? Store : Star;

  return (
    <Modal
      open={open}
      title="تأكيد تسليم الهدية"
      description={`اختر نوع الهدية المُسلّمة للعميل ${gift.customer_name}`}
      confirmLabel="تأكيد التسليم"
      loading={deliverMutation.isPending}
      onConfirm={handleDeliver}
      onClose={handleClose}
    >
      <div className="space-y-4">
        <p className="inline-flex items-center gap-1.5 text-sm font-bold text-muted">
          <Icon icon={trackIcon} size="sm" />
          {trackLabel}
        </p>

        <div>
          <p className="mb-2 text-sm font-bold text-ink">نوع الهدية</p>
          {giftTypes.length === 0 ? (
            <div className="rounded-xl border border-line bg-surface/60 p-4 text-sm text-muted">
              <p className="font-bold text-ink">لا توجد أنواع هدايا نشطة</p>
              <p className="mt-1">
                يجب إضافة أنواع الهدايا من{' '}
                <Link to="/gifts/types" className="font-bold text-wheat hover:underline">
                  صفحة إدارة الأنواع
                </Link>{' '}
                قبل التسليم.
              </p>
            </div>
          ) : (
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {giftTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setGiftTypeId(type.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-right transition-colors ${
                    giftTypeId === type.id
                      ? 'border-wheat bg-wheat/10'
                      : 'border-line hover:border-wheat/30'
                  }`}
                >
                  <GiftTypeVisual iconKey={type.icon_key} name={type.name} size="sm" />
                  <span className="text-sm font-bold text-ink">{type.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {!giftTypeId && giftTypes.length > 0 && (
          <p className="text-sm text-muted">اختر نوع الهدية للمتابعة</p>
        )}
      </div>
    </Modal>
  );
}
