import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@shared/lib/apiError';
import { customerKeys } from '@/features/customers/api/customers.queries';
import { giftTypesApi, giftsApi } from './gifts.api';
import type {
  CreateGiftTypePayload,
  ListGiftsParams,
  RedeemGiftPayload,
  UpdateGiftTypePayload,
} from '../types/gift.types';

export const giftKeys = {
  all: ['gifts'] as const,
  lists: () => [...giftKeys.all, 'list'] as const,
  list: (params: ListGiftsParams) => [...giftKeys.lists(), params] as const,
  detail: (id: string) => [...giftKeys.all, 'detail', id] as const,
};

export const giftTypeKeys = {
  all: ['gift-types'] as const,
  list: (activeOnly?: boolean) => [...giftTypeKeys.all, activeOnly] as const,
};

const errorMap: Record<string, string> = {
  'Customer not found.': 'العميل غير موجود',
  'Gift type not found or inactive.': 'نوع الهدية غير متاح',
  'Customer is not eligible for this gift track.': 'العميل غير مؤهل لهذا المسار',
  'Gift is not pending.': 'الهدية ليست في حالة انتظار',
  'Customer no longer has enough balance to deliver this gift.':
    'رصيد العميل غير كافٍ لتسليم هذه الهدية',
  'Customer already has a pending gift for this track.':
    'يوجد بالفعل هدية معلّقة لنفس المسار',
  'Gift redemption not found.': 'الهدية غير موجودة',
  'Permission denied.': 'ليس لديك صلاحية لهذا الإجراء',
};

function mapError(error: unknown, fallback: string) {
  return errorMap[getApiErrorMessage(error, fallback)] || getApiErrorMessage(error, fallback);
}

export const useGiftsQuery = (params: ListGiftsParams, enabled = true) =>
  useQuery({
    queryKey: giftKeys.list(params),
    queryFn: () => giftsApi.list(params),
    enabled,
  });

export const useSyncPendingGiftsMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => giftsApi.syncPending(),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: giftKeys.lists() });
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
      if (result.gifts_created > 0) {
        toast.success(`تم تسجيل ${result.gifts_created} هدية قيد الانتظار`);
      }
    },
    onError: (e) => toast.error(mapError(e, 'تعذر مزامنة الهدايا')),
  });
};

export const useGiftTypesQuery = (activeOnly?: boolean) =>
  useQuery({
    queryKey: giftTypeKeys.list(activeOnly),
    queryFn: () => giftTypesApi.list(activeOnly),
  });

export const useRedeemGiftMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RedeemGiftPayload) => giftsApi.redeem(payload),
    onSuccess: (_, payload) => {
      qc.invalidateQueries({ queryKey: giftKeys.lists() });
      qc.invalidateQueries({ queryKey: customerKeys.detail(payload.customer_id) });
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
      toast.success('تم استبدال الهدية بنجاح');
    },
    onError: (e) => toast.error(mapError(e, 'تعذر استبدال الهدية')),
  });
};

export const useDeliverGiftMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, gift_type_id }: { id: string; gift_type_id: string }) =>
      giftsApi.deliver(id, { gift_type_id }),
    onSuccess: (gift) => {
      qc.invalidateQueries({ queryKey: giftKeys.lists() });
      qc.invalidateQueries({ queryKey: customerKeys.detail(gift.customer_id) });
      toast.success('تم تأكيد تسليم الهدية');
    },
    onError: (e) => toast.error(mapError(e, 'تعذر تأكيد التسليم')),
  });
};

export const useCancelGiftMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => giftsApi.cancel(id),
    onSuccess: (gift) => {
      qc.invalidateQueries({ queryKey: giftKeys.lists() });
      qc.invalidateQueries({ queryKey: customerKeys.detail(gift.customer_id) });
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
      toast.success('تم إلغاء الهدية واسترداد الرصيد');
    },
    onError: (e) => toast.error(mapError(e, 'تعذر إلغاء الهدية')),
  });
};

export const useCreateGiftTypeMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGiftTypePayload) => giftTypesApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: giftTypeKeys.all });
      toast.success('تم إضافة نوع الهدية');
    },
    onError: (e) => toast.error(mapError(e, 'تعذر إضافة نوع الهدية')),
  });
};

export const useUpdateGiftTypeMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateGiftTypePayload }) =>
      giftTypesApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: giftTypeKeys.all });
      toast.success('تم تحديث نوع الهدية');
    },
    onError: (e) => toast.error(mapError(e, 'تعذر تحديث نوع الهدية')),
  });
};

export const useDeleteGiftTypeMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => giftTypesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: giftTypeKeys.all });
      toast.success('تم حذف نوع الهدية');
    },
    onError: (e) => toast.error(mapError(e, 'تعذر حذف نوع الهدية')),
  });
};

export const useRestoreGiftTypeMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => giftTypesApi.restore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: giftTypeKeys.all });
      toast.success('تم استعادة نوع الهدية');
    },
    onError: (e) => toast.error(mapError(e, 'تعذر استعادة نوع الهدية')),
  });
};
