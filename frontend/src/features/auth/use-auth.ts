import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authKeys } from '@/lib/query-keys';
import { authApi } from './api';

export function useMe() {
  return useQuery({ queryKey: authKeys.me, queryFn: authApi.me });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me, user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me, user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Drops the previous user's tasks as well, so they never flash for the next one.
      queryClient.clear();
    },
  });
}
