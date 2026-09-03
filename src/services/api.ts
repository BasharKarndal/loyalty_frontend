import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/config/env';
import { authStorage } from '@/features/auth/lib/authStorage';
import { workspaceStorage } from '@/features/admin/lib/workspaceStorage';
import { getApiErrorCodes } from '@shared/lib/apiError';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authStorage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const workspaceId = workspaceStorage.get();
    if (workspaceId && config.headers) {
      config.headers['X-Workspace-Owner-Id'] = workspaceId;
    }
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const codes = getApiErrorCodes(error);
    const expired =
      error.response?.status === 403 &&
      (codes.includes('SUBSCRIPTION_EXPIRED') || codes.includes('USER_INACTIVE'));

    if (error.response?.status === 401 || expired) {
      authStorage.clearToken();
      const path = window.location.pathname;
      if (path !== '/login') {
        const reason = codes.includes('USER_INACTIVE')
          ? 'inactive'
          : expired
            ? 'expired'
            : '';
        window.location.href = reason ? `/login?reason=${reason}` : '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
