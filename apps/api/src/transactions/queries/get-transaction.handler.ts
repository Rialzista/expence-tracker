import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import type { TransactionResponse } from '@expense-tracker/shared';

import { TransactionsService } from '../transactions.service.js';
import { GetTransactionQuery } from './get-transaction.query.js';

@QueryHandler(GetTransactionQuery)
export class GetTransactionHandler implements IQueryHandler<GetTransactionQuery> {
  /** @param transactions - доменный сервис операций */
  constructor(private readonly transactions: TransactionsService) {}

  /**
   * Выполняет GetTransactionQuery.
   *
   * @param query - запрос с id операции
   * @returns операция в формате ответа API
   * @throws {NotFoundException} если операция с таким id не найдена у пользователя
   */
  execute(query: GetTransactionQuery): Promise<TransactionResponse> {
    return this.transactions.findOne(query.userId, query.id);
  }
}
