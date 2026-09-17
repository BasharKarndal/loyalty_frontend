import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { isAxiosError } from 'axios';
import { useIsRestoring } from '@tanstack/react-query';
import { EmptyState, RouteFallback } from '@shared/components';
import { getApiErrorCodes } from '@shared/lib/apiError';
import { authStorage } from '@features/auth/lib/authStorage';
import { authErrorMessage, useCurrentUserQuery } from '../api/auth.queries';

const RESTORE_GRACE_MS = 3500;
const AUTH_LOADING_CAP_MS = 20000;

function describeMeFailure(error: unknown): string {
  const codes = getApiErrorCodes(error);
  if (codes.includes('SUBSCRIPTION_EXPIRED')) {
    return 'انتهى حجز هذا الحساب. تواصل مع الإدارة لتجديد الاشتراك.';
  }
  if (codes.includes('USER_INACTIVE')) {
    return 'هذا الحساب معطّل ولا يمكن استخدام النظام.';
  }

  if (isAxiosError(error) && !error.response) {
    return 'تعذر الاتصال بالخادم. قد يكون الخادم يبدأ الآن (Railway) — انتظر قليلاً ثم أعد المحاولة.';
  }

  return authErrorMessage(
    error,
    'تعذر تحميل الحساب. تحقق من الاتصال ثم أعد المحاولة.'
  );
}

export const ProtectedRoute = () => {
  const location = useLocation();
  const isAuthenticated = authStorage.isAuthenticated();
  const isRestoring = useIsRestoring();
  const [restoreTimedOut, setRestoreTimedOut] = useState(false);
  const [authTimedOut, setAuthTimedOut] = useState(false);

  const {
    isLoading,
    isError,
    isFetching,
    data: user,
    error,
    refetch,
  } = useCurrentUserQuery(isAuthenticated);

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

  // Soft auto-retry while the server may still be waking up.
  useEffect(() => {
    if (!isAuthenticated || !isError || user) return;
    const timer = window.setTimeout(() => {
      void refetch();
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated, isError, user, refetch]);

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

  if (authTimedOut && !isError) {
    return (
      <EmptyState
        message="التحميل يستغرق وقتاً أطول من المعتاد. أعد المحاولة أو تحقق من الاتصال."
        icon={AlertCircle}
        actionLabel={isFetching ? 'جاري المحاولة...' : 'إعادة المحاولة'}
        onAction={() => {
          setAuthTimedOut(false);
          void refetch();
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
        onAction={() => refetch()}
      />
    );
  }

  return <Navigate to="/login" replace />;
};
