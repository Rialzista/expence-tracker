import { Query } from '@nestjs/cqrs';
import type { TransactionSummary, TransactionSummaryQuery } from '@expense-tracker/shared';

export class GetTransactionsSummaryQuery extends Query<TransactionSummary> {
  constructor(
    readonly userId: string,
    readonly period: TransactionSummaryQuery,
  ) {
    super();
  }
}
