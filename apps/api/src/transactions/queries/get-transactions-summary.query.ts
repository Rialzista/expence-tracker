import { Query } from '@nestjs/cqrs';
import type { TransactionSummary, TransactionSummaryQuery } from '@expense-tracker/shared';

/** Запрос сводки по операциям за календарный месяц. */
export class GetTransactionsSummaryQuery extends Query<TransactionSummary> {
  /**
   * @param userId - идентификатор пользователя
   * @param period - month и year агрегируемого периода
   */
  constructor(
    readonly userId: string,
    readonly period: TransactionSummaryQuery,
  ) {
    super();
  }
}
