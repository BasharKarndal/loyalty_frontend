import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { isAxiosError } from 'axios';
import { EmptyState, RouteFallback } from '@shared/components';
import { getApiErrorCodes } from '@shared/lib/apiError';
import { authStorage } from '@features/auth/lib/authStorage';
import { authErrorMessage, useCurrentUserQuery } from '../api/auth.queries';

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
  const {
    isLoading,
    isError,
    isFetching,
    data: user,
    error,
    refetch,
  } = useCurrentUserQuery(isAuthenticated);

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
