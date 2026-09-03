import api from '@/services/api';
import type { ApiResponse } from '@/shared/types/api';
import type { AuthUser, LoginRequest, TokenResponse } from '../types/auth.types';

export const authApi = {
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await api.post<ApiResponse<TokenResponse>>('/auth/login', data);
    if (!response.data.data?.access_token) {
      throw new Error(response.data.message || 'فشل تسجيل الدخول');
    }
    return response.data.data;
  },

  me: async (): Promise<AuthUser> => {
    const response = await api.get<ApiResponse<AuthUser>>('/auth/me');
    if (!response.data.data) {
      throw new Error(response.data.message || 'تعذر جلب بيانات المستخدم');
    }
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Backend may not expose logout; clear local session anyway.
    }
  },
};
