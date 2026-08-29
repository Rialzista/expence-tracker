import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import type { CategoryResponse } from '@expense-tracker/shared';

import { CategoriesService } from '../categories.service.js';
import { GetCategoryByIdQuery } from './get-category-by-id.query.js';

@QueryHandler(GetCategoryByIdQuery)
export class GetCategoryByIdHandler implements IQueryHandler<GetCategoryByIdQuery> {
  constructor(private readonly categories: CategoriesService) {}

  execute(query: GetCategoryByIdQuery): Promise<CategoryResponse | null> {
    return this.categories.findOne(query.userId, query.id);
  }
}
