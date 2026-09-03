import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isSuperAdmin } from '../types/auth.types';

export function SuperAdminRoute() {
  const { user } = useAuth();
  if (!isSuperAdmin(user)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

export function CafeRoute() {
  const { user } = useAuth();
  if (isSuperAdmin(user)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
