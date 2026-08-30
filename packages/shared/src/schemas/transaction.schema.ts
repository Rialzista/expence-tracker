import { z } from 'zod';

import { idSchema, moneySchema, paginationQuerySchema } from '../common.js';
import { SUPPORTED_CURRENCIES, currencySchema, transactionTypeSchema } from '../enums.js';

/** Тело запроса на создание операции. */
export const createTransactionSchema = z.object({
  amount: moneySchema,
  currency: currencySchema,
  type: transactionTypeSchema,
  date: z.iso.datetime({ message: 'Ожидается дата в формате ISO 8601' }),
  categoryId: idSchema.optional(),
  note: z.string().trim().max(500).optional(),
});

/**
 * Поля перечислены заново, а не через createTransactionSchema.partial():
 * currency там объявлен как currencySchema, то есть z.enum(...).default('USD'),
 * и в частичной схеме поведение PATCH без currency становится неочевидным.
 * Здесь currency — обычный optional без дефолта: не передали, значит не меняем.
 *
 * note и categoryId дополнительно nullable — так их можно очистить,
 * как это сделано в updateCategorySchema для icon/color.
 */
export const updateTransactionSchema = z
  .object({
    amount: moneySchema.optional(),
    currency: z.enum(SUPPORTED_CURRENCIES).optional(),
    type: transactionTypeSchema.optional(),
    date: z.iso.datetime({ message: 'Ожидается дата в формате ISO 8601' }).optional(),
    categoryId: idSchema.nullable().optional(),
    note: z.string().trim().max(500).nullable().optional(),
  })
  .refine((dto) => Object.keys(dto).length > 0, 'Нужно передать хотя бы одно поле');

/** Формат операции в ответах API. */
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

/**
 * Период агрегации задаётся явно: месяц и год обязательны, значений по
 * умолчанию нет — «сводка неизвестно за что» никому не нужна.
 * Границы месяца считаются в UTC: колонка date — @db.Timestamptz(3).
 */
export const transactionSummaryQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(1970).max(2100),
});

export const categorySummarySchema = z.object({
  /** null — операции, заведённые без категории. */
  categoryId: idSchema.nullable(),
  categoryName: z.string().nullable(),
  type: transactionTypeSchema,
  total: z.string(),
});

/**
 * Суммы — строки, как и amount: Decimal нигде по пути не приводится к number.
 * income и expense положительные, balance = income − expense.
 *
 * Валюта в агрегации не разделяется — суммируются все операции пользователя
 * за период независимо от currency. Мультивалютный сплит — отдельная задача.
 */
export const transactionSummaryResponseSchema = z.object({
  month: z.number(),
  year: z.number(),
  income: z.string(),
  expense: z.string(),
  balance: z.string(),
  byCategory: z.array(categorySummarySchema),
});

export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionDto = z.infer<typeof updateTransactionSchema>;
export type TransactionResponse = z.infer<typeof transactionResponseSchema>;
export type TransactionQuery = z.infer<typeof transactionQuerySchema>;
export type TransactionSummaryQuery = z.infer<typeof transactionSummaryQuerySchema>;
export type CategorySummary = z.infer<typeof categorySummarySchema>;
export type TransactionSummary = z.infer<typeof transactionSummaryResponseSchema>;
