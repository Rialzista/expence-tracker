import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { CategoryResponse } from '@expense-tracker/shared';

import { CategoriesService } from '../categories.service.js';
import { UpdateCategoryCommand } from './update-category.command.js';

@CommandHandler(UpdateCategoryCommand)
export class UpdateCategoryHandler implements ICommandHandler<UpdateCategoryCommand> {
  constructor(private readonly categories: CategoriesService) {}

  execute(command: UpdateCategoryCommand): Promise<CategoryResponse> {
    return this.categories.update(command.userId, command.id, command.dto);
  }
}
