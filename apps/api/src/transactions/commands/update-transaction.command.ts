import { Command } from '@nestjs/cqrs';
import type { TransactionResponse, UpdateTransactionDto } from '@expense-tracker/shared';

export class UpdateTransactionCommand extends Command<TransactionResponse> {
  constructor(
    readonly userId: string,
    readonly id: string,
    readonly dto: UpdateTransactionDto,
  ) {
    super();
  }
}
