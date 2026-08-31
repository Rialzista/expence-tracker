import type { ReactNode } from 'react';

import type { TransactionResponse } from '@expense-tracker/shared';

import { cn } from '@/lib/utils';

import { formatTransactionAmount, formatTransactionDate } from '../lib/format-transaction';

interface TransactionRowProps {
  transaction: TransactionResponse;
  categoryName: string | null;
  actions?: ReactNode;
}

export function TransactionRow({ transaction, categoryName, actions }: TransactionRowProps) {
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
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={cn('font-mono text-sm font-semibold', type === 'INCOME' ? 'text-green-600' : 'text-red-600')}
        >
          {formatTransactionAmount(amount, type, currency)}
        </span>
        {actions}
      </div>
    </div>
  );
}
