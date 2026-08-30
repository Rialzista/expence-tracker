import { Command } from '@nestjs/cqrs';
import type { CreateTransactionDto, TransactionResponse } from '@expense-tracker/shared';

/** Команда на создание операции. */
export class CreateTransactionCommand extends Command<TransactionResponse> {
  /**
   * @param userId - владелец создаваемой операции
   * @param dto - данные операции из тела запроса, провалидированные createTransactionSchema
   */
  constructor(
    readonly userId: string,
    readonly dto: CreateTransactionDto,
  ) {
    super();
  }
}
