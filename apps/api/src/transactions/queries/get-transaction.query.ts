import { Query } from '@nestjs/cqrs';
import type { TransactionResponse } from '@expense-tracker/shared';

export class GetTransactionQuery extends Query<TransactionResponse> {
  constructor(
    readonly userId: string,
    readonly id: string,
  ) {
    super();
  }
}
