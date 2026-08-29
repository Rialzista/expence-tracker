import type { UserResponse } from '@expense-tracker/shared';

import type { User } from '../generated/prisma/client.js';

/**
 * Единственная гарантия, что passwordHash не утечёт наружу модуля users:
 * маппер явно перечисляет поля ответа, а не расшаривает Prisma-модель.
 */
export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
  };
}
