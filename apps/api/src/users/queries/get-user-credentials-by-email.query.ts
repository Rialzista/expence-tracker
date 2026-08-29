import { Query } from '@nestjs/cqrs';

import type { UserCredentials } from '../user-credentials.js';

/**
 * Имя намеренно называет вещи своими именами: результат содержит хеш
 * пароля, и по названию видно, что это запрос не «для всех» — только
 * для входа. Не путать с GetUserByIdQuery.
 */
export class GetUserCredentialsByEmailQuery extends Query<UserCredentials | null> {
  constructor(readonly email: string) {
    super();
  }
}
