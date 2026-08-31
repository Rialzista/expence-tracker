import { useMutation, useQueryClient } from '@tanstack/react-query';

import { categoryKeys } from '@/entities/category';
import { transactionKeys } from '@/entities/transaction';
import { api } from '@/lib/api-client';

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      // Prisma обнуляет categoryId у связанных транзакций каскадом (onDelete: SetNull) —
      // кэш списка транзакций мог закешировать уже неактуальную категорию.
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}
