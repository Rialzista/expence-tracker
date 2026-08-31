const moneyFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Для агрегатов (`TransactionSummary`) — в отличие от формы одной операции,
 * тут нет знака, привязанного к `type`, и важна разрядность для крупных сумм.
 */
export function formatMoney(value: string): string {
  return moneyFormatter.format(Number(value));
}
