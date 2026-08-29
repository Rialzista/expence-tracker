import { Query } from '@nestjs/cqrs';
import type { Paginated, TransactionQuery, TransactionResponse } from '@expense-tracker/shared';

export class GetTransactionsQuery extends Query<Paginated<TransactionResponse>> {
  constructor(
    readonly userId: string,
    readonly filters: TransactionQuery,
  ) {
    super();
  }
}
