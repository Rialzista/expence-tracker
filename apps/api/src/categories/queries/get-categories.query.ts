import { Query } from '@nestjs/cqrs';
import type { CategoryResponse } from '@expense-tracker/shared';

export class GetCategoriesQuery extends Query<CategoryResponse[]> {
  constructor(readonly userId: string) {
    super();
  }
}
