import { z } from 'zod';

/**
 * Зеркалит enum TransactionType из apps/api/prisma/schema.prisma.
 * Пакет намеренно не зависит от @prisma/client: контракты должны собираться
 * и на фронтенде, куда клиент Prisma не попадает.
 */
export const TRANSACTION_TYPES = ['INCOME', 'EXPENSE'] as const;

export const transactionTypeSchema = z.enum(TRANSACTION_TYPES);

export type TransactionType = z.infer<typeof transactionTypeSchema>;

/** Коды валют ISO 4217, которые поддерживает приложение. */
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'RUB', 'GEL', 'KZT'] as const;

export const currencySchema = z.enum(SUPPORTED_CURRENCIES).default('USD');

export type Currency = (typeof SUPPORTED_CURRENCIES)[number];
