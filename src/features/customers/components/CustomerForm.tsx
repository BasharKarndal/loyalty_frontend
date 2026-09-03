import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MessageCircle } from 'lucide-react';
import { Button, Icon, Input, PhoneInput, Textarea } from '@shared/components';
import { composePhone, DEFAULT_DIAL_CODE, splitPhone } from '@shared/lib/phoneUtils';
import {
  customerFormSchema,
  type CustomerFormValues,
} from '../schemas/customer.schema';
import type { Customer } from '../types/customer.types';

interface CustomerFormProps {
  customer?: Customer;
  loading?: boolean;
  onSubmit: (values: CustomerFormValues) => void;
  onCancel?: () => void;
}

export function CustomerForm({ customer, loading, onSubmit, onCancel }: CustomerFormProps) {
  const isNew = !customer;

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: customer?.name ?? '',
      dialCode: customer ? splitPhone(customer.phone).dialCode : DEFAULT_DIAL_CODE,
      localPhone: customer ? splitPhone(customer.phone).local : '',
      notes: customer?.notes ?? '',
      sendWhatsApp: isNew,
    },
  });

  useEffect(() => {
    if (customer) {
      const parts = splitPhone(customer.phone);
      reset({
        name: customer.name,
        dialCode: parts.dialCode,
        localPhone: parts.local,
        notes: customer.notes ?? '',
        sendWhatsApp: false,
      });
    }
  }, [customer, reset]);

  const sendWhatsApp = watch('sendWhatsApp');

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto max-w-xl space-y-5 rounded-2xl border border-line bg-panel p-5 shadow-sm sm:p-6"
    >
      <Input
        label="اسم العميل"
        placeholder="أدخل اسم العميل"
        autoComplete="name"
        error={errors.name?.message}
        {...register('name')}
      />

      <Controller
        name="dialCode"
        control={control}
        render={({ field: dialField }) => (
          <Controller
            name="localPhone"
            control={control}
            render={({ field: localField }) => (
              <PhoneInput
                dialCode={dialField.value}
                localPhone={localField.value}
                error={errors.localPhone?.message}
                disabled={loading}
                onDialCodeChange={dialField.onChange}
                onLocalPhoneChange={localField.onChange}
                onBlur={localField.onBlur}
              />
            )}
          />
        )}
      />

      <Textarea
        label="ملاحظات (اختياري)"
        placeholder="ملاحظات إضافية عن العميل..."
        rows={4}
        error={errors.notes?.message}
        {...register('notes')}
      />

      {isNew && (
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface/40 p-4 transition-colors hover:border-wheat/30">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/15 text-[#25D366]">
            <Icon icon={MessageCircle} size="sm" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold text-ink">
              إرسال ترحيب ورمز QR عبر واتساب
            </span>
            <span className="mt-0.5 block text-xs text-muted">
              بعد الحفظ يُفتح واتساب برسالة ترحيب ثم يمكنك مشاركة رمز QR
            </span>
          </span>
          <input
            type="checkbox"
            className="h-5 w-5 shrink-0 rounded border-line accent-wheat"
            checked={Boolean(sendWhatsApp)}
            onChange={(e) => setValue('sendWhatsApp', e.target.checked)}
          />
        </label>
      )}

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            إلغاء
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'جاري الحفظ...' : customer ? 'حفظ التعديلات' : 'إضافة العميل'}
        </Button>
      </div>
    </form>
  );
}
