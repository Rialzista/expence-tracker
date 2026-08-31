import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

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
  const isIncome = type === 'INCOME';

  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full',
            isIncome ? 'bg-mint text-foreground' : 'bg-peach text-foreground',
          )}
        >
          {isIncome ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-medium">{note || categoryName || 'Без описания'}</span>
          <span className="text-xs text-muted-foreground">
            {formatTransactionDate(date)}
            {categoryName ? ` · ${categoryName}` : ''}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={cn('font-mono text-sm font-semibold', isIncome ? 'text-green-600' : 'text-red-600')}
        >
          {formatTransactionAmount(amount, type, currency)}
        </span>
        {actions}
      </div>
    </div>
  );
}
