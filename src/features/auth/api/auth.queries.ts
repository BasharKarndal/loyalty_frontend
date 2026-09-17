import { isAxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorCodes, getApiErrorMessage } from '@shared/lib/apiError';
import { indexedDb, QUERY_PERSIST_KEY } from '@shared/lib/indexedDb';
import { wakeBackend } from '@shared/lib/serverWake';
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

/** Network / cold-start failures — worth retrying. Auth failures are not. */
function shouldRetryAuthMe(failureCount: number, error: unknown): boolean {
  // Railway cold starts often need ~30–60s; allow several attempts.
  if (failureCount >= 6) return false;

  if (!isAxiosError(error)) return failureCount < 2;

  const status = error.response?.status;
  if (status === 401 || status === 403 || status === 404) return false;

  // No response = timeout / offline / Railway waking up
  return true;
}

async function clearPersistedQueryCache() {
  try {
    await indexedDb.del(QUERY_PERSIST_KEY);
  } catch {
    // IndexedDB may be unavailable in private mode — ignore
  }
}

export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: async (data) => {
      authStorage.setToken(data.access_token);
      // Drop previous account cache before loading the new session.
      queryClient.clear();
      await clearPersistedQueryCache();
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
    queryFn: async () => {
      // Warm sleeping hosts before the real auth call.
      await wakeBackend(8_000);
      return authApi.me();
    },
    enabled: enabled && authStorage.isAuthenticated(),
    retry: shouldRetryAuthMe,
    retryDelay: (attempt) => Math.min(1500 * 2 ** attempt, 10_000),
    staleTime: 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
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
    onSettled: async () => {
      authStorage.clearToken();
      queryClient.clear();
      await clearPersistedQueryCache();
      toast.success('تم تسجيل الخروج');
    },
  });
};

export { authErrorMessage };
