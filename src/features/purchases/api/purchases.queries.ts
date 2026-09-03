import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@shared/lib/apiError';
import { customerKeys } from '@/features/customers/api/customers.queries';
import { giftKeys } from '@/features/gifts/api/gifts.queries';
import { reportKeys } from '@/features/reports/api/reports.queries';
import { purchasesApi } from './purchases.api';
import type {
  CreatePurchasePayload,
  ListPurchasesParams,
  UpdatePurchasePayload,
} from '../types/purchase.types';

export const purchaseKeys = {
  all: ['purchases'] as const,
  lists: () => [...purchaseKeys.all, 'list'] as const,
  list: (params: ListPurchasesParams) => [...purchaseKeys.lists(), params] as const,
  details: () => [...purchaseKeys.all, 'detail'] as const,
  detail: (id: string) => [...purchaseKeys.details(), id] as const,
};

const errorMap: Record<string, string> = {
  'Customer not found.': 'العميل غير موجود',
  'Purchase not found.': 'المشترى غير موجود',
  'Insufficient customer points for this update.': 'نقاط العميل غير كافية لهذا التعديل',
  'Invalid purchase amount.': 'مبلغ المشترى غير صالح',
  'Permission denied.': 'ليس لديك صلاحية لهذا الإجراء',
};

function mapError(error: unknown, fallback: string) {
  const message = getApiErrorMessage(error, fallback);
  return errorMap[message] || message;
}

export const usePurchasesQuery = (params: ListPurchasesParams, enabled = true) =>
  useQuery({
    queryKey: purchaseKeys.list(params),
    queryFn: () => purchasesApi.list(params),
    enabled,
  });

export const useTodayPurchasesSummaryQuery = () =>
  useQuery({
    queryKey: [...purchaseKeys.all, 'today-summary'] as const,
    queryFn: () => purchasesApi.list({ skip: 0, limit: 1, period: 'today' }),
    staleTime: 30_000,
    select: (data) => ({
      totalAmount: Number(data.total_amount),
      count: data.total,
    }),
  });

export const usePurchaseQuery = (id: string | undefined) =>
  useQuery({
    queryKey: purchaseKeys.detail(id ?? ''),
    queryFn: () => purchasesApi.getById(id!),
    enabled: Boolean(id),
  });

export const useCreatePurchaseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePurchasePayload) => purchasesApi.create(payload),
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...purchaseKeys.all, 'today-summary'] });
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(payload.customer_id) });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: giftKeys.lists() });
      toast.success('تم تسجيل المشترى بنجاح');
    },
    onError: (error) => toast.error(mapError(error, 'تعذر تسجيل المشترى')),
  });
};

export const useUpdatePurchaseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePurchasePayload }) =>
      purchasesApi.update(id, payload),
    onSuccess: (purchase) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...purchaseKeys.all, 'today-summary'] });
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
      queryClient.invalidateQueries({ queryKey: purchaseKeys.detail(purchase.id) });
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(purchase.customer_id) });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      toast.success('تم تحديث المشترى');
    },
    onError: (error) => toast.error(mapError(error, 'تعذر تحديث المشترى')),
  });
};
