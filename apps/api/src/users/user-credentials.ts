import type { UserResponse } from '@expense-tracker/shared';

/**
 * Внутренний контракт бэкенда — в отличие от UserResponse, наружу
 * (в браузер) никогда не уходит. Нужен только AuthService.login.
 */
export interface UserCredentials {
  user: UserResponse;
  passwordHash: string;
}
