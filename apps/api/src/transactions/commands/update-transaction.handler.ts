import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { TransactionResponse } from '@expense-tracker/shared';

import { TransactionsService } from '../transactions.service.js';
import { UpdateTransactionCommand } from './update-transaction.command.js';

@CommandHandler(UpdateTransactionCommand)
export class UpdateTransactionHandler implements ICommandHandler<UpdateTransactionCommand> {
  /** @param transactions - доменный сервис операций */
  constructor(private readonly transactions: TransactionsService) {}

  /**
   * Выполняет UpdateTransactionCommand.
   *
   * @param command - команда с id операции и изменяемыми полями
   * @returns обновлённая операция
   * @throws {NotFoundException} если операция или указанная категория не найдены
   */
  execute(command: UpdateTransactionCommand): Promise<TransactionResponse> {
    return this.transactions.update(command.userId, command.id, command.dto);
  }
}
