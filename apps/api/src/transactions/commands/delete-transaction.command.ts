import { Command } from '@nestjs/cqrs';

export class DeleteTransactionCommand extends Command<void> {
  constructor(
    readonly userId: string,
    readonly id: string,
  ) {
    super();
  }
}
