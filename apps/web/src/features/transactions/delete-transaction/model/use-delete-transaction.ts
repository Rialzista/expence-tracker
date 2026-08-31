import { useMutation, useQueryClient } from '@tanstack/react-query';

import { transactionKeys } from '@/entities/transaction';
import { api } from '@/lib/api-client';

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}
