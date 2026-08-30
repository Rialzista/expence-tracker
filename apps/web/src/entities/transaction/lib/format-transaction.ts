import type { TransactionType } from '@expense-tracker/shared';

/**
 * timeZone: 'UTC' — `date` хранит календарную дату операции как UTC-полночь
 * (см. today() в create-transaction-form.tsx); форматирование в локальном поясе
 * сдвигало бы отображаемый день для пользователей вне UTC.
 */
const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatTransactionDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

/**
 * Знак и цвет берём только из `type` — знак в самой строке `amount` не гарантирован
 * (moneySchema в packages/shared допускает как "-123.45", так и "123.45" независимо
 * от type). Ведущий "-" срезаем строкой, а не через Number(), чтобы не терять
 * точность Decimal(12,2).
 */
export function formatTransactionAmount(amount: string, type: TransactionType, currency: string): string {
  const unsigned = amount.startsWith('-') ? amount.slice(1) : amount;
  const sign = type === 'INCOME' ? '+' : '-';

  return `${sign}${unsigned} ${currency}`;
}
