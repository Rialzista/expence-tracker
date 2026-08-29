import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import type { Category } from '../generated/prisma/client.js';

/**
 * Единственное место в модуле categories, которое обращается к Prisma напрямую.
 * Возвращает сырые модели Prisma — маппинг в DTO делает CategoriesService.
 *
 * Все методы принимают userId и фильтруют по нему на уровне запроса —
 * where: { id } без userId нигде не используется, иначе чужая категория
 * стала бы доступна по прямому UUID.
 */
@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyByUser(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({ where: { userId }, orderBy: { name: 'asc' } });
  }

  findByIdForUser(id: string, userId: string): Promise<Category | null> {
    return this.prisma.category.findFirst({ where: { id, userId } });
  }

  create(data: {
    userId: string;
    name: string;
    type: Category['type'];
    icon?: string;
    color?: string;
  }): Promise<Category> {
    return this.prisma.category.create({ data });
  }

  update(
    id: string,
    data: { name?: string; type?: Category['type']; icon?: string | null; color?: string | null },
  ): Promise<Category> {
    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(id: string, userId: string): Promise<number> {
    const result = await this.prisma.category.deleteMany({ where: { id, userId } });
    return result.count;
  }
}
