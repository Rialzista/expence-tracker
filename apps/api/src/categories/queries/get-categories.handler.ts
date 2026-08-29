import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import type { CategoryResponse } from '@expense-tracker/shared';

import { CategoriesService } from '../categories.service.js';
import { GetCategoriesQuery } from './get-categories.query.js';

@QueryHandler(GetCategoriesQuery)
export class GetCategoriesHandler implements IQueryHandler<GetCategoriesQuery> {
  constructor(private readonly categories: CategoriesService) {}

  execute(query: GetCategoriesQuery): Promise<CategoryResponse[]> {
    return this.categories.findAll(query.userId);
  }
}
