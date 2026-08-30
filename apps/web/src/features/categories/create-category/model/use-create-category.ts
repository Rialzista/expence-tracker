import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { CategoryResponse, CreateCategoryDto } from '@expense-tracker/shared';

import { categoryKeys } from '@/entities/category';
import { api } from '@/lib/api-client';

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateCategoryDto) => api.post<CategoryResponse>('/categories', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}
