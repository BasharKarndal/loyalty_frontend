import {
  useLoginMutation,
  useCurrentUserQuery,
  useLogoutMutation,
} from '../api/auth.queries';
import { authStorage } from '../lib/authStorage';

export const useAuth = () => {
  const isAuthenticated = authStorage.isAuthenticated();
  const currentUserQuery = useCurrentUserQuery(isAuthenticated);
  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();

  return {
    isAuthenticated,
    user: currentUserQuery.data,
    isLoadingUser: currentUserQuery.isLoading,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
};
