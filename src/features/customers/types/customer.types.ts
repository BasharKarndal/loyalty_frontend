export interface Customer {
  id: string;
  owner_id?: string;
  name: string;
  phone: string;
  notes: string | null;
  points: number;
  visit_count: number;
  total_spent: string | number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerListResult {
  items: Customer[];
  total: number;
  skip: number;
  limit: number;
}

export interface CreateCustomerPayload {
  name: string;
  phone: string;
  notes?: string | null;
}

export interface UpdateCustomerPayload {
  name: string;
  phone: string;
  notes?: string | null;
}

export interface ListCustomersParams {
  skip?: number;
  limit?: number;
  search?: string;
  active_only?: boolean;
  inactive_only?: boolean;
}
