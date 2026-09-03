import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorCodes, getApiErrorMessage } from '@shared/lib/apiError';
import { adminApi } from './admin.api';
import type { CreateAdminPayload, CreateBookingPayload, UpdateAdminPayload } from '../types/admin.types';

export const adminKeys = {
  all: ['admin'] as const,
  users: (search = '') => [...adminKeys.all, 'users', search] as const,
  user: (id: string) => [...adminKeys.all, 'user', id] as const,
  bookings: () => [...adminKeys.all, 'bookings'] as const,
};

function adminErrorMessage(error: unknown, fallback: string): string {
  const codes = getApiErrorCodes(error);
  const map: Record<string, string> = {
    USERNAME_EXISTS: 'اسم المستخدم مستخدم مسبقاً',
    EMAIL_EXISTS: 'البريد الإلكتروني مستخدم مسبقاً',
    ADMIN_ROLE_MISSING: 'دور المدير غير مهيأ. شغّل سكربت الإعداد أولاً.',
    SUPER_ADMIN_LOCKED: 'لا يمكن عرض أو تعديل حساب المشرف العام من هنا',
    SUPER_ADMIN_NO_SUBSCRIPTION: 'المشرف العام لا يحتاج حجزاً',
    USER_NOT_FOUND: 'المستخدم غير موجود',
  };
  const matched = codes.find((code) => map[code]);
  if (matched) return map[matched];
  return getApiErrorMessage(error, fallback);
}

export const useManagedUsersQuery = (search = '', enabled = true) =>
  useQuery({
    queryKey: adminKeys.users(search),
    queryFn: () => adminApi.listUsers(search || undefined),
    staleTime: 15_000,
    enabled,
  });

export const useManagedUserOverviewQuery = (id?: string) =>
  useQuery({
    queryKey: adminKeys.user(id ?? ''),
    queryFn: () => adminApi.getUserOverview(id!),
    staleTime: 15_000,
    enabled: Boolean(id),
  });

export const useBookingsQuery = () =>
  useQuery({
    queryKey: adminKeys.bookings(),
    queryFn: () => adminApi.listBookings(),
    staleTime: 15_000,
  });

export const useCreateAdminMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAdminPayload) => adminApi.createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      toast.success('تم إنشاء حساب المدير وحجزه');
    },
    onError: (error) => toast.error(adminErrorMessage(error, 'تعذر إنشاء المستخدم')),
  });
};

export const useUpdateAdminMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAdminPayload }) =>
      adminApi.updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      toast.success('تم حفظ بيانات المستخدم');
    },
    onError: (error) => toast.error(adminErrorMessage(error, 'تعذر حفظ المستخدم')),
  });
};

export const useExtendBookingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => adminApi.createBooking(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      toast.success('تم تمديد الحجز');
    },
    onError: (error) => toast.error(adminErrorMessage(error, 'تعذر تمديد الحجز')),
  });
};
