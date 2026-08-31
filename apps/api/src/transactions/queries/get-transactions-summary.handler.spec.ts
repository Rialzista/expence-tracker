import { describe, expect, it, vi } from 'vitest';
import type { TransactionSummary } from '@expense-tracker/shared';

import { GetTransactionsSummaryHandler } from './get-transactions-summary.handler.js';
import { GetTransactionsSummaryQuery } from './get-transactions-summary.query.js';
import type { TransactionsService } from '../transactions.service.js';

const summary: TransactionSummary = {
  month: 8,
  year: 2026,
  income: '1000.00',
  expense: '400.00',
  balance: '600.00',
  byCategory: [
    { categoryId: '00000000-0000-4000-8000-000000000001', categoryName: 'Еда', type: 'expense', total: '400.00' },
  ],
};

describe('GetTransactionsSummaryHandler', () => {
  it('делегирует получение сводки TransactionsService.getSummary с userId и period из запроса', async () => {
    const transactions = { getSummary: vi.fn().mockResolvedValue(summary) };
    const handler = new GetTransactionsSummaryHandler(transactions as unknown as TransactionsService);

    const result = await handler.execute(
      new GetTransactionsSummaryQuery('00000000-0000-4000-8000-000000000099', { month: 8, year: 2026 }),
    );

    expect(result).toEqual(summary);
    expect(transactions.getSummary).toHaveBeenCalledWith('00000000-0000-4000-8000-000000000099', {
      month: 8,
      year: 2026,
    });
  });

  it('пробрасывает ошибку TransactionsService.getSummary без изменений', async () => {
    const error = new Error('нет данных');
    const transactions = { getSummary: vi.fn().mockRejectedValue(error) };
    const handler = new GetTransactionsSummaryHandler(transactions as unknown as TransactionsService);

    await expect(
      handler.execute(
        new GetTransactionsSummaryQuery('00000000-0000-4000-8000-000000000099', { month: 8, year: 2026 }),
      ),
    ).rejects.toBe(error);
  });
});
