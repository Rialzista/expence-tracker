import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { Paginated, TransactionResponse } from '@expense-tracker/shared';

import { api } from '@/lib/api-client';

import { transactionKeys } from './query-keys';

interface UseTransactionsParams {
  page: number;
  limit: number;
}

export function useTransactions({ page, limit }: UseTransactionsParams) {
  return useQuery({
    queryKey: transactionKeys.list({ page, limit }),
    queryFn: () => {
      const query = new URLSearchParams({ page: String(page), limit: String(limit) });

      return api.get<Paginated<TransactionResponse>>(`/transactions?${query.toString()}`);
    },
    placeholderData: keepPreviousData,
  });
}
