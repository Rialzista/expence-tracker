import { Query } from '@nestjs/cqrs';
import type { Paginated, TransactionQuery, TransactionResponse } from '@expense-tracker/shared';

/** Запрос страницы операций пользователя с фильтрами. */
export class GetTransactionsQuery extends Query<Paginated<TransactionResponse>> {
  /**
   * @param userId - идентификатор пользователя
   * @param filters - фильтры и параметры страницы, провалидированные transactionQuerySchema
   */
  constructor(
    readonly userId: string,
    readonly filters: TransactionQuery,
  ) {
    super();
  }
}
