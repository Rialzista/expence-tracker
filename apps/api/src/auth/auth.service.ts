import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import type { AuthResponse, LoginDto, RegisterDto, UserResponse } from '@expense-tracker/shared';

import { CreateUserCommand } from '../users/commands/index.js';
import { GetUserByIdQuery, GetUserCredentialsByEmailQuery } from '../users/queries/index.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const user = await this.commandBus.execute(
      new CreateUserCommand(dto.email, dto.name, passwordHash),
    );

    return this.issueToken(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const credentials = await this.queryBus.execute(
      new GetUserCredentialsByEmailQuery(dto.email),
    );

    // Один и тот же ответ для «нет такого email» и «неверный пароль» —
    // иначе по коду ответа перебирается список зарегистрированных адресов.
    if (!credentials) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isPasswordValid = await argon2.verify(credentials.passwordHash, dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    return this.issueToken(credentials.user);
  }

  async me(userId: string): Promise<UserResponse> {
    const user = await this.queryBus.execute(new GetUserByIdQuery(userId));
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }

  private async issueToken(user: UserResponse): Promise<AuthResponse> {
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email });
    return { accessToken, user };
  }
}
