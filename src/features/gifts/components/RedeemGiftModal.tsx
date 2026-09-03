import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Gift, Store, Star } from 'lucide-react';
import { Button, Icon, Modal, Textarea } from '@shared/components';
import { useGiftTypesQuery, useRedeemGiftMutation } from '../api/gifts.queries';
import { GiftTypeVisual } from './GiftTypeVisual';
import type { Customer } from '@/features/customers/types/customer.types';
import {
  loyaltyEligible,
} from '@shared/lib/loyalty';
import { useLoyaltyConfig } from '@/features/settings';

interface RedeemGiftModalProps {
  open: boolean;
  customer: Customer;
  onClose: () => void;
}

type RewardTrack = 'visits' | 'amount';

export function RedeemGiftModal({ open, customer, onClose }: RedeemGiftModalProps) {
  const { config } = useLoyaltyConfig();
  const visitEligible = loyaltyEligible(customer.visit_count, config.visitRewardTarget);
  const pointsEligible = loyaltyEligible(customer.points, config.pointsRewardTarget);

  const availableTracks: RewardTrack[] = [];
  if (visitEligible) availableTracks.push('visits');
  if (pointsEligible) availableTracks.push('amount');

  const [track, setTrack] = useState<RewardTrack | ''>('');
  const [giftTypeId, setGiftTypeId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    const tracks: RewardTrack[] = [];
    if (visitEligible) tracks.push('visits');
    if (pointsEligible) tracks.push('amount');
    setTrack(tracks.length === 1 ? tracks[0] : '');
    setGiftTypeId('');
    setNotes('');
  }, [open, customer.id, visitEligible, pointsEligible]);

  const { data: giftTypes = [] } = useGiftTypesQuery(true);
  const redeemMutation = useRedeemGiftMutation();

  const handleClose = () => {
    setTrack(availableTracks.length === 1 ? availableTracks[0] : '');
    setGiftTypeId('');
    setNotes('');
    onClose();
  };

  const handleRedeem = () => {
    if (!track || !giftTypeId) return;
    redeemMutation.mutate(
      {
        customer_id: customer.id,
        gift_type_id: giftTypeId,
        reward_track: track,
        notes: notes.trim() || null,
      },
      { onSuccess: () => handleClose() }
    );
  };

  return (
    <Modal
      open={open}
      title="استبدال هدية"
      description={`استبدال هدية للعميل ${customer.name}`}
      confirmLabel="استبدال"
      loading={redeemMutation.isPending}
      onConfirm={handleRedeem}
      onClose={handleClose}
    >
      <div className="space-y-4">
        {availableTracks.length === 0 && (
          <p className="text-sm text-danger">العميل غير مؤهل لأي مسار هدايا حالياً</p>
        )}

        {availableTracks.length > 1 && (
          <div>
            <p className="mb-2 text-sm font-bold text-ink">اختر مسار الهدية</p>
            <div className="flex flex-wrap gap-2">
              {availableTracks.includes('visits') && (
                <Button
                  type="button"
                  size="sm"
                  variant={track === 'visits' ? 'primary' : 'outline'}
                  onClick={() => setTrack('visits')}
                >
                  <Icon icon={Store} size="sm" />
                  هدية الزيارات
                </Button>
              )}
              {availableTracks.includes('amount') && (
                <Button
                  type="button"
                  size="sm"
                  variant={track === 'amount' ? 'primary' : 'outline'}
                  onClick={() => setTrack('amount')}
                >
                  <Icon icon={Star} size="sm" />
                  هدية النقاط
                </Button>
              )}
            </div>
          </div>
        )}

        {availableTracks.length === 1 && (
          <p className="text-sm text-muted">
            المسار: {availableTracks[0] === 'visits' ? 'هدية الزيارات' : 'هدية النقاط'}
          </p>
        )}

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
                قبل الاستبدال.
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

        <Textarea
          label="ملاحظة (اختياري)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>
    </Modal>
  );
}

interface EligibleCustomerCardProps {
  customer: Customer;
  onRedeem: () => void;
}

export function EligibleCustomerCard({ customer, onRedeem }: EligibleCustomerCardProps) {
  const { config } = useLoyaltyConfig();
  const visitEligible = loyaltyEligible(customer.visit_count, config.visitRewardTarget);
  const pointsEligible = loyaltyEligible(customer.points, config.pointsRewardTarget);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-wheat/25 bg-wheat/5 p-4">
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-extrabold text-ink">{customer.name}</h3>
        <p className="text-xs text-muted">{customer.phone}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {visitEligible && (
            <span className="rounded-full bg-wheat/15 px-2 py-0.5 text-xs font-bold text-wheat-dark">
              مؤهل — زيارات
            </span>
          )}
          {pointsEligible && (
            <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-bold text-brand-500">
              مؤهل — نقاط
            </span>
          )}
        </div>
      </div>
      <Button type="button" size="sm" onClick={onRedeem}>
        <Icon icon={Gift} size="sm" />
        صرف هدية
      </Button>
    </div>
  );
}
