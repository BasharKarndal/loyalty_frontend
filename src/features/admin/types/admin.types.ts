export interface ManagedSubscription {
  id: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  days_remaining: number;
  notes?: string | null;
}

export interface ManagedUser {
  id: string;
  username: string;
  full_name: string;
  email: string;
  phone?: string | null;
  is_active: boolean;
  roles: string[];
  cafe_name?: string | null;
  system_password?: string | null;
  customers_count?: number;
  subscription: ManagedSubscription | null;
}

export interface TenantStats {
  customers_count: number;
  customers_inactive: number;
  purchases_count: number;
  purchases_today: number;
  sales_total: number | string;
  sales_today: number | string;
  gifts_count: number;
  gifts_pending: number;
  gifts_delivered: number;
  gift_types_count: number;
  last_activity_at?: string | null;
}

export interface TenantSettings {
  cafe_name?: string | null;
  currency: string;
  visit_reward_target: number;
  points_reward_target: number;
  currency_per_point: number | string;
}

export interface OverviewCustomer {
  id: string;
  name: string;
  phone: string;
  points: number;
  visit_count: number;
  total_spent: number | string;
  created_at: string;
}

export interface OverviewActivity {
  id: string;
  type: 'purchase' | 'gift' | string;
  title: string;
  subtitle: string;
  occurred_at: string;
  customer_id?: string | null;
  customer_name?: string | null;
}

export interface ManagedUserOverview {
  user: ManagedUser;
  stats: TenantStats;
  settings: TenantSettings;
  top_customers: OverviewCustomer[];
  recent_customers: OverviewCustomer[];
  recent_activity: OverviewActivity[];
}

export interface ManagedUserList {
  items: ManagedUser[];
  total: number;
  active_subscriptions: number;
  expired_subscriptions: number;
  expiring_soon: number;
}

export interface CreateAdminPayload {
  username: string;
  full_name: string;
  email: string;
  password: string;
  phone?: string | null;
  duration_days: number;
  notes?: string | null;
}

export interface UpdateAdminPayload {
  full_name: string;
  email: string;
  phone?: string | null;
  is_active: boolean;
  password?: string | null;
}

export interface BookingItem {
  id: string;
  user_id: string;
  user_name: string;
  username: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  days_remaining: number;
  notes?: string | null;
  created_at: string;
}

export interface BookingList {
  items: BookingItem[];
  total: number;
  active_count: number;
  expired_count: number;
}

export interface CreateBookingPayload {
  user_id: string;
  duration_days?: number;
  notes?: string | null;
}

export const DURATION_PRESETS = [
  { label: 'أسبوع', days: 7 },
  { label: 'شهر', days: 30 },
  { label: '3 أشهر', days: 90 },
  { label: 'سنة', days: 365 },
] as const;

export type BookingStatus = 'active' | 'expiring' | 'expired' | 'inactive';

export function getUserBookingStatus(user: ManagedUser): BookingStatus {
  if (!user.is_active) return 'inactive';
  if (!user.subscription || !user.subscription.is_active) return 'expired';
  if (user.subscription.days_remaining <= 7) return 'expiring';
  return 'active';
}

export function getBookingItemStatus(item: BookingItem): BookingStatus {
  if (item.is_active && item.days_remaining <= 7) return 'expiring';
  if (item.is_active) return 'active';
  return 'expired';
}

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  active: 'نشط',
  expiring: 'ينتهي قريباً',
  expired: 'منتهي',
  inactive: 'معطّل',
};
