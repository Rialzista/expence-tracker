import { z } from 'zod';

import { idSchema, moneySchema, paginationQuerySchema } from '../common.js';
import { currencySchema, transactionTypeSchema } from '../enums.js';

export const createTransactionSchema = z.object({
  amount: moneySchema,
  currency: currencySchema,
  type: transactionTypeSchema,
  date: z.iso.datetime({ message: 'Ожидается дата в формате ISO 8601' }),
  categoryId: idSchema.optional(),
  note: z.string().trim().max(500).optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const transactionResponseSchema = z.object({
  id: idSchema,
  amount: z.string(),
  currency: z.string(),
  type: transactionTypeSchema,
  date: z.iso.datetime(),
  note: z.string().nullable(),
  categoryId: idSchema.nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

/** Фильтры списка операций: период, категория, тип. */
export const transactionQuerySchema = paginationQuerySchema.extend({
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
  type: transactionTypeSchema.optional(),
  categoryId: idSchema.optional(),
});

export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionDto = z.infer<typeof updateTransactionSchema>;
export type TransactionResponse = z.infer<typeof transactionResponseSchema>;
export type TransactionQuery = z.infer<typeof transactionQuerySchema>;
