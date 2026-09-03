import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorCodes, getApiErrorMessage } from '@shared/lib/apiError';
import { authApi } from './auth.api';
import { authStorage } from '../lib/authStorage';
import type { LoginRequest } from '../types/auth.types';

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

function authErrorMessage(error: unknown, fallback: string): string {
  const codes = getApiErrorCodes(error);
  if (codes.includes('SUBSCRIPTION_EXPIRED')) {
    return 'انتهى حجز النظام. تواصل مع الإدارة لتجديد المدة.';
  }
  if (codes.includes('USER_INACTIVE')) {
    return 'هذا الحساب معطّل ولا يمكن استخدام النظام.';
  }
  const message = getApiErrorMessage(error, fallback);
  const map: Record<string, string> = {
    'Invalid username or password.': 'اسم المستخدم أو كلمة المرور غير صحيحة',
    'Subscription expired.': 'انتهى حجز النظام. تواصل مع الإدارة لتجديد المدة.',
    'User account is inactive.': 'هذا الحساب معطّل ولا يمكن استخدام النظام.',
  };
  return map[message] || message;
}

export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (data) => {
      authStorage.setToken(data.access_token);
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
      toast.success('تم تسجيل الدخول بنجاح');
    },
    onError: (error: unknown) => {
      toast.error(authErrorMessage(error, 'بيانات الدخول غير صحيحة'));
    },
  });
};

export const useCurrentUserQuery = (enabled = true) => {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: authApi.me,
    enabled: enabled && authStorage.isAuthenticated(),
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout();
      } catch {
        // ignore network errors on logout
      }
    },
    onSettled: () => {
      authStorage.clearToken();
      queryClient.clear();
      toast.success('تم تسجيل الخروج');
    },
  });
};
