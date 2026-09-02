import axiosInstance from './axios';
import { AuthResponse } from '../types/auth';

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  signup: async (
    username: string,
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    try {
      console.log('[FRONTEND SIGNUP] sending request');
      const response = await axiosInstance.post<AuthResponse>('/auth/signup', {
        username,
        firstName,
        lastName,
        email,
        password,
      });
      console.log('[FRONTEND SIGNUP] response', response.status);
      return response.data;
    } catch (error: any) {
      console.log('[FRONTEND SIGNUP ERROR]', {
        message: error?.message,
        code: error?.code,
        status: error?.response?.status,
        data: error?.response?.data,
        url: error?.config?.url,
        baseURL: error?.config?.baseURL,
      });
      throw error;
    }
  },

  getCurrentUser: async (): Promise<AuthResponse> => {
    const response = await axiosInstance.get<AuthResponse>('/auth/me');
    return response.data;
  },
};

export default authApi;
