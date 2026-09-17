import { useCallback, useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { isAxiosError } from 'axios';
import { useIsRestoring, useQueryClient } from '@tanstack/react-query';
import { EmptyState, RouteFallback } from '@shared/components';
import { getApiErrorCodes } from '@shared/lib/apiError';
import { indexedDb, QUERY_PERSIST_KEY } from '@shared/lib/indexedDb';
import { isNetworkOrColdStartError, wakeBackend } from '@shared/lib/serverWake';
import { authStorage } from '@features/auth/lib/authStorage';
import {
  clearIdleSessionLocally,
  isSessionIdle,
} from '@features/auth/lib/sessionIdle';
import { authApi } from '../api/auth.api';
import { authErrorMessage, authKeys, useCurrentUserQuery } from '../api/auth.queries';

const RESTORE_GRACE_MS = 3500;
/** Never stay on the spinner longer than this. */
const AUTH_LOADING_CAP_MS = 15_000;

function describeMeFailure(error: unknown): string {
  const codes = getApiErrorCodes(error);
  if (codes.includes('SUBSCRIPTION_EXPIRED')) {
    return 'انتهى حجز هذا الحساب. تواصل مع الإدارة لتجديد الاشتراك.';
  }
  if (codes.includes('USER_INACTIVE')) {
    return 'هذا الحساب معطّل ولا يمكن استخدام النظام.';
  }

  if (isNetworkOrColdStartError(error) || (isAxiosError(error) && !error.response)) {
    return 'تعذر الاتصال بالخادم بعد فترة خمول. أعد المحاولة أو سجّل الدخول من جديد.';
  }

  return authErrorMessage(
    error,
    'تعذر تحميل الحساب. تحقق من الاتصال ثم أعد المحاولة.'
  );
}

export const ProtectedRoute = () => {
  const location = useLocation();
  const queryClient = useQueryClient();

  // Expire overnight sessions before /auth/me (prevents infinite loading).
  const [idleExpired] = useState(() => {
    if (!isSessionIdle()) return false;
    clearIdleSessionLocally();
    return true;
  });

  useEffect(() => {
    if (idleExpired) queryClient.clear();
  }, [idleExpired, queryClient]);

  const isAuthenticated = !idleExpired && authStorage.isAuthenticated();
  const isRestoring = useIsRestoring();
  const [restoreTimedOut, setRestoreTimedOut] = useState(false);
  const [authTimedOut, setAuthTimedOut] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  const {
    isLoading,
    isError,
    isFetching,
    data: user,
    error,
  } = useCurrentUserQuery(isAuthenticated);

  const retryAuth = useCallback(
    async (purgePersist = false) => {
      setAuthTimedOut(false);
      setReconnecting(true);
      try {
        if (purgePersist) {
          try {
            await indexedDb.del(QUERY_PERSIST_KEY);
          } catch {
            // ignore
          }
          queryClient.removeQueries({ queryKey: authKeys.me(), exact: true });
        }
        await wakeBackend(12_000);
        await queryClient.fetchQuery({
          queryKey: authKeys.me(),
          queryFn: () => authApi.me(),
        });
      } catch {
        // surfaced via useQuery error state
      } finally {
        setReconnecting(false);
      }
    },
    [queryClient]
  );

  const logoutToLogin = useCallback(() => {
    clearIdleSessionLocally();
    queryClient.clear();
    window.location.replace('/login?reason=idle');
  }, [queryClient]);

  useEffect(() => {
    if (!isRestoring) {
      setRestoreTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setRestoreTimedOut(true), RESTORE_GRACE_MS);
    return () => window.clearTimeout(timer);
  }, [isRestoring]);

  // Hard cap: do not reset when isFetching flickers during retries.
  useEffect(() => {
    if (!isAuthenticated || user || isError) {
      setAuthTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setAuthTimedOut(true), AUTH_LOADING_CAP_MS);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated, user, isError]);

  if (idleExpired || !isAuthenticated) {
    return (
      <Navigate
        to={idleExpired ? '/login?reason=idle' : '/login'}
        replace
        state={{ from: location }}
      />
    );
  }

  if (user) {
    return <Outlet />;
  }

  if (isRestoring && !restoreTimedOut) {
    return <RouteFallback />;
  }

  if (authTimedOut) {
    return (
      <EmptyState
        message="انتهت مهلة التحميل. يمكنك إعادة المحاولة أو تسجيل الدخول من جديد."
        icon={AlertCircle}
        actionLabel={reconnecting || isFetching ? 'جاري المحاولة...' : 'إعادة المحاولة'}
        onAction={() => void retryAuth(true)}
        secondaryActionLabel="تسجيل الدخول"
        onSecondaryAction={logoutToLogin}
      />
    );
  }

  if (isLoading || isFetching || reconnecting) {
    return <RouteFallback message="جاري التحقق من الجلسة..." />;
  }

  if (isError) {
    return (
      <EmptyState
        message={describeMeFailure(error)}
        icon={AlertCircle}
        actionLabel={reconnecting || isFetching ? 'جاري إعادة المحاولة...' : 'إعادة المحاولة'}
        onAction={() => void retryAuth(true)}
        secondaryActionLabel="تسجيل الدخول"
        onSecondaryAction={logoutToLogin}
      />
    );
  }

  return <Navigate to="/login" replace />;
};
