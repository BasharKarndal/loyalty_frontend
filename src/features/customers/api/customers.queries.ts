import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@shared/lib/apiError';
import { customersApi } from './customers.api';
import type {
  CreateCustomerPayload,
  ListCustomersParams,
  UpdateCustomerPayload,
} from '../types/customer.types';

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (params: ListCustomersParams) => [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
};

const errorMap: Record<string, string> = {
  'Phone number already exists for an active customer.': 'رقم الهاتف مستخدم لعميل نشط',
  'Customer not found.': 'العميل غير موجود',
  'Customer is already active.': 'العميل نشط بالفعل',
  'Permission denied.': 'ليس لديك صلاحية لهذا الإجراء',
};

function mapError(error: unknown, fallback: string) {
  const message = getApiErrorMessage(error, fallback);
  return errorMap[message] || message;
}

export const useCustomersQuery = (params: ListCustomersParams) =>
  useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => customersApi.list(params),
  });

export const useCustomerQuery = (id: string | undefined) =>
  useQuery({
    queryKey: customerKeys.detail(id ?? ''),
    queryFn: () => customersApi.getById(id!),
    enabled: Boolean(id),
  });

export const useCreateCustomerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCustomerPayload) => customersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      toast.success('تم إضافة العميل بنجاح');
    },
    onError: (error) => toast.error(mapError(error, 'تعذر إضافة العميل')),
  });
};

export const useUpdateCustomerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCustomerPayload }) =>
      customersApi.update(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) });
      toast.success('تم تحديث بيانات العميل');
    },
    onError: (error) => toast.error(mapError(error, 'تعذر تحديث العميل')),
  });
};

export const useDeleteCustomerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      toast.success('تم حذف العميل');
    },
    onError: (error) => toast.error(mapError(error, 'تعذر حذف العميل')),
  });
};

export const useRestoreCustomerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customersApi.restore(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) });
      toast.success('تم استعادة العميل');
    },
    onError: (error) => toast.error(mapError(error, 'تعذر استعادة العميل')),
  });
};
