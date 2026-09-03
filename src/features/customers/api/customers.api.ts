import api from '@/services/api';
import type { ApiResponse } from '@/shared/types/api';
import type {
  CreateCustomerPayload,
  Customer,
  CustomerListResult,
  ListCustomersParams,
  UpdateCustomerPayload,
} from '../types/customer.types';

export const customersApi = {
  list: async (params: ListCustomersParams = {}): Promise<CustomerListResult> => {
    const response = await api.get<ApiResponse<CustomerListResult>>('/customers', {
      params,
    });
    if (!response.data.data) {
      throw new Error(response.data.message || 'تعذر جلب العملاء');
    }
    return response.data.data;
  },

  getById: async (id: string): Promise<Customer> => {
    const response = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    if (!response.data.data) {
      throw new Error(response.data.message || 'العميل غير موجود');
    }
    return response.data.data;
  },

  create: async (payload: CreateCustomerPayload): Promise<Customer> => {
    const response = await api.post<ApiResponse<Customer>>('/customers', payload);
    if (!response.data.data) {
      throw new Error(response.data.message || 'تعذر إنشاء العميل');
    }
    return response.data.data;
  },

  update: async (id: string, payload: UpdateCustomerPayload): Promise<Customer> => {
    const response = await api.put<ApiResponse<Customer>>(`/customers/${id}`, payload);
    if (!response.data.data) {
      throw new Error(response.data.message || 'تعذر تحديث العميل');
    }
    return response.data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },

  restore: async (id: string): Promise<Customer> => {
    const response = await api.patch<ApiResponse<Customer>>(`/customers/${id}/restore`);
    if (!response.data.data) {
      throw new Error(response.data.message || 'تعذر استعادة العميل');
    }
    return response.data.data;
  },
};
