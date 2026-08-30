import { Query } from '@nestjs/cqrs';
import type { TransactionResponse } from '@expense-tracker/shared';

/** Запрос одной операции по id. */
export class GetTransactionQuery extends Query<TransactionResponse> {
  /**
   * @param userId - идентификатор пользователя, которому должна принадлежать операция
   * @param id - идентификатор операции
   */
  constructor(
    readonly userId: string,
    readonly id: string,
  ) {
    super();
  }
}
