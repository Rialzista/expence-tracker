import { Command } from '@nestjs/cqrs';

export class DeleteCategoryCommand extends Command<void> {
  constructor(
    readonly userId: string,
    readonly id: string,
  ) {
    super();
  }
}
