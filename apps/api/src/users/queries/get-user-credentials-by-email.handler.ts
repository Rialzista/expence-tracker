import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';

import { UsersService } from '../users.service.js';
import type { UserCredentials } from '../user-credentials.js';
import { GetUserCredentialsByEmailQuery } from './get-user-credentials-by-email.query.js';

@QueryHandler(GetUserCredentialsByEmailQuery)
export class GetUserCredentialsByEmailHandler
  implements IQueryHandler<GetUserCredentialsByEmailQuery>
{
  constructor(private readonly users: UsersService) {}

  execute(query: GetUserCredentialsByEmailQuery): Promise<UserCredentials | null> {
    return this.users.findCredentialsByEmail(query.email);
  }
}
