import { useQuery } from '@tanstack/react-query';

import type { CategoryResponse } from '@expense-tracker/shared';

import { api } from '@/lib/api-client';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<CategoryResponse[]>('/categories'),
  });
}
