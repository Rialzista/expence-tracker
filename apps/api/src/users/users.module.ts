import { Module } from '@nestjs/common';

import { UsersService } from './users.service.js';
import { UsersRepository } from './users.repository.js';
import { UserCommandHandlers } from './commands/index.js';
import { UserQueryHandlers } from './queries/index.js';
import { UserEventHandlers } from './events/index.js';

/**
 * Наружу модуль ничего не экспортирует — его публичный контракт это
 * классы команд/запросов из ./commands, ./queries, ./events, которые
 * другие модули импортируют напрямую и отправляют в CommandBus/QueryBus.
 * CqrsModule.forRoot() вызывается один раз в AppModule и уже глобален,
 * поэтому здесь его импортировать не нужно.
 */
@Module({
  providers: [
    UsersService,
    UsersRepository,
    ...UserCommandHandlers,
    ...UserQueryHandlers,
    ...UserEventHandlers,
  ],
})
export class UsersModule {}
