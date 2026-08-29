import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { CategoriesService } from '../categories.service.js';
import { DeleteCategoryCommand } from './delete-category.command.js';

@CommandHandler(DeleteCategoryCommand)
export class DeleteCategoryHandler implements ICommandHandler<DeleteCategoryCommand> {
  constructor(private readonly categories: CategoriesService) {}

  execute(command: DeleteCategoryCommand): Promise<void> {
    return this.categories.remove(command.userId, command.id);
  }
}
