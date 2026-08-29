import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import type { TransactionResponse } from '@expense-tracker/shared';

import { TransactionsService } from '../transactions.service.js';
import { GetTransactionQuery } from './get-transaction.query.js';

@QueryHandler(GetTransactionQuery)
export class GetTransactionHandler implements IQueryHandler<GetTransactionQuery> {
  constructor(private readonly transactions: TransactionsService) {}

  execute(query: GetTransactionQuery): Promise<TransactionResponse> {
    return this.transactions.findOne(query.userId, query.id);
  }
}
