import { useQuery } from '@tanstack/react-query';

import type { TransactionSummary } from '@expense-tracker/shared';

import { api } from '@/lib/api-client';

import { transactionKeys } from './query-keys';

interface UseTransactionsSummaryParams {
  month: number;
  year: number;
}

export function useTransactionsSummary({ month, year }: UseTransactionsSummaryParams) {
  return useQuery({
    queryKey: transactionKeys.summary({ month, year }),
    queryFn: () => {
      const query = new URLSearchParams({ month: String(month), year: String(year) });

      return api.get<TransactionSummary>(`/transactions/summary?${query.toString()}`);
    },
  });
}
