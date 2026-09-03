import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Textarea } from '@shared/components';
import { formatNumber } from '@shared/lib/format';
import { pointsForPurchase } from '@shared/lib/loyalty';
import { useLoyaltyConfig } from '@/features/settings';
import {
  purchaseEditSchema,
  purchaseFormSchema,
  type PurchaseEditValues,
  type PurchaseFormValues,
} from '../schemas/purchase.schema';
import type { Purchase } from '../types/purchase.types';
import { CustomerSelect } from './CustomerSelect';

interface PurchaseFormProps {
  purchase?: Purchase;
  defaultCustomerId?: string;
  loading?: boolean;
  onSubmit: (values: PurchaseFormValues | PurchaseEditValues) => void;
  onCancel?: () => void;
}

export function PurchaseForm({
  purchase,
  defaultCustomerId,
  loading,
  onSubmit,
  onCancel,
}: PurchaseFormProps) {
  const isEditing = Boolean(purchase);
  const { config } = useLoyaltyConfig();

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(isEditing ? purchaseFormSchema.partial({ customer_id: true }) : purchaseFormSchema),
    defaultValues: {
      customer_id: purchase?.customer_id ?? defaultCustomerId ?? '',
      amount: purchase ? Number(purchase.amount) : undefined,
      notes: purchase?.notes ?? '',
    },
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (purchase) {
      reset({
        customer_id: purchase.customer_id,
        amount: Number(purchase.amount),
        notes: purchase.notes ?? '',
      });
    } else if (defaultCustomerId) {
      setValue('customer_id', defaultCustomerId);
    }
  }, [purchase, defaultCustomerId, reset, setValue]);

  const amount = useWatch({ control, name: 'amount' });
  const previewPoints = useMemo(
    () => pointsForPurchase(amount ?? 0, config.currencyPerPoint),
    [amount, config.currencyPerPoint]
  );

  const customerId = watch('customer_id');

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto max-w-xl space-y-5 rounded-2xl border border-line bg-panel p-5 shadow-sm sm:p-6"
    >
      {!isEditing && (
        <CustomerSelect
          value={customerId}
          onChange={(id) => setValue('customer_id', id, { shouldValidate: true })}
          disabled={loading || Boolean(defaultCustomerId)}
          error={errors.customer_id?.message}
        />
      )}

      {isEditing && purchase && (
        <div className="rounded-xl border border-line bg-surface/60 p-4">
          <p className="text-xs font-bold text-muted">العميل</p>
          <p className="mt-1 text-sm font-extrabold text-ink">{purchase.customer_name}</p>
          <p className="text-sm text-muted">{purchase.customer_phone}</p>
        </div>
      )}

      <Input
        label="المبلغ"
        type="number"
        min={0}
        step="any"
        placeholder="0"
        dir="ltr"
        className="text-left"
        error={errors.amount?.message}
        {...register('amount', { valueAsNumber: true })}
      />

      <div className="rounded-xl border border-wheat/25 bg-wheat/10 px-4 py-3">
        <p className="text-xs font-bold text-muted">النقاط المتوقعة</p>
        <p className="mt-1 text-lg font-extrabold text-wheat">
          +{formatNumber(previewPoints)} نقطة
        </p>
        <p className="mt-1 text-xs text-muted">
          كل {formatNumber(config.currencyPerPoint)} {config.currency} = نقطة واحدة
        </p>
      </div>

      <Textarea
        label="ملاحظة (اختياري)"
        placeholder="ملاحظة عن المشترى..."
        rows={3}
        error={errors.notes?.message}
        {...register('notes')}
      />

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            إلغاء
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'جاري الحفظ...' : isEditing ? 'حفظ التعديلات' : 'تسجيل المشترى'}
        </Button>
      </div>
    </form>
  );
}
