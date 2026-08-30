import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import type { Paginated, TransactionResponse } from '@expense-tracker/shared';

import { TransactionsService } from '../transactions.service.js';
import { GetTransactionsQuery } from './get-transactions.query.js';

@QueryHandler(GetTransactionsQuery)
export class GetTransactionsHandler implements IQueryHandler<GetTransactionsQuery> {
  /** @param transactions - доменный сервис операций */
  constructor(private readonly transactions: TransactionsService) {}

  /**
   * Выполняет GetTransactionsQuery.
   *
   * @param query - запрос с фильтрами и параметрами страницы
   * @returns страница операций с общим количеством
   */
  execute(query: GetTransactionsQuery): Promise<Paginated<TransactionResponse>> {
    return this.transactions.findAll(query.userId, query.filters);
  }
}
