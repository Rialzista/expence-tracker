import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { TransactionsService } from '../transactions.service.js';
import { DeleteTransactionCommand } from './delete-transaction.command.js';

@CommandHandler(DeleteTransactionCommand)
export class DeleteTransactionHandler implements ICommandHandler<DeleteTransactionCommand> {
  constructor(private readonly transactions: TransactionsService) {}

  execute(command: DeleteTransactionCommand): Promise<void> {
    return this.transactions.remove(command.userId, command.id);
  }
}
