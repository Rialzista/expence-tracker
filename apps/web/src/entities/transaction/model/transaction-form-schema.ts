import { z } from 'zod';

import { SUPPORTED_CURRENCIES, moneySchema, transactionTypeSchema } from '@expense-tracker/shared';

/** Сентинел для пункта «Без категории» в селекте — categoryId в схеме API это не принимает. */
export const NO_CATEGORY = 'none';

/**
 * Общая форменная схема для создания и редактирования операции — не createTransactionSchema/
 * updateTransactionSchema напрямую: `<input type="date">` отдаёт "YYYY-MM-DD", а не полный
 * ISO 8601 с временем; категория здесь — сентинел NO_CATEGORY, а не idSchema. Конвертация
 * в DTO нужного эндпоинта происходит в onSubmit конкретной формы.
 */
export const transactionFormSchema = z.object({
  type: transactionTypeSchema,
  amount: moneySchema,
  currency: z.enum(SUPPORTED_CURRENCIES),
  date: z.string().min(1, 'Укажите дату'),
  categoryId: z.string(),
  note: z.string().trim().max(500).optional(),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
