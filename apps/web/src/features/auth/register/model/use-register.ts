import { useMutation } from '@tanstack/react-query';

import type { AuthResponse, RegisterDto } from '@expense-tracker/shared';

import { api } from '@/lib/api-client';

export function useRegister() {
  return useMutation({
    mutationFn: (dto: RegisterDto) => api.post<AuthResponse>('/auth/register', dto),
  });
}
