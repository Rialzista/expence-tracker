import type { ReactNode } from 'react';

import type { CategoryResponse } from '@expense-tracker/shared';

import { CategoryIcon } from './category-icon';

interface CategoryRowProps {
  category: CategoryResponse;
  actions?: ReactNode;
}

export function CategoryRow({ category, actions }: CategoryRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: category.color ?? '#94a3b8' }}
        >
          <CategoryIcon slug={category.icon} className="size-4" />
        </span>
        <span className="truncate text-sm font-medium">{category.name}</span>
      </div>
      {actions}
    </div>
  );
}
