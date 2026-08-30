import { z } from 'zod';

/** Идентификаторы во всех моделях — UUID v4, генерируются базой. */
export const idSchema = z.uuid();

/**
 * Денежная сумма передаётся по сети строкой, а не числом.
 * В базе это Decimal(12,2), и приведение к double на любом участке пути
 * даёт ошибку округления — строка проходит от Prisma до формы без потерь.
 */
export const moneySchema = z
  .string()
  .regex(/^-?\d{1,10}(\.\d{1,2})?$/, 'Ожидается сумма с не более чем двумя знаками после точки')
  .refine((value) => Number(value) !== 0, 'Сумма не может быть нулевой');

/** Параметры постраничной выборки, общие для всех списочных эндпоинтов. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** Страница элементов списочного эндпоинта вместе с общим количеством по фильтрам. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/** Формат тела ответа при ошибке — его отдаёт HttpExceptionFilter в API. */
export const apiErrorSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  errors: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string(),
  path: z.string(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
