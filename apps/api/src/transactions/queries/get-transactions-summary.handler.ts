import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import type { TransactionSummary } from '@expense-tracker/shared';

import { TransactionsService } from '../transactions.service.js';
import { GetTransactionsSummaryQuery } from './get-transactions-summary.query.js';

@QueryHandler(GetTransactionsSummaryQuery)
export class GetTransactionsSummaryHandler implements IQueryHandler<GetTransactionsSummaryQuery> {
  constructor(private readonly transactions: TransactionsService) {}

  execute(query: GetTransactionsSummaryQuery): Promise<TransactionSummary> {
    return this.transactions.getSummary(query.userId, query.period);
  }
}
