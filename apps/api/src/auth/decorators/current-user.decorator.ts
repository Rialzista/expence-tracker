import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { AuthenticatedUser } from '../types/jwt-payload.js';

/**
 * @CurrentUser() — весь AuthenticatedUser, @CurrentUser('id') — одно поле.
 */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>();
    return field ? request.user[field] : request.user;
  },
);
