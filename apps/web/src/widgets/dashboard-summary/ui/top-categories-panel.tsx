import type { CategorySummary } from '@expense-tracker/shared';

import { getCategoryIcon, useCategories } from '@/entities/category';
import { formatMoney } from '@/entities/transaction';

interface TopCategoriesPanelProps {
  byCategory: CategorySummary[];
}

const TOP_LIMIT = 5;

export function TopCategoriesPanel({ byCategory }: TopCategoriesPanelProps) {
  const categories = useCategories();

  const top = byCategory
    .filter((entry) => entry.type === 'EXPENSE')
    .sort((a, b) => Number(b.total) - Number(a.total))
    .slice(0, TOP_LIMIT);

  return (
    <div className="flex h-full flex-col rounded-3xl bg-primary p-6 text-primary-foreground">
      <h2 className="text-sm font-semibold">Топ категорий</h2>
      {top.length === 0 ? (
        <p className="mt-4 text-sm text-primary-foreground/60">Расходов пока нет.</p>
      ) : (
        <div className="mt-4 flex flex-col">
          {top.map((entry) => {
            const category = categories.data?.find((item) => item.id === entry.categoryId);
            const Icon = getCategoryIcon(category?.icon);

            return (
              <div
                key={entry.categoryId ?? 'none'}
                className="flex items-center justify-between gap-3 border-b border-white/10 py-3 last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: category?.color ?? '#94a3b8' }}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="truncate text-sm font-medium">
                    {entry.categoryName ?? 'Без категории'}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-sm font-semibold">{formatMoney(entry.total)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
