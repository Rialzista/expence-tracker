import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { CategoryResponse, UpdateCategoryDto } from '@expense-tracker/shared';

import { categoryKeys } from '@/entities/category';
import { api } from '@/lib/api-client';

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCategoryDto }) =>
      api.patch<CategoryResponse>(`/categories/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}
