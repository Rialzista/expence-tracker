import { Query } from '@nestjs/cqrs';
import type { CategoryResponse } from '@expense-tracker/shared';

/** Запрос списка категорий пользователя. */
export class GetCategoriesQuery extends Query<CategoryResponse[]> {
  /** @param userId - идентификатор пользователя */
  constructor(readonly userId: string) {
    super();
  }
}
