'use client';

import { useMemo } from 'react';

import { useCategories } from '@/entities/category';
import { TransactionRow, useTransactions } from '@/entities/transaction';
import { getErrorMessage } from '@/lib/api-client';
import { Skeleton } from '@/shared/ui/skeleton';

const LIMIT = 5;

export function RecentActivities() {
  const transactions = useTransactions({ page: 1, limit: LIMIT });
  const categories = useCategories();

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categories.data ?? []) {
      map.set(category.id, category.name);
    }
    return map;
  }, [categories.data]);

  return (
    <div className="rounded-3xl bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground">Последние операции</h2>
      <div className="mt-4">
        {transactions.isPending ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : transactions.isError ? (
          <p className="text-sm text-destructive">
            {getErrorMessage(transactions.error, 'Не удалось загрузить операции')}
          </p>
        ) : transactions.data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Транзакций пока нет.</p>
        ) : (
          transactions.data.items.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              categoryName={transaction.categoryId ? (categoryNameById.get(transaction.categoryId) ?? null) : null}
            />
          ))
        )}
      </div>
    </div>
  );
}
