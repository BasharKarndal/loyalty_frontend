import { useMemo } from 'react';
import { isSuperAdmin, useAuth } from '@/features/auth';
import { useManagedUsersQuery } from '../api/admin.queries';

export function useCafeDirectory() {
  const { user } = useAuth();
  const enabled = isSuperAdmin(user);
  const { data } = useManagedUsersQuery('', enabled);

  const names = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of data?.items ?? []) {
      map.set(item.id, item.cafe_name?.trim() || item.full_name);
    }
    return map;
  }, [data?.items]);

  return {
    enabled,
    cafes: data?.items ?? [],
    nameOf: (ownerId?: string | null) => (ownerId ? names.get(ownerId) : undefined),
  };
}
