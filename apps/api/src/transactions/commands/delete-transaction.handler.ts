import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { TransactionsService } from '../transactions.service.js';
import { DeleteTransactionCommand } from './delete-transaction.command.js';

@CommandHandler(DeleteTransactionCommand)
export class DeleteTransactionHandler implements ICommandHandler<DeleteTransactionCommand> {
  /** @param transactions - доменный сервис операций */
  constructor(private readonly transactions: TransactionsService) {}

  /**
   * Выполняет DeleteTransactionCommand.
   *
   * @param command - команда с id удаляемой операции
   * @returns ничего не возвращает
   * @throws {NotFoundException} если операция с таким id не найдена у пользователя
   */
  execute(command: DeleteTransactionCommand): Promise<void> {
    return this.transactions.remove(command.userId, command.id);
  }
}
