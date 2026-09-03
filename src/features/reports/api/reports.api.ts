import api from '@/services/api';
import type { ApiResponse } from '@/shared/types/api';
import type { ReportRangeFilter, ReportStats } from '../types/report.types';

export interface ReportStatsParams {
  period?: ReportRangeFilter;
  fromDate?: string;
  toDate?: string;
}

export const reportsApi = {
  getStats: async (params: ReportStatsParams): Promise<ReportStats> => {
    const response = await api.get<ApiResponse<ReportStats>>('/reports/stats', {
      params: {
        period: params.period ?? 'month',
        ...(params.period === 'custom' && params.fromDate && params.toDate
          ? { from_date: params.fromDate, to_date: params.toDate }
          : {}),
      },
    });
    if (!response.data.data) {
      throw new Error(response.data.message || 'تعذر جلب التقرير');
    }
    return response.data.data;
  },
};
