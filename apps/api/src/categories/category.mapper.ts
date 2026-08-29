import type { CategoryResponse } from '@expense-tracker/shared';

import type { Category } from '../generated/prisma/client.js';

/**
 * Явно перечисляет поля ответа — userId наружу модуля не отдаётся.
 */
export function toCategoryResponse(category: Category): CategoryResponse {
  return {
    id: category.id,
    name: category.name,
    type: category.type,
    icon: category.icon,
    color: category.color,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}
