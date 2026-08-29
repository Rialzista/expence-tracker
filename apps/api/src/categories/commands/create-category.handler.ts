import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { CategoryResponse } from '@expense-tracker/shared';

import { CategoriesService } from '../categories.service.js';
import { CreateCategoryCommand } from './create-category.command.js';

@CommandHandler(CreateCategoryCommand)
export class CreateCategoryHandler implements ICommandHandler<CreateCategoryCommand> {
  constructor(private readonly categories: CategoriesService) {}

  execute(command: CreateCategoryCommand): Promise<CategoryResponse> {
    return this.categories.create(command.userId, command.dto);
  }
}
