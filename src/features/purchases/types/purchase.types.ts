export interface Purchase {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  owner_id?: string | null;
  amount: string | number;
  points_earned: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseListResult {
  items: Purchase[];
  total: number;
  total_amount: number | string;
  skip: number;
  limit: number;
}

export interface CreatePurchasePayload {
  customer_id: string;
  amount: number;
  notes?: string | null;
}

export interface UpdatePurchasePayload {
  amount: number;
  notes?: string | null;
}

export type PurchasePeriod = 'all' | 'today' | 'week' | 'month';

export interface ListPurchasesParams {
  skip?: number;
  limit?: number;
  customer_id?: string;
  search?: string;
  period?: PurchasePeriod;
}
