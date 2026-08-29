import type { TransactionResponse } from '@expense-tracker/shared';

import type { Transaction } from '../generated/prisma/client.js';

/**
 * Явно перечисляет поля ответа — userId наружу модуля не отдаётся.
 * amount уходит строкой: Decimal нигде по пути не превращается в number.
 */
export function toTransactionResponse(transaction: Transaction): TransactionResponse {
  return {
    id: transaction.id,
    amount: transaction.amount.toFixed(2),
    currency: transaction.currency,
    type: transaction.type,
    date: transaction.date.toISOString(),
    note: transaction.note,
    categoryId: transaction.categoryId,
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  };
}
