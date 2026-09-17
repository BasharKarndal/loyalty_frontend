import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { isAxiosError } from 'axios';
import { useIsRestoring, useQueryClient } from '@tanstack/react-query';
import { EmptyState, RouteFallback } from '@shared/components';
import { getApiErrorCodes } from '@shared/lib/apiError';
import { indexedDb, QUERY_PERSIST_KEY } from '@shared/lib/indexedDb';
import {
  isNetworkOrColdStartError,
  wakeBackend,
} from '@shared/lib/serverWake';
import { authStorage } from '@features/auth/lib/authStorage';
import { authApi } from '../api/auth.api';
import { authErrorMessage, authKeys, useCurrentUserQuery } from '../api/auth.queries';

const RESTORE_GRACE_MS = 3500;
const AUTH_LOADING_CAP_MS = 20000;
/** Keep auto-waking / retrying before showing a hard error after idle. */
const COLD_START_GRACE_MS = 90_000;
const COLD_START_RETRY_MS = 3_500;
const RESUME_IDLE_MS = 90_000;

function describeMeFailure(error: unknown): string {
  const codes = getApiErrorCodes(error);
  if (codes.includes('SUBSCRIPTION_EXPIRED')) {
    return 'انتهى حجز هذا الحساب. تواصل مع الإدارة لتجديد الاشتراك.';
  }
  if (codes.includes('USER_INACTIVE')) {
    return 'هذا الحساب معطّل ولا يمكن استخدام النظام.';
  }

  if (isNetworkOrColdStartError(error) || (isAxiosError(error) && !error.response)) {
    return 'تعذر الاتصال بالخادم. قد يكون الخادم يبدأ الآن بعد فترة خمول — انتظر قليلاً ثم أعد المحاولة.';
  }

  return authErrorMessage(
    error,
    'تعذر تحميل الحساب. تحقق من الاتصال ثم أعد المحاولة.'
  );
}

export const ProtectedRoute = () => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const isAuthenticated = authStorage.isAuthenticated();
  const isRestoring = useIsRestoring();
  const [restoreTimedOut, setRestoreTimedOut] = useState(false);
  const [authTimedOut, setAuthTimedOut] = useState(false);
  const [coldStartExhausted, setColdStartExhausted] = useState(false);
  const wakingRef = useRef(false);
  const lastOkAtRef = useRef(Date.now());
  const networkErrorRef = useRef(false);

  const {
    isLoading,
    isError,
    isFetching,
    data: user,
    error,
  } = useCurrentUserQuery(isAuthenticated);

  const networkError = Boolean(isError && isNetworkOrColdStartError(error));
  networkErrorRef.current = networkError;

  const wakeAndRefetch = useCallback(
    async (opts?: { purgePersist?: boolean }) => {
      if (wakingRef.current) return;
      wakingRef.current = true;
      try {
        if (opts?.purgePersist) {
          // Soft recovery: drop stuck React Query disk cache, keep the login token.
          try {
            await indexedDb.del(QUERY_PERSIST_KEY);
          } catch {
            // ignore
          }
          queryClient.removeQueries({ queryKey: authKeys.me(), exact: true });
        }

        await wakeBackend(20_000);
        await queryClient.fetchQuery({
          queryKey: authKeys.me(),
          queryFn: () => authApi.me(),
        });
      } catch {
        // fetchQuery throws on failure — useQuery will surface the error.
      } finally {
        wakingRef.current = false;
      }
    },
    [queryClient]
  );

  useEffect(() => {
    if (user) lastOkAtRef.current = Date.now();
  }, [user]);

  useEffect(() => {
    if (!isRestoring) {
      setRestoreTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setRestoreTimedOut(true), RESTORE_GRACE_MS);
    return () => window.clearTimeout(timer);
  }, [isRestoring]);

  useEffect(() => {
    if (!isAuthenticated || user || isError) {
      setAuthTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setAuthTimedOut(true), AUTH_LOADING_CAP_MS);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated, user, isError, isLoading, isFetching]);

  // Soft grace window for Railway cold starts before showing a hard error.
  useEffect(() => {
    if (!networkError) {
      setColdStartExhausted(false);
      return;
    }
    setColdStartExhausted(false);
    const timer = window.setTimeout(() => setColdStartExhausted(true), COLD_START_GRACE_MS);
    return () => window.clearTimeout(timer);
  }, [networkError]);

  // While Railway may be waking, retry automatically.
  useEffect(() => {
    if (!isAuthenticated || !networkError || user) return;

    void wakeAndRefetch();
    const timer = window.setInterval(() => {
      void wakeAndRefetch();
    }, COLD_START_RETRY_MS);

    return () => window.clearInterval(timer);
  }, [isAuthenticated, networkError, user, wakeAndRefetch]);

  // When the user returns after a long idle, wake the server immediately.
  useEffect(() => {
    if (!isAuthenticated) return;

    const resume = () => {
      if (document.visibilityState === 'hidden') return;
      const idleFor = Date.now() - lastOkAtRef.current;
      if (!networkErrorRef.current && idleFor < RESUME_IDLE_MS) return;
      void wakeAndRefetch();
    };

    document.addEventListener('visibilitychange', resume);
    window.addEventListener('online', resume);
    window.addEventListener('focus', resume);

    return () => {
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('online', resume);
      window.removeEventListener('focus', resume);
    };
  }, [isAuthenticated, wakeAndRefetch]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Keep the app usable if we already have a cached user while a refetch fails.
  if (user) {
    return <Outlet />;
  }

  if (isRestoring && !restoreTimedOut) {
    return <RouteFallback />;
  }

  // Soft wake UI instead of a hard error while the server cold-starts.
  if (networkError && !coldStartExhausted) {
    return (
      <RouteFallback message="الخادم يستيقظ بعد فترة الخمول... جاري إعادة الاتصال تلقائياً" />
    );
  }

  if (authTimedOut && !isError) {
    return (
      <EmptyState
        message="التحميل يستغرق وقتاً أطول من المعتاد. أعد المحاولة أو تحقق من الاتصال."
        icon={AlertCircle}
        actionLabel={isFetching ? 'جاري المحاولة...' : 'إعادة المحاولة'}
        onAction={() => {
          setAuthTimedOut(false);
          void wakeAndRefetch({ purgePersist: true });
        }}
      />
    );
  }

  if (isLoading || (isFetching && !isError)) {
    return <RouteFallback />;
  }

  if (isError) {
    return (
      <EmptyState
        message={describeMeFailure(error)}
        icon={AlertCircle}
        actionLabel={isFetching ? 'جاري إعادة المحاولة...' : 'إعادة المحاولة'}
        onAction={() => {
          setColdStartExhausted(false);
          void wakeAndRefetch({ purgePersist: true });
        }}
      />
    );
  }

  return <Navigate to="/login" replace />;
};
