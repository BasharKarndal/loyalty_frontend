import api from '@/services/api';
import type { ApiResponse } from '@/shared/types/api';
import type {
  CreateGiftTypePayload,
  GiftListResult,
  GiftRedemption,
  GiftType,
  ListGiftsParams,
  DeliverGiftPayload,
  RedeemGiftPayload,
  UpdateGiftTypePayload,
} from '../types/gift.types';

export const giftsApi = {
  list: async (params: ListGiftsParams = {}): Promise<GiftListResult> => {
    const response = await api.get<ApiResponse<GiftListResult>>('/gifts', { params });
    if (!response.data.data) throw new Error(response.data.message || 'تعذر جلب الهدايا');
    return response.data.data;
  },

  getById: async (id: string): Promise<GiftRedemption> => {
    const response = await api.get<ApiResponse<GiftRedemption>>(`/gifts/${id}`);
    if (!response.data.data) throw new Error(response.data.message || 'الهدية غير موجودة');
    return response.data.data;
  },

  redeem: async (payload: RedeemGiftPayload): Promise<GiftRedemption> => {
    const response = await api.post<ApiResponse<GiftRedemption>>('/gifts/redeem', payload);
    if (!response.data.data) throw new Error(response.data.message || 'تعذر استبدال الهدية');
    return response.data.data;
  },

  deliver: async (id: string, payload: DeliverGiftPayload): Promise<GiftRedemption> => {
    const response = await api.patch<ApiResponse<GiftRedemption>>(`/gifts/${id}/deliver`, payload);
    if (!response.data.data) throw new Error(response.data.message || 'تعذر تأكيد التسليم');
    return response.data.data;
  },

  cancel: async (id: string): Promise<GiftRedemption> => {
    const response = await api.patch<ApiResponse<GiftRedemption>>(`/gifts/${id}/cancel`);
    if (!response.data.data) throw new Error(response.data.message || 'تعذر إلغاء الهدية');
    return response.data.data;
  },

  syncPending: async (): Promise<{ gifts_created: number; customers_updated: number }> => {
    const response = await api.post<
      ApiResponse<{ gifts_created: number; customers_updated: number }>
    >('/gifts/sync-pending');
    if (!response.data.data) {
      throw new Error(response.data.message || 'تعذر مزامنة الهدايا');
    }
    return response.data.data;
  },
};

export const giftTypesApi = {
  list: async (activeOnly?: boolean): Promise<GiftType[]> => {
    const response = await api.get<ApiResponse<GiftType[]>>('/gift-types', {
      params: activeOnly === undefined ? {} : { active_only: activeOnly },
    });
    if (!response.data.data) throw new Error(response.data.message || 'تعذر جلب أنواع الهدايا');
    return response.data.data;
  },

  create: async (payload: CreateGiftTypePayload): Promise<GiftType> => {
    const response = await api.post<ApiResponse<GiftType>>('/gift-types', payload);
    if (!response.data.data) throw new Error(response.data.message || 'تعذر إنشاء نوع الهدية');
    return response.data.data;
  },

  update: async (id: string, payload: UpdateGiftTypePayload): Promise<GiftType> => {
    const response = await api.put<ApiResponse<GiftType>>(`/gift-types/${id}`, payload);
    if (!response.data.data) throw new Error(response.data.message || 'تعذر تحديث نوع الهدية');
    return response.data.data;
  },

  remove: async (id: string): Promise<GiftType> => {
    const response = await api.delete<ApiResponse<GiftType>>(`/gift-types/${id}`);
    if (!response.data.data) throw new Error(response.data.message || 'تعذر حذف نوع الهدية');
    return response.data.data;
  },

  restore: async (id: string): Promise<GiftType> => {
    const response = await api.patch<ApiResponse<GiftType>>(`/gift-types/${id}/restore`);
    if (!response.data.data) throw new Error(response.data.message || 'تعذر استعادة نوع الهدية');
    return response.data.data;
  },
};
