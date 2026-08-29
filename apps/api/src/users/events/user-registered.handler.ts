import { Logger } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';

import { UserRegisteredEvent } from './user-registered.event.js';

/**
 * Точка расширения: сюда позже встанет создание набора категорий
 * по умолчанию (CategoriesModule подпишется на то же событие),
 * без прямых вызовов между модулями.
 */
@EventsHandler(UserRegisteredEvent)
export class UserRegisteredHandler implements IEventHandler<UserRegisteredEvent> {
  private readonly logger = new Logger(UserRegisteredHandler.name);

  handle(event: UserRegisteredEvent): void {
    this.logger.log(`Зарегистрирован пользователь ${event.email} (${event.userId})`);
  }
}
