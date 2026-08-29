import { Command } from '@nestjs/cqrs';
import type { CategoryResponse, UpdateCategoryDto } from '@expense-tracker/shared';

export class UpdateCategoryCommand extends Command<CategoryResponse> {
  constructor(
    readonly userId: string,
    readonly id: string,
    readonly dto: UpdateCategoryDto,
  ) {
    super();
  }
}
