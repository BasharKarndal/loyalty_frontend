import api from '@/services/api';
import type { ApiResponse } from '@/shared/types/api';
import type {
  CreatePurchasePayload,
  ListPurchasesParams,
  Purchase,
  PurchaseListResult,
  UpdatePurchasePayload,
} from '../types/purchase.types';

export const purchasesApi = {
  list: async (params: ListPurchasesParams = {}): Promise<PurchaseListResult> => {
    const response = await api.get<ApiResponse<PurchaseListResult>>('/purchases', {
      params,
    });
    if (!response.data.data) {
      throw new Error(response.data.message || 'تعذر جلب المشتريات');
    }
    return response.data.data;
  },

  getById: async (id: string): Promise<Purchase> => {
    const response = await api.get<ApiResponse<Purchase>>(`/purchases/${id}`);
    if (!response.data.data) {
      throw new Error(response.data.message || 'المشترى غير موجود');
    }
    return response.data.data;
  },

  create: async (payload: CreatePurchasePayload): Promise<Purchase> => {
    const response = await api.post<ApiResponse<Purchase>>('/purchases', payload);
    if (!response.data.data) {
      throw new Error(response.data.message || 'تعذر إنشاء المشترى');
    }
    return response.data.data;
  },

  update: async (id: string, payload: UpdatePurchasePayload): Promise<Purchase> => {
    const response = await api.put<ApiResponse<Purchase>>(`/purchases/${id}`, payload);
    if (!response.data.data) {
      throw new Error(response.data.message || 'تعذر تحديث المشترى');
    }
    return response.data.data;
  },
};
