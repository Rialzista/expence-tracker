import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { QueryBus } from '@nestjs/cqrs';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type { Env } from '../config/env.schema.js';
import { GetUserByIdQuery } from '../users/queries/index.js';
import type { AuthenticatedUser, JwtPayload } from './types/jwt-payload.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService<Env, true>,
    private readonly queryBus: QueryBus,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET', { infer: true }),
    });
  }

  // Обращение к БД на каждый запрос осознанное: удалённый пользователь
  // перестаёт проходить с ещё не истёкшим токеном.
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.queryBus.execute(new GetUserByIdQuery(payload.sub));
    if (!user) {
      throw new UnauthorizedException();
    }

    return { id: user.id, email: user.email };
  }
}
