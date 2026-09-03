export interface DailySalesPoint {
  day: string;
  total: number | string;
}

export interface TopCustomerSpend {
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  spent: number | string;
}

export interface ReportStats {
  total_sales: number | string;
  purchases_count: number;
  gifts_count: number;
  pending_gifts_count: number;
  delivered_gifts_count: number;
  visit_track_gifts_count: number;
  points_track_gifts_count: number;
  average_purchase: number | string;
  top_customers: TopCustomerSpend[];
  daily_sales: DailySalesPoint[];
  from_date: string;
  to_date: string;
}

export type ReportRangeFilter = 'today' | 'week' | 'month' | 'custom';
