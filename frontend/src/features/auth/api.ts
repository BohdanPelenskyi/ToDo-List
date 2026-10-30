import { apiClient } from '@/lib/api-client';
import type { Credentials, RegisterInput, User } from '@/types/api';

interface UserResponse {
  user: User;
}

export const authApi = {
  me: async () => (await apiClient.get<UserResponse>('/auth/me')).user,
  login: async (credentials: Credentials) =>
    (await apiClient.post<UserResponse>('/auth/login', credentials)).user,
  register: async (input: RegisterInput) =>
    (await apiClient.post<UserResponse>('/auth/register', input)).user,
  logout: () => apiClient.post<undefined>('/auth/logout'),
};
