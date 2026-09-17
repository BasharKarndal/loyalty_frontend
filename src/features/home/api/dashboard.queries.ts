import { useQuery } from '@tanstack/react-query';
import { customersApi } from '@/features/customers/api/customers.api';
import { giftsApi } from '@/features/gifts/api/gifts.api';
import { purchasesApi } from '@/features/purchases/api/purchases.api';
import { isEligibleForAny } from '@shared/lib/loyalty';
import type { Customer } from '@/features/customers/types/customer.types';
import type { GiftRedemption } from '@/features/gifts/types/gift.types';
import type { Purchase } from '@/features/purchases/types/purchase.types';
import type { LoyaltyConfig } from '@/features/settings/types/settings.types';

const RECENT_CUSTOMERS_LIMIT = 5;
const RECENT_OPERATIONS_LIMIT = 5;
const ELIGIBLE_SAMPLE_LIMIT = 100;

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: (config: Pick<LoyaltyConfig, 'visitRewardTarget' | 'pointsRewardTarget'>) =>
    [...dashboardKeys.all, 'stats', config] as const,
};

export interface DashboardStats {
  totalSales: number;
  customersCount: number;
  purchasesCount: number;
  giftsCount: number;
  pendingGiftsCount: number;
  eligibleCustomersCount: number;
  recentCustomers: Customer[];
  recentPurchases: Purchase[];
  recentGifts: GiftRedemption[];
}

async function settled<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

async function fetchDashboardStats(
  config: Pick<LoyaltyConfig, 'visitRewardTarget' | 'pointsRewardTarget'>
): Promise<DashboardStats> {
  const [
    customersCountRes,
    eligibleSampleRes,
    recentCustomersRes,
    purchasesTotalRes,
    recentPurchasesRes,
    giftsTotalRes,
    pendingGiftsRes,
    recentGiftsRes,
  ] = await Promise.all([
    settled(customersApi.list({ skip: 0, limit: 1, active_only: true })),
    settled(customersApi.list({ skip: 0, limit: ELIGIBLE_SAMPLE_LIMIT, active_only: true })),
    settled(customersApi.list({ skip: 0, limit: RECENT_CUSTOMERS_LIMIT, active_only: true })),
    settled(purchasesApi.list({ skip: 0, limit: 1 })),
    settled(purchasesApi.list({ skip: 0, limit: RECENT_OPERATIONS_LIMIT })),
    settled(giftsApi.list({ skip: 0, limit: 1, exclude_cancelled: true })),
    settled(giftsApi.list({ skip: 0, limit: 1, status: 'pending' })),
    settled(giftsApi.list({ skip: 0, limit: RECENT_OPERATIONS_LIMIT, exclude_cancelled: true })),
  ]);

  // Need at least the core customer/purchase endpoints; otherwise surface a real error.
  if (!customersCountRes && !purchasesTotalRes && !giftsTotalRes) {
    throw new Error('تعذر الاتصال بواجهة البيانات — تحقق من الخادم ثم أعد المحاولة');
  }

  const eligibleCustomersCount = (eligibleSampleRes?.items ?? []).filter((c) =>
    isEligibleForAny(c.visit_count, c.points, config)
  ).length;

  return {
    totalSales: Number(purchasesTotalRes?.total_amount || 0),
    customersCount: customersCountRes?.total ?? 0,
    purchasesCount: purchasesTotalRes?.total ?? 0,
    giftsCount: giftsTotalRes?.total ?? 0,
    pendingGiftsCount: pendingGiftsRes?.pending_count ?? 0,
    eligibleCustomersCount,
    recentCustomers: recentCustomersRes?.items ?? [],
    recentPurchases: recentPurchasesRes?.items ?? [],
    recentGifts: recentGiftsRes?.items ?? [],
  };
}

export const useDashboardStatsQuery = (
  config: Pick<LoyaltyConfig, 'visitRewardTarget' | 'pointsRewardTarget'>
) =>
  useQuery({
    queryKey: dashboardKeys.stats(config),
    queryFn: () => fetchDashboardStats(config),
    staleTime: 30_000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });
