import { Command } from '@nestjs/cqrs';
import type { UserResponse } from '@expense-tracker/shared';

export class CreateUserCommand extends Command<UserResponse> {
  constructor(
    readonly email: string,
    readonly name: string,
    readonly passwordHash: string,
  ) {
    super();
  }
}
