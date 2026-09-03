import { useNavigate } from 'react-router-dom';
import { Gift, ShoppingBag, User, X } from 'lucide-react';
import { Button, Icon } from '@shared/components';
import { customerInitial } from '@shared/lib/format';
import { GiftPermissions, PurchasePermissions, usePermissions } from '@/features/auth';
import type { Customer } from '../types/customer.types';

interface ScanActionSheetProps {
  open: boolean;
  customer: Customer;
  onClose: () => void;
}

export function ScanActionSheet({ open, customer, onClose }: ScanActionSheetProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canCreatePurchase = can(PurchasePermissions.CREATE);
  const canRedeemGift = can(GiftPermissions.REDEEM);

  if (!open) return null;

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center lg:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-charcoal/55 backdrop-blur-[1px]"
        onClick={onClose}
        aria-label="إغلاق"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-t-3xl border border-line bg-panel p-5 shadow-2xl lg:rounded-3xl"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line lg:hidden" />

        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-lg font-extrabold text-brand-500">
              {customerInitial(customer.name)}
            </div>
            <div>
              <p className="text-xs font-bold text-wheat">تم التعرف على العميل</p>
              <h2 className="text-lg font-extrabold text-ink">{customer.name}</h2>
              <p className="text-sm text-muted">{customer.phone}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
            aria-label="إغلاق"
          >
            <Icon icon={X} size="sm" />
          </button>
        </div>

        <div className="grid gap-2">
          {canCreatePurchase && (
            <Button
              type="button"
              className="w-full justify-start"
              onClick={() => go(`/purchases/new?customerId=${customer.id}`)}
            >
              <Icon icon={ShoppingBag} size="sm" />
              إضافة مشترى
            </Button>
          )}

          {canRedeemGift && (
            <Button
              type="button"
              variant="secondary"
              className="w-full justify-start"
              onClick={() => go(`/customers/${customer.id}`)}
            >
              <Icon icon={Gift} size="sm" />
              صرف هدية / فتح الملف
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full justify-start"
            onClick={() => go(`/customers/${customer.id}`)}
          >
            <Icon icon={User} size="sm" />
            فتح ملف العميل
          </Button>
        </div>
      </div>
    </div>
  );
}
