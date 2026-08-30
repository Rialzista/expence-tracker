import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { CreateTransactionDto, TransactionResponse } from '@expense-tracker/shared';

import { transactionKeys } from '@/entities/transaction';
import { api } from '@/lib/api-client';

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateTransactionDto) => api.post<TransactionResponse>('/transactions', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}
