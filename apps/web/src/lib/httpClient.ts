import axios from 'axios';
import { tokenStore } from './tokenStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Inject access token from memory
apiClient.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401 & extract global backend error messages
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not attempt to silent-refresh on auth endpoints to prevent masking credentials errors
    const isAuthRequest = originalRequest.url?.includes('/auth/login') ||
                          originalRequest.url?.includes('/auth/refresh') ||
                          originalRequest.url?.includes('/auth/register');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;
      try {
        // Exchange refresh token for a new access token
        const res = await axios.post(
          `${BASE_URL}/v1/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = res.data?.data?.accessToken;
        if (newToken) {
          tokenStore.set(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        tokenStore.clear();
        return Promise.reject(refreshError);
      }
    }

    // Capture the backend's structured error message
    const backendMessage = error.response?.data?.error?.message;
    if (backendMessage) {
      error.message = backendMessage;
    }

    return Promise.reject(error);
  }
);
