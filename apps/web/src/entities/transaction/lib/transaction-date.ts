function formatDateParts(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Локальная календарная дата "сегодня" — значение по умолчанию для новой операции. */
export function todayDateInputValue(): string {
  const now = new Date();

  return formatDateParts(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/**
 * Календарная дата уже сохранённой операции для `<input type="date">`. `date` хранится
 * как UTC-полночь того дня, что ввёл пользователь (см. onSubmit в форме создания/
 * редактирования) — здесь нужны getUTC*-геттеры, а не локальные: иначе у пользователей
 * западнее UTC полночь сдвинула бы отображаемый день на сутки назад.
 */
export function dateInputValueFromIso(iso: string): string {
  const date = new Date(iso);

  return formatDateParts(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}
