import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { EmptyState, RouteFallback } from '@shared/components';
import { authStorage } from '@features/auth/lib/authStorage';
import { useCurrentUserQuery } from '../api/auth.queries';

export const ProtectedRoute = () => {
  const location = useLocation();
  const isAuthenticated = authStorage.isAuthenticated();
  const { isLoading, isError, data: user, refetch } = useCurrentUserQuery(isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isLoading) {
    return <RouteFallback />;
  }

  if (isError) {
    return (
      <EmptyState
        message="تعذر الاتصال بالخادم. إذا كان الموقع على Railway فقد يكون الخادم نائماً — أعد المحاولة بعد ثوانٍ."
        icon={AlertCircle}
        actionLabel="إعادة المحاولة"
        onAction={() => refetch()}
      />
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};
