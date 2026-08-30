import { Command } from '@nestjs/cqrs';
import type { TransactionResponse, UpdateTransactionDto } from '@expense-tracker/shared';

/** Команда на обновление операции. */
export class UpdateTransactionCommand extends Command<TransactionResponse> {
  /**
   * @param userId - владелец обновляемой операции
   * @param id - идентификатор обновляемой операции
   * @param dto - изменяемые поля, провалидированные updateTransactionSchema
   */
  constructor(
    readonly userId: string,
    readonly id: string,
    readonly dto: UpdateTransactionDto,
  ) {
    super();
  }
}
