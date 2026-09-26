import type { TRANSACTION_TYPES } from '@expense-tracker/shared';

export const TRANSACTION_TYPE_LABELS: Record<(typeof TRANSACTION_TYPES)[number], string> = {
  EXPENSE: 'Расход',
  INCOME: 'Доход',
};
