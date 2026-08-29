import { Command } from '@nestjs/cqrs';
import type { CreateTransactionDto, TransactionResponse } from '@expense-tracker/shared';

export class CreateTransactionCommand extends Command<TransactionResponse> {
  constructor(
    readonly userId: string,
    readonly dto: CreateTransactionDto,
  ) {
    super();
  }
}
