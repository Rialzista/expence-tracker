import type { TransactionResponse } from '@expense-tracker/shared';

import { cn } from '@/lib/utils';

import { formatTransactionAmount, formatTransactionDate } from '../lib/format-transaction';

interface TransactionRowProps {
  transaction: TransactionResponse;
  categoryName: string | null;
}

export function TransactionRow({ transaction, categoryName }: TransactionRowProps) {
  const { type, amount, currency, date, note } = transaction;

  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-sm font-medium">{note || categoryName || 'Без описания'}</span>
        <span className="text-xs text-muted-foreground">
          {formatTransactionDate(date)}
          {categoryName ? ` · ${categoryName}` : ''}
        </span>
      </div>
      <span
        className={cn(
          'shrink-0 font-mono text-sm font-semibold',
          type === 'INCOME' ? 'text-green-600' : 'text-red-600',
        )}
      >
        {formatTransactionAmount(amount, type, currency)}
      </span>
    </div>
  );
}
