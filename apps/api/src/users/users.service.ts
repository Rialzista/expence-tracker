import { ConflictException, Injectable } from '@nestjs/common';
import type { UserResponse } from '@expense-tracker/shared';

import { Prisma } from '../generated/prisma/client.js';
import { UsersRepository } from './users.repository.js';
import { toUserResponse } from './user.mapper.js';
import type { UserCredentials } from './user-credentials.js';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

/**
 * Доменный слой пользователя. Не экспортируется из UsersModule —
 * вызывается только обработчиками команд/запросов этого же модуля.
 */
@Injectable()
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  async create(data: { email: string; name: string; passwordHash: string }): Promise<UserResponse> {
    const email = this.normalizeEmail(data.email);

    const existing = await this.repository.findByEmail(email);
    if (existing) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    try {
      const user = await this.repository.create({ ...data, email });
      return toUserResponse(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_VIOLATION
      ) {
        throw new ConflictException('Пользователь с таким email уже существует');
      }
      throw error;
    }
  }

  async findById(id: string): Promise<UserResponse | null> {
    const user = await this.repository.findById(id);
    return user ? toUserResponse(user) : null;
  }

  async findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    const user = await this.repository.findByEmail(this.normalizeEmail(email));
    if (!user) {
      return null;
    }

    return { user: toUserResponse(user), passwordHash: user.passwordHash };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
