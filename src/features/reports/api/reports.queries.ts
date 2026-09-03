import { useQuery } from '@tanstack/react-query';
import { resolveReportRange, toApiDateTime, type ReportRange } from '@shared/lib/reportRange';
import { reportsApi } from './reports.api';

export const reportKeys = {
  all: ['reports'] as const,
  stats: (period: ReportRange, from?: string, to?: string) =>
    [...reportKeys.all, 'stats', period, from, to] as const,
};

export const useReportStatsQuery = (
  range: ReportRange,
  custom?: { from: string; to: string } | null,
  enabled = true
) => {
  const bounds = resolveReportRange(range, custom);
  const from = toApiDateTime(bounds.from);
  const to = toApiDateTime(bounds.to);

  return useQuery({
    queryKey: reportKeys.stats(range, from, to),
    queryFn: () =>
      reportsApi.getStats(
        range === 'custom'
          ? { period: 'custom', fromDate: from, toDate: to }
          : { period: range }
      ),
    enabled: enabled && (range !== 'custom' || Boolean(custom?.from && custom?.to)),
    staleTime: 30_000,
  });
};

export const useTodaySalesQuery = () =>
  useQuery({
    queryKey: [...reportKeys.all, 'today-sales'] as const,
    queryFn: () => reportsApi.getStats({ period: 'today' }),
    staleTime: 30_000,
    select: (data) => ({
      todaySales: Number(data.total_sales),
      todayPurchasesCount: data.purchases_count,
    }),
  });
