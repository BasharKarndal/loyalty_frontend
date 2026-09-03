import { useAuth } from '@/features/auth';

export function usePermissions() {
  const { user } = useAuth();
  const permissions = new Set(user?.permissions ?? []);

  return {
    permissions,
    can: (permission: string) => permissions.has(permission),
    canAny: (...items: string[]) => items.some((p) => permissions.has(p)),
    canAll: (...items: string[]) => items.every((p) => permissions.has(p)),
  };
}

export const CustomerPermissions = {
  CREATE: 'customers.create',
  READ: 'customers.read',
  UPDATE: 'customers.update',
  DELETE: 'customers.delete',
  RESTORE: 'customers.restore',
} as const;

export const PurchasePermissions = {
  CREATE: 'purchases.create',
  READ: 'purchases.read',
  UPDATE: 'purchases.update',
} as const;

export const GiftTypePermissions = {
  CREATE: 'gift_types.create',
  READ: 'gift_types.read',
  UPDATE: 'gift_types.update',
  DELETE: 'gift_types.delete',
  RESTORE: 'gift_types.restore',
} as const;

export const GiftPermissions = {
  READ: 'gifts.read',
  REDEEM: 'gifts.redeem',
  DELIVER: 'gifts.deliver',
  CANCEL: 'gifts.cancel',
} as const;
