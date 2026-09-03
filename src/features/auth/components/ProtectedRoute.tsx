import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { RouteFallback } from '@shared/components/RouteFallback';
import { authStorage } from '@features/auth/lib/authStorage';
import { useCurrentUserQuery } from '../api/auth.queries';

export const ProtectedRoute = () => {
  const location = useLocation();
  const isAuthenticated = authStorage.isAuthenticated();
  const { isLoading, data: user } = useCurrentUserQuery(isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isLoading) {
    return <RouteFallback />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};
