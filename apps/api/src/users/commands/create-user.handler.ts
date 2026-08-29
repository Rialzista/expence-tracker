import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import type { UserResponse } from '@expense-tracker/shared';

import { UsersService } from '../users.service.js';
import { UserRegisteredEvent } from '../events/user-registered.event.js';
import { CreateUserCommand } from './create-user.command.js';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    private readonly users: UsersService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateUserCommand): Promise<UserResponse> {
    const user = await this.users.create(command);
    this.eventBus.publish(new UserRegisteredEvent(user.id, user.email));
    return user;
  }
}
