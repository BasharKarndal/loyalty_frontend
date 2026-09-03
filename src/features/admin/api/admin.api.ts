import api from '@/services/api';
import type { ApiResponse } from '@/shared/types/api';
import type {
  BookingItem,
  BookingList,
  CreateAdminPayload,
  CreateBookingPayload,
  ManagedUser,
  ManagedUserList,
  ManagedUserOverview,
  UpdateAdminPayload,
} from '../types/admin.types';

export const adminApi = {
  listUsers: async (search?: string): Promise<ManagedUserList> => {
    const response = await api.get<ApiResponse<ManagedUserList>>('/users', {
      params: search ? { search } : undefined,
    });
    if (!response.data.data) {
      throw new Error(response.data.message || 'تعذر جلب المستخدمين');
    }
    return response.data.data;
  },

  createUser: async (payload: CreateAdminPayload): Promise<ManagedUser> => {
    const response = await api.post<ApiResponse<ManagedUser>>('/users', payload);
    if (!response.data.data) {
      throw new Error(response.data.message || 'تعذر إنشاء المستخدم');
    }
    return response.data.data;
  },

  getUserOverview: async (id: string): Promise<ManagedUserOverview> => {
    const response = await api.get<ApiResponse<ManagedUserOverview>>(`/users/${id}`);
    if (!response.data.data) {
      throw new Error(response.data.message || 'تعذر جلب تفاصيل المستخدم');
    }
    return response.data.data;
  },

  updateUser: async (id: string, payload: UpdateAdminPayload): Promise<ManagedUser> => {
    const response = await api.put<ApiResponse<ManagedUser>>(`/users/${id}`, payload);
    if (!response.data.data) {
      throw new Error(response.data.message || 'تعذر تحديث المستخدم');
    }
    return response.data.data;
  },

  listBookings: async (): Promise<BookingList> => {
    const response = await api.get<ApiResponse<BookingList>>('/subscriptions');
    if (!response.data.data) {
      throw new Error(response.data.message || 'تعذر جلب الحجوزات');
    }
    return response.data.data;
  },

  createBooking: async (payload: CreateBookingPayload): Promise<BookingItem> => {
    const response = await api.post<ApiResponse<BookingItem>>('/subscriptions', payload);
    if (!response.data.data) {
      throw new Error(response.data.message || 'تعذر تمديد الحجز');
    }
    return response.data.data;
  },
};
