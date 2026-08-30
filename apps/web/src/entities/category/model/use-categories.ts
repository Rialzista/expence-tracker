import { useQuery } from '@tanstack/react-query';

import type { CategoryResponse } from '@expense-tracker/shared';

import { api } from '@/lib/api-client';

import { categoryKeys } from './query-keys';

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: () => api.get<CategoryResponse[]>('/categories'),
  });
}
