import { Module } from '@nestjs/common';

import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';
import { CategoriesRepository } from './categories.repository.js';
import { CategoryCommandHandlers } from './commands/index.js';
import { CategoryQueryHandlers } from './queries/index.js';

/**
 * Наружу модуль ничего не экспортирует — публичный контракт это классы
 * команд/запросов из ./commands и ./queries. CqrsModule.forRoot() вызывается
 * один раз в AppModule и уже глобален, здесь его импортировать не нужно.
 */
@Module({
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    CategoriesRepository,
    ...CategoryCommandHandlers,
    ...CategoryQueryHandlers,
  ],
})
export class CategoriesModule {}
