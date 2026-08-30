import type { TransactionResponse } from '@expense-tracker/shared';

import type { Transaction } from '../generated/prisma/client.js';

/**
 * Приводит модель Prisma к формату ответа API.
 *
 * Явно перечисляет поля ответа — userId наружу модуля не отдаётся.
 * amount уходит строкой: Decimal нигде по пути не превращается в number.
 *
 * @param transaction - операция, полученная из Prisma
 * @returns операция в формате ответа API
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
