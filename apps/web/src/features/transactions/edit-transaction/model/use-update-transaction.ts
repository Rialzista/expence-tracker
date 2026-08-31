import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { TransactionResponse, UpdateTransactionDto } from '@expense-tracker/shared';

import { transactionKeys } from '@/entities/transaction';
import { api } from '@/lib/api-client';

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTransactionDto }) =>
      api.patch<TransactionResponse>(`/transactions/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}
