import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import type { Paginated, TransactionResponse } from '@expense-tracker/shared';

import { TransactionsService } from '../transactions.service.js';
import { GetTransactionsQuery } from './get-transactions.query.js';

@QueryHandler(GetTransactionsQuery)
export class GetTransactionsHandler implements IQueryHandler<GetTransactionsQuery> {
  constructor(private readonly transactions: TransactionsService) {}

  execute(query: GetTransactionsQuery): Promise<Paginated<TransactionResponse>> {
    return this.transactions.findAll(query.userId, query.filters);
  }
}
