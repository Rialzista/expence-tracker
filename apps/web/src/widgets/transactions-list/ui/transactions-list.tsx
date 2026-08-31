'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { useCategories } from '@/entities/category';
import { TransactionRow, useTransactions } from '@/entities/transaction';
import { getErrorMessage } from '@/lib/api-client';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { TransactionRowActions } from './transaction-row-actions';

const LIMIT = 10;

export function TransactionsList() {
  const [page, setPage] = useState(1);

  const transactions = useTransactions({ page, limit: LIMIT });
  const categories = useCategories();

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categories.data ?? []) {
      map.set(category.id, category.name);
    }
    return map;
  }, [categories.data]);

  if (transactions.isPending) {
    return (
      <div className="space-y-3 rounded-3xl bg-card p-6">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (transactions.isError) {
    return (
      <p className="rounded-3xl bg-card p-6 text-sm text-destructive">
        {getErrorMessage(transactions.error, 'Не удалось загрузить операции')}
      </p>
    );
  }

  const { items, total } = transactions.data;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  if (items.length === 0) {
    return <p className="rounded-3xl bg-card p-6 text-sm text-muted-foreground">Транзакций пока нет.</p>;
  }

  return (
    <div className="rounded-3xl bg-card p-6">
      <div className={transactions.isPlaceholderData ? 'opacity-60' : undefined}>
        {items.map((transaction) => (
          <TransactionRow
            key={transaction.id}
            transaction={transaction}
            categoryName={transaction.categoryId ? (categoryNameById.get(transaction.categoryId) ?? null) : null}
            actions={<TransactionRowActions transaction={transaction} />}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((current) => current - 1)}
        >
          <ChevronLeft />
          Назад
        </Button>
        <span className="text-sm text-muted-foreground">
          Страница {page} из {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page * LIMIT >= total}
          onClick={() => setPage((current) => current + 1)}
        >
          Вперёд
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
