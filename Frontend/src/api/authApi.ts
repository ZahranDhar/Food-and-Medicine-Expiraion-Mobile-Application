/**
 * authApi.ts — wired to mockApi for frontend testing.
 * Swap the import below back to the real axios-based implementation
 * once your backend is ready.
 */
import { mockAuthApi } from './mockApi';
import { AuthResponse } from '../types/auth';

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> =>
    mockAuthApi.login(email, password),

  signup: async (
    username: string,
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ): Promise<AuthResponse> =>
    mockAuthApi.signup(username, firstName, lastName, email, password),

  getCurrentUser: async (): Promise<AuthResponse> =>
    mockAuthApi.getCurrentUser(),
};

export default authApi;
