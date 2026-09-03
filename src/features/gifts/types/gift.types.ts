export interface GiftType {
  id: string;
  owner_id?: string;
  name: string;
  icon_key: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GiftRedemption {
  id: string;
  customer_id: string;
  gift_type_id: string | null;
  gift_type_name: string;
  gift_type_icon: string;
  points_used: number;
  reward_track: 'visits' | 'amount';
  notes: string | null;
  status: 'pending' | 'delivered' | 'cancelled';
  created_at: string;
  delivered_at: string | null;
  updated_at: string;
  customer_name: string;
  customer_phone: string;
  owner_id?: string | null;
}

export interface GiftListResult {
  items: GiftRedemption[];
  total: number;
  skip: number;
  limit: number;
  pending_count: number;
  delivered_count: number;
}

export interface RedeemGiftPayload {
  customer_id: string;
  gift_type_id: string;
  reward_track: 'visits' | 'amount';
  notes?: string | null;
}

export interface CreateGiftTypePayload {
  name: string;
  icon_key?: string;
  sort_order?: number;
}

export interface UpdateGiftTypePayload {
  name: string;
  icon_key?: string;
  sort_order?: number;
}

export type GiftStatusFilter = 'all' | 'pending' | 'delivered';

export interface ListGiftsParams {
  skip?: number;
  limit?: number;
  customer_id?: string;
  status?: 'pending' | 'delivered' | 'cancelled';
  exclude_cancelled?: boolean;
}

export interface DeliverGiftPayload {
  gift_type_id: string;
}
