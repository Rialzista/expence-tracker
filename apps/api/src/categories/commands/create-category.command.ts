import { Command } from '@nestjs/cqrs';
import type { CategoryResponse, CreateCategoryDto } from '@expense-tracker/shared';

export class CreateCategoryCommand extends Command<CategoryResponse> {
  constructor(
    readonly userId: string,
    readonly dto: CreateCategoryDto,
  ) {
    super();
  }
}
