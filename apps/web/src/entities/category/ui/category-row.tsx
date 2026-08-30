import type { CategoryResponse } from '@expense-tracker/shared';

import { getCategoryIcon } from '../lib/category-icons';

interface CategoryRowProps {
  category: CategoryResponse;
}

export function CategoryRow({ category }: CategoryRowProps) {
  const Icon = getCategoryIcon(category.icon);

  return (
    <div className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: category.color ?? '#94a3b8' }}
      >
        <Icon className="size-4" />
      </span>
      <span className="truncate text-sm font-medium">{category.name}</span>
    </div>
  );
}
