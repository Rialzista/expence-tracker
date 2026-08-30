import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { TransactionResponse } from '@expense-tracker/shared';

import { TransactionsService } from '../transactions.service.js';
import { CreateTransactionCommand } from './create-transaction.command.js';

@CommandHandler(CreateTransactionCommand)
export class CreateTransactionHandler implements ICommandHandler<CreateTransactionCommand> {
  /** @param transactions - доменный сервис операций */
  constructor(private readonly transactions: TransactionsService) {}

  /**
   * Выполняет CreateTransactionCommand.
   *
   * @param command - команда с данными новой операции
   * @returns созданная операция
   * @throws {NotFoundException} если указанная в команде категория не найдена у пользователя
   */
  execute(command: CreateTransactionCommand): Promise<TransactionResponse> {
    return this.transactions.create(command.userId, command.dto);
  }
}
