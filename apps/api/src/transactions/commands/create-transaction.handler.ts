import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { TransactionResponse } from '@expense-tracker/shared';

import { TransactionsService } from '../transactions.service.js';
import { CreateTransactionCommand } from './create-transaction.command.js';

@CommandHandler(CreateTransactionCommand)
export class CreateTransactionHandler implements ICommandHandler<CreateTransactionCommand> {
  constructor(private readonly transactions: TransactionsService) {}

  execute(command: CreateTransactionCommand): Promise<TransactionResponse> {
    return this.transactions.create(command.userId, command.dto);
  }
}
