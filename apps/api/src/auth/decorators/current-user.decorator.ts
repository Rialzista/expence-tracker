import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { AuthenticatedUser } from '../types/jwt-payload.js';

/**
 * Достаёт текущего пользователя из запроса (кладёт туда JwtStrategy.validate).
 *
 * @CurrentUser() — весь AuthenticatedUser, @CurrentUser('id') — одно поле.
 *
 * @param field - поле AuthenticatedUser для выборки; не передано — вернётся весь объект
 * @param ctx - контекст выполнения текущего запроса
 * @returns значение поля или весь AuthenticatedUser
 */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>();
    return field ? request.user[field] : request.user;
  },
);
