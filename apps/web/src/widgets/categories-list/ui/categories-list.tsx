'use client';

import { CategoryRow, useCategories } from '@/entities/category';
import { getErrorMessage } from '@/lib/api-client';
import { Skeleton } from '@/shared/ui/skeleton';

export function CategoriesList() {
  const categories = useCategories();

  if (categories.isPending) {
    return (
      <div className="mt-6 space-y-3">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (categories.isError) {
    return (
      <p className="mt-6 text-sm text-destructive">
        {getErrorMessage(categories.error, 'Не удалось загрузить категории')}
      </p>
    );
  }

  const items = categories.data;

  if (items.length === 0) {
    return <p className="mt-6 text-sm text-muted-foreground">Категорий пока нет.</p>;
  }

  const expense = items.filter((category) => category.type === 'EXPENSE');
  const income = items.filter((category) => category.type === 'INCOME');

  return (
    <div className="mt-6 space-y-6">
      {expense.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground">Расходы</h2>
          <div className="mt-2">
            {expense.map((category) => (
              <CategoryRow key={category.id} category={category} />
            ))}
          </div>
        </section>
      ) : null}
      {income.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground">Доходы</h2>
          <div className="mt-2">
            {income.map((category) => (
              <CategoryRow key={category.id} category={category} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
