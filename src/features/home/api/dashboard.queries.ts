import { useQuery } from '@tanstack/react-query';
import { customersApi } from '@/features/customers/api/customers.api';
import { giftsApi } from '@/features/gifts/api/gifts.api';
import { purchasesApi } from '@/features/purchases/api/purchases.api';
import { isEligibleForAny } from '@shared/lib/loyalty';
import type { Customer } from '@/features/customers/types/customer.types';
import type { GiftRedemption } from '@/features/gifts/types/gift.types';
import type { Purchase } from '@/features/purchases/types/purchase.types';
import type { LoyaltyConfig } from '@/features/settings/types/settings.types';

/** Backend PaginationParams max limit */
const PAGE_SIZE = 100;
const RECENT_CUSTOMERS_LIMIT = 5;
const RECENT_OPERATIONS_LIMIT = 5;

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

async function fetchAllActiveCustomers(): Promise<Customer[]> {
  const items: Customer[] = [];
  let skip = 0;
  let total = 0;

  do {
    const page = await customersApi.list({ skip, limit: PAGE_SIZE, active_only: true });
    items.push(...page.items);
    total = page.total;
    skip += PAGE_SIZE;
  } while (items.length < total);

  return items;
}

async function fetchDashboardStats(
  config: Pick<LoyaltyConfig, 'visitRewardTarget' | 'pointsRewardTarget'>
): Promise<DashboardStats> {
  const [
    recentCustomersRes,
    allCustomers,
    purchasesTotalRes,
    recentPurchasesRes,
    giftsTotalRes,
    pendingGiftsRes,
    recentGiftsRes,
  ] = await Promise.all([
    customersApi.list({ skip: 0, limit: RECENT_CUSTOMERS_LIMIT, active_only: true }),
    fetchAllActiveCustomers(),
    purchasesApi.list({ skip: 0, limit: 1 }),
    purchasesApi.list({ skip: 0, limit: RECENT_OPERATIONS_LIMIT }),
    giftsApi.list({ skip: 0, limit: 1, exclude_cancelled: true }),
    giftsApi.list({ skip: 0, limit: 1, status: 'pending' }),
    giftsApi.list({ skip: 0, limit: RECENT_OPERATIONS_LIMIT, exclude_cancelled: true }),
  ]);

  const totalSales = allCustomers.reduce((sum, c) => sum + Number(c.total_spent || 0), 0);

  const eligibleCustomersCount = allCustomers.filter((c) =>
    isEligibleForAny(c.visit_count, c.points, config)
  ).length;

  return {
    totalSales,
    customersCount: allCustomers.length,
    purchasesCount: purchasesTotalRes.total,
    giftsCount: giftsTotalRes.total,
    pendingGiftsCount: pendingGiftsRes.pending_count,
    eligibleCustomersCount,
    recentCustomers: recentCustomersRes.items,
    recentPurchases: recentPurchasesRes.items,
    recentGifts: recentGiftsRes.items,
  };
}

export const useDashboardStatsQuery = (
  config: Pick<LoyaltyConfig, 'visitRewardTarget' | 'pointsRewardTarget'>
) =>
  useQuery({
    queryKey: dashboardKeys.stats(config),
    queryFn: () => fetchDashboardStats(config),
    staleTime: 30_000,
  });
