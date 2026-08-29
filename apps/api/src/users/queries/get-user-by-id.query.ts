import { Query } from '@nestjs/cqrs';
import type { UserResponse } from '@expense-tracker/shared';

export class GetUserByIdQuery extends Query<UserResponse | null> {
  constructor(readonly userId: string) {
    super();
  }
}
