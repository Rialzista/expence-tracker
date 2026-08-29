import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import type { User } from '../generated/prisma/client.js';

/**
 * Единственное место в модуле users, которое обращается к Prisma напрямую.
 * Возвращает сырые модели Prisma — маппинг в DTO делает UsersService.
 */
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  create(data: { email: string; name: string; passwordHash: string }): Promise<User> {
    return this.prisma.user.create({ data });
  }
}
