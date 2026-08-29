import { Module } from '@nestjs/common';

import { TransactionsController } from './transactions.controller.js';
import { TransactionsService } from './transactions.service.js';
import { TransactionsRepository } from './transactions.repository.js';
import { TransactionCommandHandlers } from './commands/index.js';
import { TransactionQueryHandlers } from './queries/index.js';

/**
 * Наружу модуль ничего не экспортирует — публичный контракт это классы
 * команд/запросов из ./commands и ./queries. CqrsModule.forRoot() вызывается
 * один раз в AppModule и уже глобален, здесь его импортировать не нужно.
 */
@Module({
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    TransactionsRepository,
    ...TransactionCommandHandlers,
    ...TransactionQueryHandlers,
  ],
})
export class TransactionsModule {}
