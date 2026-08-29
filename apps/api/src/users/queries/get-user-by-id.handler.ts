import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import type { UserResponse } from '@expense-tracker/shared';

import { UsersService } from '../users.service.js';
import { GetUserByIdQuery } from './get-user-by-id.query.js';

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(private readonly users: UsersService) {}

  execute(query: GetUserByIdQuery): Promise<UserResponse | null> {
    return this.users.findById(query.userId);
  }
}
