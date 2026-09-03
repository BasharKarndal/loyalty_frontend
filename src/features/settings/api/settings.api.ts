import api from '@/services/api';
import type { ApiResponse } from '@/shared/types/api';
import type { UpdateUserSettingsPayload, UserSettings } from '../types/settings.types';

export const settingsApi = {
  getMine: async (): Promise<UserSettings> => {
    const response = await api.get<ApiResponse<UserSettings>>('/settings/me');
    if (!response.data.data) {
      throw new Error(response.data.message || 'تعذر جلب الإعدادات');
    }
    return response.data.data;
  },

  updateMine: async (payload: UpdateUserSettingsPayload): Promise<UserSettings> => {
    const response = await api.put<ApiResponse<UserSettings>>('/settings/me', payload);
    if (!response.data.data) {
      throw new Error(response.data.message || 'تعذر حفظ الإعدادات');
    }
    return response.data.data;
  },

  uploadLogo: async (file: File): Promise<UserSettings> => {
    const form = new FormData();
    form.append('file', file);
    const response = await api.post<ApiResponse<UserSettings>>('/settings/me/logo', form);
    if (!response.data.data) {
      throw new Error(response.data.message || 'تعذر رفع الشعار');
    }
    return response.data.data;
  },

  deleteLogo: async (): Promise<UserSettings> => {
    const response = await api.delete<ApiResponse<UserSettings>>('/settings/me/logo');
    if (!response.data.data) {
      throw new Error(response.data.message || 'تعذر حذف الشعار');
    }
    return response.data.data;
  },

  fetchLogoBlob: async (): Promise<Blob> => {
    const response = await api.get<Blob>('/settings/me/logo', { responseType: 'blob' });
    return response.data;
  },
};
