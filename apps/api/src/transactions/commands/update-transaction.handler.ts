import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { TransactionResponse } from '@expense-tracker/shared';

import { TransactionsService } from '../transactions.service.js';
import { UpdateTransactionCommand } from './update-transaction.command.js';

@CommandHandler(UpdateTransactionCommand)
export class UpdateTransactionHandler implements ICommandHandler<UpdateTransactionCommand> {
  constructor(private readonly transactions: TransactionsService) {}

  execute(command: UpdateTransactionCommand): Promise<TransactionResponse> {
    return this.transactions.update(command.userId, command.id, command.dto);
  }
}
