import { useMutation } from '@tanstack/react-query';

import type { AuthResponse, LoginDto } from '@expense-tracker/shared';

import { api } from '@/lib/api-client';

export function useLogin() {
  return useMutation({
    mutationFn: (dto: LoginDto) => api.post<AuthResponse>('/auth/login', dto),
  });
}
