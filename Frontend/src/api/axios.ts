import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, STORAGE_KEYS } from '../constants';

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 45000, // 45s timeout to accommodate network OCR & image uploads
  headers: {
    Accept: 'application/json',
  },
});

// Request interceptor to automatically attach JWT token & handle FormData boundary
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Check if data is FormData in React Native
      const isFormData =
        config.data instanceof FormData ||
        (config.data &&
          typeof config.data === 'object' &&
          (Array.isArray(config.data._parts) || typeof config.data.append === 'function'));

      if (isFormData && config.headers) {
        // Delete Content-Type header so React Native / Axios generates multipart/form-data boundary
        if (typeof (config.headers as any).delete === 'function') {
          (config.headers as any).delete('Content-Type');
          (config.headers as any).delete('content-type');
        }
        delete (config.headers as any)['Content-Type'];
        delete (config.headers as any)['content-type'];
      } else if (config.headers && !(config.headers as any)['Content-Type'] && !(config.headers as any)['content-type']) {
        // For standard JSON bodies, set application/json
        (config.headers as any)['Content-Type'] = 'application/json';
      }
    } catch (error) {
      console.error('Error fetching token from storage', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to format errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    const status = error.response?.status;

    return Promise.reject({
      message,
      status,
      originalError: error,
    });
  }
);

export default axiosInstance;
